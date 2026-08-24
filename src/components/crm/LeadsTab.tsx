"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Call list. You ring businesses, take a few notes, and when one agrees to a
// demo you put the date and time in — the card lights up so the booked ones
// are obvious at a glance.
//
// Reads/writes the same `leads` collection the Chrome extension posts to via
// /api/add-lead, so leads captured off Google Maps land here too. Field names
// must stay in step with that route.

const ACCENT = "#b0ff00";
const ACCENT_TEXT = "#080808";

interface Lead {
  id: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  bookingDateTime?: string; // ISO local datetime, e.g. 2026-08-27T14:30
  createdAt?: Timestamp | null;
}

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

const blankForm = () => ({
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
  bookingDateTime: "",
});

/** "Thu 27 Aug, 2:30pm" — and whether the slot has already passed. */
function bookingLabel(iso?: string): { text: string; past: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const text = d.toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  return { text, past: d.getTime() < Date.now() };
}

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead)));
    });
  }, []);

  async function addLead() {
    if (!form.businessName.trim() || saving) return;
    setSaving(true);
    await addDoc(collection(db, "leads"), {
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      bookingDateTime: form.bookingDateTime || "",
      createdAt: serverTimestamp(),
    });
    setForm(blankForm());
    setShowAdd(false);
    setSaving(false);
  }

  async function saveEdit(id: string) {
    await updateDoc(doc(db, "leads", id), {
      businessName: editForm.businessName.trim(),
      contactName: editForm.contactName.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      notes: editForm.notes.trim(),
      bookingDateTime: editForm.bookingDateTime || "",
    });
    setEditId(null);
  }

  // Booked demos float to the top, soonest first; everything else keeps
  // newest-first below them.
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? leads.filter((l) =>
          [l.businessName, l.contactName, l.phone, l.email, l.notes]
            .some((v) => (v ?? "").toLowerCase().includes(term))
        )
      : leads;
    return [...list].sort((a, b) => {
      const ab = a.bookingDateTime ? 0 : 1;
      const bb = b.bookingDateTime ? 0 : 1;
      if (ab !== bb) return ab - bb;
      if (ab === 0) return (a.bookingDateTime ?? "").localeCompare(b.bookingDateTime ?? "");
      return 0;
    });
  }, [leads, search]);

  const bookedCount = leads.filter((l) => l.bookingDateTime).length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-1">
        <h2 className="text-lg font-semibold text-white">Leads</h2>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {leads.length} lead{leads.length === 1 ? "" : "s"}
          {bookedCount > 0 && (
            <span style={{ color: ACCENT }}> · {bookedCount} demo{bookedCount === 1 ? "" : "s"} booked</span>
          )}
        </p>
      </div>
      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
        Your call list. Add a demo date and time and the card lights up.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, number, notes…"
          className="flex-1 min-w-[220px] rounded-sm px-3 py-2 text-sm outline-none"
          style={inputSt}
        />
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: showAdd ? "rgba(176,255,0,0.12)" : ACCENT,
            color: showAdd ? ACCENT : ACCENT_TEXT,
            border: showAdd ? "1px solid rgba(176,255,0,0.25)" : "none",
          }}
        >
          {showAdd ? "Cancel" : "+ Add lead"}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 rounded-sm flex flex-col gap-3" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Business name" value={form.businessName} onChange={(v) => setForm((f) => ({ ...f, businessName: v }))} />
            <Field label="Contact name" value={form.contactName} onChange={(v) => setForm((f) => ({ ...f, contactName: v }))} />
            <Field label="Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} type="tel" />
            <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-y"
              style={inputSt}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Demo booked</label>
            <input
              type="datetime-local"
              value={form.bookingDateTime}
              onChange={(e) => setForm((f) => ({ ...f, bookingDateTime: e.target.value }))}
              className="rounded-sm px-3 py-2 text-sm outline-none"
              style={{ ...inputSt, colorScheme: "dark" }}
            />
          </div>
          <button
            onClick={addLead}
            disabled={!form.businessName.trim() || saving}
            className="self-start px-4 py-2 rounded-sm text-sm font-semibold transition-opacity"
            style={{
              background: form.businessName.trim() ? ACCENT : "rgba(255,255,255,0.08)",
              color: form.businessName.trim() ? ACCENT_TEXT : "rgba(255,255,255,0.3)",
              cursor: form.businessName.trim() ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Saving…" : "Add lead"}
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-xs py-10 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          {search ? "Nothing matches that." : "No leads yet — add one above."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((lead) => {
            const booked = bookingLabel(lead.bookingDateTime);
            const lit = !!booked && !booked.past;
            return (
              <div
                key={lead.id}
                className="rounded-sm p-4"
                style={
                  lit
                    ? { border: `1px solid ${ACCENT}`, background: "rgba(176,255,0,0.08)" }
                    : { border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                {editId === lead.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Business name" value={editForm.businessName} onChange={(v) => setEditForm((f) => ({ ...f, businessName: v }))} />
                      <Field label="Contact name" value={editForm.contactName} onChange={(v) => setEditForm((f) => ({ ...f, contactName: v }))} />
                      <Field label="Number" value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} type="tel" />
                      <Field label="Email" value={editForm.email} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} type="email" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Notes</label>
                      <textarea
                        rows={3}
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-y"
                        style={inputSt}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Demo booked</label>
                      <input
                        type="datetime-local"
                        value={editForm.bookingDateTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, bookingDateTime: e.target.value }))}
                        className="rounded-sm px-3 py-2 text-sm outline-none"
                        style={{ ...inputSt, colorScheme: "dark" }}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                      <button onClick={() => saveEdit(lead.id)} className="text-xs px-3 py-1.5 rounded-sm font-semibold" style={{ background: ACCENT, color: ACCENT_TEXT }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white">{lead.businessName || "—"}</h3>
                          {booked && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={
                                booked.past
                                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
                                  : { background: "rgba(176,255,0,0.18)", color: ACCENT }
                              }
                            >
                              {booked.past ? "Demo was " : "Demo "}{booked.text}
                            </span>
                          )}
                        </div>
                        {lead.contactName && (
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{lead.contactName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-xs" style={{ color: ACCENT }}>{lead.phone}</a>
                          )}
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.email}</a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditId(lead.id);
                            setEditForm({
                              businessName: lead.businessName ?? "",
                              contactName: lead.contactName ?? "",
                              phone: lead.phone ?? "",
                              email: lead.email ?? "",
                              notes: lead.notes ?? "",
                              bookingDateTime: lead.bookingDateTime ?? "",
                            });
                          }}
                          className="text-xs px-2.5 py-1 rounded-sm transition-opacity hover:opacity-80"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: lead.id, name: lead.businessName || "this lead" })}
                          aria-label="Delete lead"
                          className="text-xs px-1.5 transition-opacity opacity-40 hover:opacity-100"
                          style={{ color: "#ef4444" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {lead.notes && (
                      <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.55)" }}>{lead.notes}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setDeleteConfirm(null)}>
          <div className="rounded-sm p-5 max-w-sm w-full" style={{ background: "#121212", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-white mb-1">Delete lead?</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>{deleteConfirm.name} will be removed for good.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
              <button
                onClick={async () => { await deleteDoc(doc(db, "leads", deleteConfirm.id)); setDeleteConfirm(null); }}
                className="text-xs px-3 py-1.5 rounded-sm font-semibold"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm px-3 py-2 text-sm outline-none"
        style={inputSt}
      />
    </div>
  );
}
