"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Lead = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  websiteStatus: string;
  googleMapsUrl: string;
  notes: string;
  notesAt?: { toDate?: () => Date } | null; // when the note was last written
  emailSentInterest: boolean;
  emailSentClosed: boolean;
  templateSent: boolean;
  templateLink: string;
  bookingDateTime?: string; // ISO datetime when the consultation is scheduled
  notInterested?: boolean; // when true, lead sinks to bottom + renders dimmed
  // Opening hours captured from the Google listing by the extension.
  //   hours       → weekly { mon:[["09:00","17:00"]], … } (24h HH:MM ranges)
  //   hoursStatus → snapshot string e.g. "Open ⋅ Closes 7 pm"
  hours?: WeeklyHours | null;
  hoursStatus?: string;
  dateAdded: { toDate?: () => Date } | null;
  updates?: { text: string; at: Timestamp }[];
};

// Weekly opening hours: per-day list of [open, close] ranges in 24h "HH:MM".
// An empty array means closed all day. A missing day key means unknown.
// Each range is an "HH:MM-HH:MM" string (Firestore rejects nested arrays).
type WeeklyHours = Partial<Record<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat", string[]>>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

// Decide whether a lead's business is open right now.
//   - Weekly hours present  → compute from current local day + time.
//   - Only a snapshot status → best-effort parse of "open"/"closed".
//   - No hours data at all   → treat as OPEN/unknown (never hide or badge).
function isOpenNow(lead: Lead): boolean {
  const weekly = lead.hours;
  if (weekly && typeof weekly === "object") {
    const now = new Date();
    const dk = DAY_KEYS[now.getDay()];
    const ranges = weekly[dk];
    if (ranges !== undefined) {
      // Known day. Empty array = closed today.
      if (ranges.length === 0) return false;
      const mins = now.getHours() * 60 + now.getMinutes();
      for (const rng of ranges) {
        const [open, close] = (rng || "").split("-");
        if (!open || !close) continue;
        const [oh, om] = open.split(":").map(Number);
        const [ch, cm] = close.split(":").map(Number);
        const openMin = oh * 60 + om;
        let closeMin = ch * 60 + cm;
        // Past-midnight close (e.g. 18:00–02:00): treat as open until close next day.
        if (closeMin <= openMin) closeMin += 24 * 60;
        if (mins >= openMin && mins <= closeMin) return true;
        // Also catch the early-morning tail of a past-midnight range.
        if (mins + 24 * 60 >= openMin && mins + 24 * 60 <= closeMin) return true;
      }
      return false;
    }
    // Weekly object exists but this day is unknown → don't penalise.
    return true;
  }
  const status = (lead.hoursStatus || "").toLowerCase();
  if (status) {
    if (/open 24|open\b|opens? \d|⋅ closes/i.test(status) && !/closed/.test(status)) return true;
    if (/closed/.test(status)) return false;
  }
  // No usable hours data → unknown, show as open.
  return true;
}

// Safely parse the JSON-encoded weekly-hours param from the extension URL.
function parseHoursParam(raw: string | null): WeeklyHours | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as WeeklyHours;
  } catch {
    // Malformed — ignore rather than blocking the lead.
  }
  return null;
}

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

// Normalize a phone number to digits only, collapsing UK prefixes so that
// "020 8960 3642", "02089603642" and "+442089603642" all compare equal.
// Strategy: keep digits only, drop a leading "44" (intl) or leading "0"
// (national trunk) so the "subscriber" portion is what we compare.
function normalizePhone(raw: string | null | undefined): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("44")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

// Click-to-call: dial this number (opens FaceTime/handoff call on Mac, or the
// dialler on mobile). Outreach is done by calling, not texting.
function callLink(raw: string | null | undefined): string {
  const sub = normalizePhone(raw);
  return sub ? `tel:+44${sub}` : "#";
}

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [moveToClientsId, setMoveToClientsId] = useState<string | null>(null);
  const [movePackage, setMovePackage] = useState<"Website" | "CRM" | "Website + CRM">("Website");
  const [movingToClients, setMovingToClients] = useState(false);
  // Bulk-delete all leads.
  const [deletingAll, setDeletingAll] = useState(false);
  async function deleteAll() {
    if (leads.length === 0) return;
    if (!window.confirm(`Delete ALL ${leads.length} leads? This can't be undone.`)) return;
    setDeletingAll(true);
    try {
      await Promise.all(leads.map((l) => deleteDoc(doc(db, "leads", l.id))));
    } catch { /* ignore individual failures */ }
    setDeletingAll(false);
  }

  const searchParams = useSearchParams();
  const router = useRouter();
  // Guard so the extension deep-link is only processed once per navigation.
  const handledAddLead = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("dateAdded", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead)));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Handle the Chrome-extension deep-link:
  //   /crm?tab=Leads&addLead=1&businessName=…&phone=…
  // Creates the lead in Firestore (deduping against existing leads), then
  // cleans the query string afterwards so a refresh doesn't re-add the lead.
  useEffect(() => {
    if (handledAddLead.current) return;
    if (!searchParams) return;
    if (searchParams.get("addLead") !== "1") return;
    handledAddLead.current = true;

    const businessName = (searchParams.get("businessName") || "").trim();
    const phone = (searchParams.get("phone") || "").trim();

    (async () => {
      if (businessName || phone) {
        // Dedupe: query the live `leads` collection directly (the onSnapshot
        // state may not have loaded yet on mount) and look for an existing
        // match on normalized phone, or — if no phone — on lowercased name.
        const wantedPhone = normalizePhone(phone);
        const wantedName = businessName.toLowerCase();
        let existing = false;
        try {
          const snap = await getDocs(collection(db, "leads"));
          for (const d of snap.docs) {
            const data = d.data() as Partial<Lead>;
            const matchPhone = wantedPhone && normalizePhone(data.phone) === wantedPhone;
            const matchName = !wantedPhone && wantedName && (data.businessName || "").trim().toLowerCase() === wantedName;
            if (matchPhone || matchName) {
              existing = true;
              break;
            }
          }
        } catch {
          // If the dedupe read fails, fall through and add as new rather than
          // silently dropping the lead.
        }

        if (!existing) {
          await addDoc(collection(db, "leads"), {
            businessName,
            contactName: (searchParams.get("contact") || "").trim(),
            email: "",
            phone,
            address: (searchParams.get("address") || "").trim(),
            category: (searchParams.get("category") || "").trim(),
            websiteStatus: "",
            googleMapsUrl: (searchParams.get("googleMapsUrl") || "").trim(),
            hours: parseHoursParam(searchParams.get("hours")),
            hoursStatus: (searchParams.get("hoursStatus") || "").trim(),
            notes: "",
            emailSentInterest: false,
            emailSentClosed: false,
            templateSent: false,
            templateLink: "",
            dateAdded: serverTimestamp(),
          });
        }
      }
    })().catch(() => {});

    // Strip the deep-link params from the URL so a refresh won't re-add.
    router.replace("/crm?tab=Leads");
  }, [searchParams, router]);

  async function deleteLead(id: string) {
    await deleteDoc(doc(db, "leads", id));
  }


  // Toggle the `notInterested` flag on a lead. Missing/false → mark not
  // interested; true → mark interested again.
  async function toggleNotInterested(lead: Lead) {
    await updateDoc(doc(db, "leads", lead.id), { notInterested: !lead.notInterested });
  }

  async function confirmMoveToClients() {
    if (!moveToClientsId) return;
    const lead = leads.find((l) => l.id === moveToClientsId);
    if (!lead) return;
    setMovingToClients(true);

    // One-off price for the package chosen in the move modal
    const PACKAGE_PRICE = { "Website": 500, "CRM": 1000, "Website + CRM": 1250 } as const;
    const price = PACKAGE_PRICE[movePackage];

    await addDoc(collection(db, "clients"), {
      businessName: lead.businessName,
      email: lead.email ?? "",
      package: movePackage,
      price,
      subscriptionStatus: "Active",
      websiteUrl: "",
      dateAdded: serverTimestamp(),
    });
    await deleteDoc(doc(db, "leads", moveToClientsId));
    setMoveToClientsId(null);
    setMovingToClients(false);
  }

  // Order leads into three tiers, keeping the existing dateAdded-desc order
  // within each tier (stable sort):
  //   0 = open now (or unknown hours), 1 = currently closed, 2 = not interested.
  // Not-interested always wins the bottom slot regardless of open/closed.
  const tier = (l: Lead) => (l.notInterested ? 2 : isOpenNow(l) ? 0 : 1);
  // Leads with a note float to the very top (you've actioned them); within that,
  // keep the open/closed/not-interested tiering.
  const hasNote = (l: Lead) => !!(l.notes && l.notes.trim());
  const sortedLeads = [...leads].sort((a, b) => {
    // Not interested always sinks to the bottom — even if it has a note.
    if (!!a.notInterested !== !!b.notInterested) return a.notInterested ? 1 : -1;
    // Among the rest, noted leads float to the top.
    if (hasNote(a) !== hasNote(b)) return hasNote(a) ? -1 : 1;
    return tier(a) - tier(b);
  });

  function formatDate(lead: Lead) {
    if (!lead.dateAdded?.toDate) return "—";
    return lead.dateAdded.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // When a note was last written, e.g. "30 Jun, 12:21".
  function formatNoteTime(ts: { toDate?: () => Date } | null | undefined) {
    if (!ts?.toDate) return "";
    try {
      return ts.toDate().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Leads</h2>
        {leads.length > 0 && (
          <button
            onClick={deleteAll}
            disabled={deletingAll}
            className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(255,107,107,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.25)" }}
            title="Delete every lead"
          >
            {deletingAll ? "Deleting…" : "🗑 Delete all leads"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
        </div>
      ) : leads.length === 0 ? (
        <div
          className="rounded-sm px-5 py-10 text-center text-sm"
          style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
        >
          No leads yet.
        </div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Business", "Notes", "Phone", "Date", ""].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead) => {
                  // Noted leads get a blue tint so actioned ones stand out.
                  const noted = hasNote(lead);
                  const baseBg = noted ? "rgba(176,255,0,0.10)" : "transparent";
                  const hoverBg = noted ? "rgba(176,255,0,0.16)" : "rgba(255,255,255,0.025)";
                  return (
                  <tr
                    key={lead.id}
                    id={"lead-" + lead.id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: baseBg,
                      opacity: lead.notInterested ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = baseBg)}
                  >
                    <td className="py-3 px-3 font-medium text-white">
                      <span className="truncate min-w-0 block max-w-[240px]">{lead.businessName}</span>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        defaultValue={lead.notes || ""}
                        placeholder="Add note…"
                        onKeyDown={(e) => {
                          // Enter = deliberate save → log a fresh timestamp.
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = e.currentTarget.value;
                            updateDoc(doc(db, "leads", lead.id), {
                              notes: v,
                              notesAt: v.trim() ? Timestamp.now() : null,
                            });
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const v = e.target.value;
                          const changed = v !== (lead.notes || "");
                          if (!v.trim()) {
                            if (changed) updateDoc(doc(db, "leads", lead.id), { notes: v, notesAt: null });
                          } else if (!lead.notesAt) {
                            // First note → stamp it.
                            updateDoc(doc(db, "leads", lead.id), { notes: v, notesAt: Timestamp.now() });
                          } else if (changed) {
                            // Edited an existing note → save text, KEEP the old time
                            // (no accidental restamp). Press Enter to update the time.
                            updateDoc(doc(db, "leads", lead.id), { notes: v });
                          }
                        }}
                        className="w-full rounded-sm px-2 py-1 text-xs outline-none focus:border-[#b0ff00]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
                      />
                      {lead.notes && lead.notes.trim() && lead.notesAt && (
                        <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                          ({formatNoteTime(lead.notesAt)})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {lead.phone ? (
                        <a
                          href={callLink(lead.phone)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "#b0ff00", textDecoration: "none" }}
                          title="Call this number"
                        >
                          {lead.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{formatDate(lead)}</td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setMoveToClientsId(lead.id); }}
                          className="text-xs px-2 py-1 rounded-sm font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
                          style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.2)" }}
                          title="Move to Clients"
                        >
                          → Client
                        </button>
                        <button
                          onClick={() => toggleNotInterested(lead)}
                          className="text-xs px-2 py-1 rounded-sm font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
                          style={
                            lead.notInterested
                              ? { background: "rgba(72,199,142,0.1)", color: "#48c78e", border: "1px solid rgba(72,199,142,0.2)" }
                              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
                          }
                          title={lead.notInterested ? "Mark as interested again" : "Mark as not interested"}
                        >
                          {lead.notInterested ? "Interested" : "Not interested"}
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-xs opacity-30 hover:opacity-80 transition-opacity"
                          style={{ color: "#ff6b6b" }}
                          title="Delete lead"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Move to Clients modal */}
      {moveToClientsId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
            <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Move to Clients</h3>
                <button onClick={() => setMoveToClientsId(null)} style={{ color: "rgba(255,255,255,0.35)" }}>✕</button>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
                <select
                  value={movePackage}
                  onChange={(e) => setMovePackage(e.target.value as typeof movePackage)}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                >
                  <option value="Website" style={{ background: "#121212" }}>Website (£500)</option>
                  <option value="CRM" style={{ background: "#121212" }}>CRM (£1,000)</option>
                  <option value="Website + CRM" style={{ background: "#121212" }}>Website + CRM (£1,250)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMoveToClientsId(null)}
                  className="flex-1 py-2.5 text-sm rounded-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMoveToClients}
                  disabled={movingToClients}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#b0ff00" }}
                >
                  {movingToClients ? "Moving…" : "Move to Clients"}
                </button>
              </div>
            </div>
          </div>
      )}

    </div>
  );
}
