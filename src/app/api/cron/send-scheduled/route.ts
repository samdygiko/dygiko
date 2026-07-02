// Cron (runs ~7am via vercel.json) — sends up to 50 queued follow-up emails
// through Zoho, paced, then marks them sent. Protected by CRON_SECRET if set
// (Vercel passes it as an Authorization: Bearer header).

import { NextRequest, NextResponse } from "next/server";
import { sendFollowupEmail } from "@/lib/followup-email";

const DAILY_CAP = 50;
const DELAY_MS = 800;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // If CRON_SECRET is configured, require it (Vercel sends it automatically).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const { Timestamp } = await import("firebase-admin/firestore");
    const db = adminDb();

    const snap = await db.collection("scheduled_emails").where("sent", "==", false).limit(DAILY_CAP).get();
    let sent = 0;
    const failed: string[] = [];
    for (const doc of snap.docs) {
      const d = doc.data() as { email: string; trade?: string; attempts?: number };
      try {
        await sendFollowupEmail(d.email, d.trade);
        await doc.ref.update({ sent: true, sentAt: Timestamp.now() });
        sent++;
      } catch (e) {
        failed.push(d.email);
        await doc.ref.update({ attempts: (d.attempts || 0) + 1, lastError: String(e) });
      }
      await sleep(DELAY_MS);
    }

    return NextResponse.json({ ok: true, sent, failed: failed.length, considered: snap.size });
  } catch (err) {
    console.error("cron send-scheduled error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
