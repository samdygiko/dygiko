// Post-call email, fired from the call tracker extension the moment a call
// ends. Sends from the Dygiko Zoho account, so it lands in Sent.
//
// Token-guarded like the extension's other endpoints — this is called from a
// content script, so there is no session to check.

import { NextRequest, NextResponse } from "next/server";
import { sendPostCallEmail, isValidEmail } from "@/lib/followup-email";

const SHARED_TOKEN = "dygiko-ext-7a2c5e91";

export async function POST(req: NextRequest) {
  try {
    const { token, to, name } = (await req.json()) as {
      token?: string;
      to?: string;
      name?: string;
    };
    if (token !== SHARED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    await sendPostCallEmail(to, name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send";
    console.error("send-postcall error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
