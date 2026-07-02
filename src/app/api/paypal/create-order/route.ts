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
    const { pkg, customer } = (await req.json()) as {
      pkg?: string;
      customer?: CustomerInfo;
    };

    const product = pkg ? getPackage(pkg) : undefined;
    if (!product) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }

    const order = await createPayPalOrder([
      {
        name: `Kojo Builds — ${product.name}`,
        description: product.tagline,
        quantity: 1,
        unitAmount: product.price,
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
          packageKey: product.key,
          packageName: product.name,
          customer: {
            name: customer.name || null,
            email: customer.email,
            phone: customer.phone || null,
            business: customer.business || null,
            website: customer.website || null,
          },
          amountTotal: Math.round(product.price * 100),
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
