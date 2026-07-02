// After a customer approves a subscription, verify it with PayPal and record
// it in Firestore so it shows in the CRM Orders tab (as a recurring order).

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

export async function POST(req: NextRequest) {
  try {
    const { subscriptionID, pkg, customer } = (await req.json()) as {
      subscriptionID?: string;
      pkg?: string;
      customer?: CustomerInfo;
    };

    const product = pkg ? getPackage(pkg) : undefined;
    if (!subscriptionID || !product) {
      return NextResponse.json({ error: "Missing subscription or package" }, { status: 400 });
    }

    // Verify the subscription is real (never trust the client alone).
    const sub = await getSubscription(subscriptionID);

    const shortCode = subscriptionID.slice(-6).toUpperCase();
    const { adminDb } = await import("@/lib/firebase-admin");
    await adminDb().collection("orders").doc(`sub_${subscriptionID}`).set({
      paypalSubscriptionId: subscriptionID,
      friendlyId: `DG-${shortCode}`,
      paymentProvider: "paypal-subscription",
      status: sub.status === "ACTIVE" || sub.status === "APPROVAL_PENDING" ? "active" : sub.status.toLowerCase(),
      packageKey: product.key,
      packageName: product.name,
      billingPeriod: "year",
      customer: {
        name: customer?.name || null,
        email: customer?.email || null,
        phone: customer?.phone || null,
        business: customer?.business || null,
        website: customer?.website || null,
      },
      amountTotal: Math.round(product.price * 100),
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
