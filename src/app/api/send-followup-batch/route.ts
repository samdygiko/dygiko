// Bulk follow-up send. The extension posts a list of prospects; we send each
// the template through Zoho, paced (gentle on deliverability) and capped so the
// domain can't be torched. Token-protected.

import { NextRequest, NextResponse } from "next/server";
import { sendFollowupEmail, isValidEmail } from "@/lib/followup-email";

const SHARED_TOKEN = "dygiko-ext-7a2c5e91";
const DAILY_CAP = 50;
const DELAY_MS = 800; // gap between sends

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const { token, items } = (await req.json()) as {
      token?: string;
      items?: { email?: string; trade?: string }[];
    };
    if (token !== SHARED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No emails provided" }, { status: 400 });
    }

    // Dedupe + validate + cap.
    const seen = new Set<string>();
    const valid = items
      .map((i) => ({ email: (i.email || "").trim().toLowerCase(), trade: i.trade }))
      .filter((i) => isValidEmail(i.email) && !seen.has(i.email) && seen.add(i.email))
      .slice(0, DAILY_CAP);

    let sent = 0;
    const failed: string[] = [];
    for (const item of valid) {
      try {
        await sendFollowupEmail(item.email, item.trade);
        sent++;
      } catch (e) {
        failed.push(item.email);
        // If the mailbox itself isn't configured, stop early — no point looping.
        if (e instanceof Error && /not configured/i.test(e.message)) {
          return NextResponse.json({ error: "Email not configured" }, { status: 500 });
        }
      }
      await sleep(DELAY_MS);
    }

    const capped = items.length > DAILY_CAP;
    return NextResponse.json({ ok: true, sent, failed, total: valid.length, capped, cap: DAILY_CAP });
  } catch (err) {
    console.error("send-followup-batch error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
