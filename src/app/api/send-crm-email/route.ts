import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { PACKAGE_EMAILS } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { type, to, name, businessName } = await req.json();

    if (!to || !name || !businessName || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (type === "interest") {
      await resend.emails.send({
        from: "Sam at Dygiko <hello@dygiko.com>",
        to,
        subject: "We'll be in touch — Your free website from Dygiko",
        text: `Hi ${name},

Thanks so much for chatting with me today! As promised, we'll get started on your free website design for ${businessName} and once it's ready we'll give you a call to walk you through it.

In the meantime if you have any questions just reply to this email or give me a call on 07723396306.

Speak soon,`,
      });
    } else if (type === "closed") {
      await resend.emails.send({
        from: "Sam at Dygiko <hello@dygiko.com>",
        to,
        subject: "Welcome to Dygiko — Let's get started!",
        text: `Hi ${name},

Amazing — really excited to be working with you!

Here's what happens next: We'll build your website within 2 days and send you a preview link to review. Once you're happy we go live.

If you need anything in the meantime just reply here or call 07723396306.

Welcome aboard!`,
      });
    } else if (type === "quote-website") {
      await resend.emails.send({
        from: "Sam at Dygiko <hello@dygiko.com>",
        to,
        subject: PACKAGE_EMAILS.website.subject(businessName),
        html: PACKAGE_EMAILS.website.html(name, businessName),
      });
    } else if (type === "quote-crm") {
      await resend.emails.send({
        from: "Sam at Dygiko <hello@dygiko.com>",
        to,
        subject: PACKAGE_EMAILS.crm.subject(businessName),
        html: PACKAGE_EMAILS.crm.html(name, businessName),
      });
    } else if (type === "quote-website-crm") {
      await resend.emails.send({
        from: "Sam at Dygiko <hello@dygiko.com>",
        to,
        subject: PACKAGE_EMAILS.websiteCrm.subject(businessName),
        html: PACKAGE_EMAILS.websiteCrm.html(name, businessName),
      });
    } else {
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-crm-email error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
