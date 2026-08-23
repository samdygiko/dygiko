// After a customer approves a subscription, verify it with PayPal and record
// it in Firestore so it shows in the CRM Orders tab (as a recurring order).
// `amount` is the charge for one billing cycle in GBP — yearly unless the
// checkout was a quarterly custom link, in which case it is the 3-monthly charge.

import { NextRequest, NextResponse } from "next/server";
import { getSubscription } from "@/lib/paypal";
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

interface CartLine {
  pkg?: string;
  name?: string;
  qty?: number;
  unitPrice?: number;
  lineTotal?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { subscriptionID, pkg, items, amount, customer, period } = (await req.json()) as {
      subscriptionID?: string;
      pkg?: string;
      items?: CartLine[];
      amount?: number;
      customer?: CustomerInfo;
      period?: "year" | "quarter" | "month";
    };
    const billingPeriod =
      period === "quarter" || period === "month" ? period : "year";

    const product = pkg ? getPackage(pkg) : undefined;
    if (!subscriptionID || !product) {
      return NextResponse.json({ error: "Missing subscription or package" }, { status: 400 });
    }

    // A multi-item cart is billed as one subscription. Summarise the lines for
    // the CRM Orders view; a single-item order keeps the package's own name.
    const cartLines = Array.isArray(items) ? items.filter((i) => i && i.name) : [];
    const isMultiItem = cartLines.length > 1;
    const packageKey = isMultiItem ? "cart" : product.key;
    const packageName = cartLines.length
      ? cartLines
          .map((i) => `${i.name}${(i.qty ?? 1) > 1 ? ` ×${i.qty}` : ""}`)
          .join(", ")
      : product.name;

    // Per-cycle charge (client-computed for the cart total / social slider).
    // Falls back to the package's list price; clamped to a sane range.
    const raw = typeof amount === "number" ? Math.round(amount) : product.price;
    const perCycle = Math.min(100000, Math.max(10, raw));

    // Verify the subscription is real (never trust the client alone).
    const sub = await getSubscription(subscriptionID);

    const shortCode = subscriptionID.slice(-6).toUpperCase();
    const { adminDb } = await import("@/lib/firebase-admin");
    await adminDb().collection("orders").doc(`sub_${subscriptionID}`).set({
      paypalSubscriptionId: subscriptionID,
      friendlyId: `DG-${shortCode}`,
      paymentProvider: "paypal-subscription",
      status: sub.status === "ACTIVE" || sub.status === "APPROVAL_PENDING" ? "active" : sub.status.toLowerCase(),
      packageKey,
      packageName,
      lineItems: cartLines.length
        ? cartLines.map((i) => ({
            pkg: i.pkg || null,
            name: i.name || null,
            qty: Math.round(Number(i.qty) || 1),
            unitPrice: Math.round(Number(i.unitPrice) || 0),
            lineTotal: Math.round(Number(i.lineTotal) || 0),
          }))
        : null,
      billingPeriod,
      customer: {
        name: customer?.name || null,
        email: customer?.email || null,
        phone: customer?.phone || null,
        business: customer?.business || null,
        website: customer?.website || null,
      },
      amountTotal: Math.round(perCycle * 100),
      currency: "gbp",
      notes: customer?.notes || "",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("record-subscription error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
