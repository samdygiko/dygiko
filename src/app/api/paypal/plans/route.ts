// Returns the PayPal billing-plan IDs (per package) for the checkout to start
// a subscription. Plan IDs are not secret — they're used in the public SDK.

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb().collection("config").doc("paypal").get();
    if (!snap.exists) return NextResponse.json({ plans: null });
    const data = snap.data() as { plans?: Record<string, string> } | undefined;
    return NextResponse.json({ plans: data?.plans || null });
  } catch (err) {
    console.error("plans read error:", err);
    return NextResponse.json({ plans: null });
  }
}
