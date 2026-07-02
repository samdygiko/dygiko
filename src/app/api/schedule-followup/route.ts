// Queue follow-up emails to be sent at 7am by the cron. The extension posts a
// list of prospects; we write each to Firestore (scheduled_emails). Dedupes
// against anything already pending. Token-protected.

import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/followup-email";

const SHARED_TOKEN = "dygiko-ext-7a2c5e91";

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

    const { adminDb } = await import("@/lib/firebase-admin");
    const { Timestamp } = await import("firebase-admin/firestore");
    const db = adminDb();

    // Everything already queued but not yet sent — to avoid duplicates.
    const pendingSnap = await db.collection("scheduled_emails").where("sent", "==", false).get();
    const pending = new Set(pendingSnap.docs.map((d) => (d.data().email || "").toLowerCase()));

    const seen = new Set<string>();
    let queued = 0;
    let skipped = 0;
    for (const raw of items) {
      const email = (raw.email || "").trim().toLowerCase();
      const trade = (raw.trade || "").trim() || "electricians";
      if (!isValidEmail(email) || seen.has(email)) continue;
      seen.add(email);
      if (pending.has(email)) { skipped++; continue; }
      await db.collection("scheduled_emails").add({
        email,
        trade,
        sent: false,
        createdAt: Timestamp.now(),
      });
      queued++;
    }

    return NextResponse.json({ ok: true, queued, skipped });
  } catch (err) {
    console.error("schedule-followup error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
