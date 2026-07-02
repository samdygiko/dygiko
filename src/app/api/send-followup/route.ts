// Fire the follow-up template to one prospect's email (from the extension's
// Email button / popup). Token-protected. Sending logic lives in lib.

import { NextRequest, NextResponse } from "next/server";
import { sendFollowupEmail, isValidEmail } from "@/lib/followup-email";

const SHARED_TOKEN = "dygiko-ext-7a2c5e91";

export async function POST(req: NextRequest) {
  try {
    const { token, email, trade } = (await req.json()) as { token?: string; email?: string; trade?: string };
    if (token !== SHARED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isValidEmail(email || "")) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    await sendFollowupEmail(email as string, trade);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-followup error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
