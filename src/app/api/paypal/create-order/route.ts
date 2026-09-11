// Creates a PayPal order for a single Kojo Builds package. The package is
// re-priced server-side from products.ts (never trust a client-sent price),
// then mirrored into Firestore as a pending order so it shows in the CRM
// immediately — even before the customer completes payment.

import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getPackage, isOwnable, outrightPrice, outrightUnitPrice } from "@/lib/products";
import { Timestamp } from "firebase-admin/firestore";

interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  business?: string;
  website?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { pkg, amount, customer, items, mode, label } = (await req.json()) as {
      pkg?: string;
      amount?: number; // one-off custom amount (£), clamped
      customer?: CustomerInfo;
      items?: { pkg: string; qty: number }[];
      mode?: string;
      /** What to call this on the PayPal page and in the CRM, e.g. a deposit. */
      label?: string;
    };
    const cleanLabel = (label || "").trim().slice(0, 60);

    const product = pkg ? getPackage(pkg) : undefined;

    // An outright cart is re-priced here from products.ts — the client sends
    // which packages and how many, never what they cost. Anything not ownable
    // is rejected outright rather than quietly billed at five years.
    let outrightTotal: number | null = null;
    let outrightNames: string[] = [];
    if (mode === "outright" && Array.isArray(items) && items.length > 0) {
      let sum = 0;
      for (const it of items) {
        const p = getPackage(it.pkg);
        if (!p || !isOwnable(p)) {
          return NextResponse.json({ error: "That package can't be bought outright" }, { status: 400 });
        }
        const qty = Math.max(1, Math.min(20, Math.round(Number(it.qty) || 1)));
        sum += (p.perUnit != null ? outrightUnitPrice(p) : outrightPrice(p)) * qty;
        outrightNames.push(p.name);
      }
      outrightTotal = sum;
    }

    // A custom one-off amount overrides the package price.
    const custom = typeof amount === "number" && amount >= 5 && amount <= 100000 ? Math.round(amount) : null;
    if (!product && custom == null && outrightTotal == null) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }

    const unitAmount = outrightTotal ?? custom ?? product!.price;
    const lineName = outrightTotal != null
      ? `Dygiko — ${outrightNames.join(" + ")} (outright)`
      : cleanLabel
        ? `Dygiko — ${cleanLabel}`
        : product ? `Dygiko — ${product.name}` : "Dygiko — Custom (one-off)";
    const lineDesc = outrightTotal != null
      ? "Five years upfront — project and content are yours"
      : cleanLabel
        ? "Credited against your first invoice"
        : product?.tagline || "One-off payment";

    const order = await createPayPalOrder([
      {
        name: lineName,
        description: lineDesc,
        quantity: 1,
        unitAmount,
      },
    ]);

    // Mirror as a pending order in Firestore (best-effort — payment still
    // works if Firebase admin isn't configured).
    if (customer?.email) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const shortCode = order.id.slice(-6).toUpperCase();
        await adminDb().collection("orders").doc(`pp_${order.id}`).set({
          paypalOrderId: order.id,
          friendlyId: `KB-${shortCode}`,
          paymentProvider: "paypal",
          status: "pending_payment",
          packageKey: outrightTotal != null ? "outright" : (product?.key || "custom"),
          packageName: outrightTotal != null
            ? `${outrightNames.join(" + ")} (outright, ${items!.length} item${items!.length > 1 ? "s" : ""})`
            : cleanLabel || product?.name || "Custom (one-off)",
          customer: {
            name: customer.name || null,
            email: customer.email,
            phone: customer.phone || null,
            business: customer.business || null,
            website: customer.website || null,
          },
          amountTotal: Math.round(unitAmount * 100),
          currency: "gbp",
          notes: customer.notes || "",
          createdAt: Timestamp.now(),
        });
      } catch (err) {
        console.error("Pending order write skipped:", err);
      }
    }

    return NextResponse.json({ id: order.id });
  } catch (err) {
    console.error("PayPal create error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
