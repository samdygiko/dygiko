// Mints a PayPal billing plan on the fly at a given price — annual by
// default, or every 3 months / every month when `period` is "quarter"
// or "month".
// Powers every subscription checkout — standard packages, the social-media
// slider, and Admin custom-price links all call this at subscribe time, so
// there are no pre-created plans to keep in sync. Kojo bills once a year.
// The price is clamped server-side so a tampered URL can't create a silly plan.

import { NextRequest, NextResponse } from "next/server";
import { createYearlyPlan, createQuarterlyPlan, createMonthlyPlan, createProduct } from "@/lib/paypal";
import { Timestamp } from "firebase-admin/firestore";

export const MIN_CUSTOM_PRICE = 10;
export const MAX_CUSTOM_PRICE = 100000;

async function getProductId(): Promise<string> {
  const { adminDb } = await import("@/lib/firebase-admin");
  const ref = adminDb().collection("config").doc("paypal");
  const snap = await ref.get();
  const existing = (snap.data() as { productId?: string } | undefined)?.productId;
  if (existing) return existing;
  // Self-heal: create the catalog product and store it.
  const product = await createProduct("Dygiko", "Custom websites & operations systems");
  await ref.set({ productId: product.id, updatedAt: Timestamp.now() }, { merge: true });
  return product.id;
}

export async function POST(req: NextRequest) {
  try {
    // `amount` is the actual charge in GBP for one billing cycle — yearly by
    // default, or the 3-monthly charge when period is "quarter". (Legacy
    // callers may still send `price`; treat it the same.)
    const body = (await req.json()) as {
      amount?: number;
      price?: number;
      period?: "year" | "quarter" | "month";
    };
    const raw = body.amount ?? body.price;
    const period =
      body.period === "quarter" || body.period === "month" ? body.period : "year";
    const p = Math.round(Number(raw));
    if (!Number.isFinite(p) || p < MIN_CUSTOM_PRICE || p > MAX_CUSTOM_PRICE) {
      return NextResponse.json(
        {
          error: `Price must be £${MIN_CUSTOM_PRICE}–£${MAX_CUSTOM_PRICE} per ${period}`,
        },
        { status: 400 }
      );
    }

    const productId = await getProductId();
    const plan =
      period === "quarter"
        ? await createQuarterlyPlan(productId, `Dygiko — £${p}/qtr`, p)
        : period === "month"
          ? await createMonthlyPlan(productId, `Dygiko — £${p}/mo`, p)
          : await createYearlyPlan(productId, `Dygiko — £${p}/yr`, p);

    return NextResponse.json({ planId: plan.id, amount: p, period });
  } catch (err) {
    console.error("custom-plan error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
