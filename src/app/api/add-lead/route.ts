// Silent lead capture from the Chrome extension — writes straight to the
// `leads` collection server-side (no browser tab needed). Dedupes on the
// normalized phone number. Protected by a simple shared token.

import { NextRequest, NextResponse } from "next/server";

const SHARED_TOKEN = "dygiko-ext-7a2c5e91";

// UK phone → subscriber digits (drop +44 / leading 0) for dedupe comparison.
function normalizePhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("44")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      token?: string;
      businessName?: string;
      phone?: string;
      contactName?: string;
      address?: string;
      category?: string;
      googleMapsUrl?: string;
      hoursStatus?: string;
      hours?: Record<string, string[]> | null;
      email?: string;
      notes?: string;
      bookingDateTime?: string;
    };

    if (body.token !== SHARED_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessName = (body.businessName || "").trim();
    const phone = (body.phone || "").trim();
    if (!businessName && !phone) {
      return NextResponse.json({ error: "Missing businessName/phone" }, { status: 400 });
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const { Timestamp } = await import("firebase-admin/firestore");
    const db = adminDb();

    // Dedupe: skip if a lead with the same normalized phone (or same business
    // name when there's no phone) already exists.
    const wantPhone = normalizePhone(phone);
    const snap = await db.collection("leads").get();
    const dupe = snap.docs.find((d) => {
      const x = d.data() as { phone?: string; businessName?: string };
      if (wantPhone && normalizePhone(x.phone || "") === wantPhone) return true;
      if (!wantPhone && businessName &&
          (x.businessName || "").trim().toLowerCase() === businessName.toLowerCase()) return true;
      return false;
    });
    const email = (body.email || "").trim();
    const notes = (body.notes || "").trim();
    const bookingDateTime = (body.bookingDateTime || "").trim();

    if (dupe) {
      // Already in the CRM — stamp the email + note (e.g. "Emailed 2 Jul") so
      // the lead reflects the latest contact, without creating a duplicate.
      const patch: Record<string, unknown> = {};
      if (email) patch.email = email;
      if (notes) { patch.notes = notes; patch.notesAt = Timestamp.now(); }
      if (bookingDateTime) patch.bookingDateTime = bookingDateTime;
      if (Object.keys(patch).length) await dupe.ref.update(patch);
      return NextResponse.json({ ok: true, deduped: true, id: dupe.id });
    }

    const ref = await db.collection("leads").add({
      businessName,
      phone,
      contactName: (body.contactName || "").trim(),
      address: (body.address || "").trim(),
      category: (body.category || "").trim(),
      googleMapsUrl: (body.googleMapsUrl || "").trim(),
      hoursStatus: (body.hoursStatus || "").trim(),
      hours: body.hours ?? null,
      email,
      notes,
      ...(notes ? { notesAt: Timestamp.now() } : {}),
      notInterested: false,
      bookingDateTime,
      dateAdded: Timestamp.now(),
      // The Leads tab orders on createdAt; a document missing that field is
      // dropped from the query entirely, so extension-captured leads were
      // never showing up in the CRM.
      createdAt: Timestamp.now(),
      source: "extension",
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    console.error("add-lead error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
