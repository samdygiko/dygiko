// Creates a PayPal order for a single Kojo Builds package. The package is
// re-priced server-side from products.ts (never trust a client-sent price),
// then mirrored into Firestore as a pending order so it shows in the CRM
// immediately — even before the customer completes payment.

import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getPackage } from "@/lib/products";
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
    const { pkg, amount, customer, label } = (await req.json()) as {
      pkg?: string;
      amount?: number; // one-off custom amount (£), clamped
      customer?: CustomerInfo;
      /** What to call this on the PayPal page and in the CRM, e.g. a deposit. */
      label?: string;
    };
    const cleanLabel = (label || "").trim().slice(0, 60);

    const product = pkg ? getPackage(pkg) : undefined;
    // A custom one-off amount (a deposit, or a bespoke price link) overrides
    // the package price. Previously this was ignored and the package price was
    // charged regardless, so a £25 deposit link would have taken the full
    // package fee.
    const custom = typeof amount === "number" && amount >= 5 && amount <= 100000 ? Math.round(amount) : null;
    if (!product && custom == null) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }

    const unitAmount = custom ?? product!.price;
    const lineName = cleanLabel
      ? `Dygiko — ${cleanLabel}`
      : product ? `Dygiko — ${product.name}` : "Dygiko — Custom (one-off)";
    const lineDesc = cleanLabel
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
          packageKey: product?.key || "custom",
          packageName: cleanLabel || product?.name || "Custom (one-off)",
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
