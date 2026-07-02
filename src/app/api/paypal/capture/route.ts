// Captures a PayPal order, promotes the matching Firestore order doc to
// "paid", and emails Kojo Builds a notification. Firestore + email are
// best-effort: the capture itself is what matters and always returns its
// result so the customer reaches the success page.

import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder, getPayPalOrder } from "@/lib/paypal";
import { getPackage } from "@/lib/products";

interface PayPalOrder {
  id: string;
  status: string;
  payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
  purchase_units?: { amount?: { value: string; currency_code: string } }[];
}

const NOTIFY_TO = "sam@kojobuilds.com";

export async function POST(req: NextRequest) {
  try {
    const { orderId, pkg, customer } = (await req.json()) as {
      orderId?: string;
      pkg?: string;
      customer?: {
        name?: string;
        email?: string;
        phone?: string;
        business?: string;
        website?: string;
        notes?: string;
      };
    };
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    await capturePayPalOrder(orderId);
    const order = (await getPayPalOrder(orderId)) as PayPalOrder;

    const product = pkg ? getPackage(pkg) : undefined;
    const payerEmail = order.payer?.email_address || customer?.email || null;
    const payerName =
      [order.payer?.name?.given_name, order.payer?.name?.surname]
        .filter(Boolean)
        .join(" ") || customer?.name || null;
    const paidValue = order.purchase_units?.[0]?.amount?.value || null;

    // Promote the pending order doc to paid (best-effort).
    try {
      const { adminDb } = await import("@/lib/firebase-admin");
      const { Timestamp } = await import("firebase-admin/firestore");
      const orderRef = adminDb().collection("orders").doc(`pp_${order.id}`);
      const existing = await orderRef.get();
      if (existing.exists) {
        await orderRef.update({
          status: "paid",
          paidAt: Timestamp.now(),
          paypalPayerEmail: payerEmail,
          paypalPayerName: payerName,
        });
      } else {
        await orderRef.set({
          paypalOrderId: order.id,
          friendlyId: `KB-${order.id.slice(-6).toUpperCase()}`,
          paymentProvider: "paypal",
          status: "paid",
          packageKey: product?.key || null,
          packageName: product?.name || null,
          customer: {
            name: payerName,
            email: payerEmail,
            phone: customer?.phone || null,
            business: customer?.business || null,
            website: customer?.website || null,
          },
          amountTotal: product ? Math.round(product.price * 100) : null,
          currency: "gbp",
          notes: customer?.notes || "",
          createdAt: Timestamp.now(),
          paidAt: Timestamp.now(),
        });
      }
    } catch (err) {
      console.error("Order doc write skipped:", err);
    }

    // Notify Kojo Builds by email (best-effort).
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Kojo Builds <sam@kojobuilds.com>",
          to: NOTIFY_TO,
          subject: `💸 New order — ${product?.name || "package"} (£${paidValue || product?.price || "?"})`,
          text: [
            `New paid order via PayPal.`,
            ``,
            `Package: ${product?.name || pkg || "unknown"}`,
            `Amount: £${paidValue || product?.price || "?"}`,
            `PayPal order: ${order.id}`,
            ``,
            `Customer`,
            `  Name: ${payerName || "—"}`,
            `  Email: ${payerEmail || "—"}`,
            `  Phone: ${customer?.phone || "—"}`,
            `  Business: ${customer?.business || "—"}`,
            `  Website: ${customer?.website || "—"}`,
            `  Notes: ${customer?.notes || "—"}`,
          ].join("\n"),
        });
      }
    } catch (err) {
      console.error("Notify email skipped:", err);
    }

    return NextResponse.json({ status: "paid", orderId: order.id });
  } catch (err) {
    console.error("PayPal capture error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
