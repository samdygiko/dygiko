import { NextRequest, NextResponse } from "next/server";

// Public enquiry endpoint. Writes the enquiry into the CRM's `enquiries`
// Firestore collection (so it shows in the Enquiries tab) and also emails a
// copy to sam@. Both are best-effort — the form still "succeeds" for the
// visitor as long as the request is valid.

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, businessType, message, source } = await req.json();

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Please include your name and an email or phone." },
        { status: 400 }
      );
    }

    // 1) Write to the CRM (needs FIREBASE_SERVICE_ACCOUNT_JSON)
    try {
      const { adminDb } = await import("@/lib/firebase-admin");
      const { Timestamp } = await import("firebase-admin/firestore");
      await adminDb().collection("enquiries").add({
        name,
        email: email || null,
        phone: phone || null,
        businessType: businessType || null,
        message: message || null,
        source: source || "website",
        status: "new",
        createdAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("Enquiry CRM write skipped:", err);
    }

    // 2) Email a copy (needs RESEND_API_KEY)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Dygiko Enquiries <hello@dygiko.com>",
          to: "sam@dygiko.com",
          replyTo: email || undefined,
          subject: `New enquiry from ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email || "Not provided"}`,
            `Phone: ${phone || "Not provided"}`,
            `Business: ${businessType || "Not provided"}`,
            ``,
            `Message:`,
            message || "(none)",
          ].join("\n"),
        });
      }
    } catch (err) {
      console.error("Enquiry email skipped:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
