// One-time setup: creates the PayPal catalog product + one yearly billing plan
// per package, then stores the plan IDs in Firestore (config/paypal) so the
// checkout can read them. Hit this once after deploy (and again if prices
// change). Protected by a token so randoms can't create plans.

import { NextRequest, NextResponse } from "next/server";
import { createProduct, createYearlyPlan } from "@/lib/paypal";
import { PACKAGES } from "@/lib/products";
import { Timestamp } from "firebase-admin/firestore";

const SETUP_TOKEN = "dygiko-setup-7a2c5e91";

export async function POST(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token") || req.headers.get("x-setup-token");
    if (token !== SETUP_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await createProduct("Dygiko", "Custom websites & CRM systems (annual)");

    const plans: Record<string, string> = {};
    for (const p of PACKAGES) {
      const plan = await createYearlyPlan(product.id, `Dygiko — ${p.name} (annual)`, p.price);
      plans[p.key] = plan.id;
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    await adminDb().collection("config").doc("paypal").set({
      productId: product.id,
      plans,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true, productId: product.id, plans });
  } catch (err) {
    console.error("setup-plans error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
