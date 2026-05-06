"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dialViaJustCall } from "@/components/crm/JustCallDialerPanel";

type CallStatus = "New" | "Pending callback" | "Not interested" | "Closed";

function isEntryDead(e: { isDead?: boolean; status?: CallStatus }): boolean {
  return e.isDead === true || /not.?interested/i.test(e.status ?? "");
}

function cleanNameForSearch(name: string): string {
  return name
    .replace(/\b(ltd\.?|limited|llp\.?|plc\.?|l\.l\.p\.?|p\.l\.c\.?|& co\.?|and co\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

type CallEntry = {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  googleMapsUrl: string;
  placeId: string;
  category: string;
  status: CallStatus;
  notes: string;
  dateAdded: { toDate?: () => Date } | null;
  movedToLeads?: boolean;
  callCount?: number;
  pscName?: string;
  isDead?: boolean;
};

type LeadsForm = {
  contactName: string;
  phone: string;
  email: string;
  packageInterest: string;
  notes: string;
};

const PACKAGES = ["", "Basic £49/mo", "Growth £69/mo", "Full Business £99/mo"];

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

export default function CRMTab() {
  const [callList, setCallList] = useState<CallEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scriptOpen, setScriptOpen] = useState(false);
const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [submitLeadsId, setSubmitLeadsId] = useState<string | null>(null);
  const [leadsForm, setLeadsForm] = useState<LeadsForm>({ contactName: "", phone: "", email: "", packageInterest: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "callList"), orderBy("dateAdded", "desc"));
    return onSnapshot(q, (snap) => {
      setCallList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallEntry)));
    });
  }, []);

  async function toggleDead(id: string, current: boolean) {
    await updateDoc(doc(db, "callList", id), { isDead: !current });
  }

  async function updateNotes(id: string, notes: string) {
    await updateDoc(doc(db, "callList", id), { notes });
  }

  async function incrementCallCount(id: string, current: number) {
    await updateDoc(doc(db, "callList", id), { callCount: current + 1 });
  }

  async function doDelete() {
    if (!deleteConfirm) return;
    await deleteDoc(doc(db, "callList", deleteConfirm.id));
    setDeleteConfirm(null);
  }

  async function doDeleteAll() {
    setDeletingAll(true);
    try {
      const snap = await getDocs(collection(db, "callList"));
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "callList", d.id))));
      setCallList([]);
    } finally {
      setDeletingAll(false);
      setDeleteAllConfirmOpen(false);
    }
  }

  function openSubmitLeads(entry: CallEntry) {
    setLeadsForm({
      contactName: entry.pscName ?? "",
      phone: entry.phone,
      email: "",
      packageInterest: "",
      notes: entry.notes ?? "",
    });
    setSubmitLeadsId(entry.id);
  }

  async function submitToLeads() {
    if (!submitLeadsId) return;
    const entry = callList.find((c) => c.id === submitLeadsId);
    if (!entry) return;
    setSubmitting(true);
    await addDoc(collection(db, "leads"), {
      businessName: entry.businessName,
      contactName: leadsForm.contactName,
      email: leadsForm.email,
      phone: leadsForm.phone,
      address: entry.address,
      category: entry.category,
      googleMapsUrl: entry.googleMapsUrl,
      placeId: entry.placeId,
      stage: "Pending/Callback",
      package: leadsForm.packageInterest,
      notes: leadsForm.notes,
      emailSentInterest: false,
      emailSentClosed: false,
      dateAdded: serverTimestamp(),
    });
    await updateDoc(doc(db, "callList", submitLeadsId), { movedToLeads: true });
    setSubmitLeadsId(null);
    setLeadsForm({ contactName: "", phone: "", email: "", packageInterest: "", notes: "" });
    setSubmitting(false);
  }

  function exportCSV() {
    const headers = ["Business", "Address", "Phone", "Category", "Status", "Notes", "Call Count", "Moved to Leads", "PSC Name", "Date Added"];
    const rows = callList.map((e) => [
      e.businessName,
      e.address ?? "",
      e.phone ?? "",
      e.category ?? "",
      e.status,
      (e.notes ?? "").replace(/\n/g, " "),
      e.callCount ?? 0,
      e.movedToLeads ? "Yes" : "No",
      e.pscName ?? "",
      e.dateAdded?.toDate ? e.dateAdded.toDate().toLocaleDateString("en-GB") : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dygiko-calllist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const searchQ = searchQuery.trim().toLowerCase();

  // Exclude movedToLeads entirely — sort dead to bottom
  const visibleList = callList
    .filter((e) => !e.movedToLeads)
    .filter((e) =>
      !searchQ ||
      e.businessName.toLowerCase().includes(searchQ) ||
      (e.phone ?? "").toLowerCase().includes(searchQ)
    )
    .sort((a, b) => {
      const aDead = isEntryDead(a);
      const bDead = isEntryDead(b);
      if (aDead && !bDead) return 1;
      if (!aDead && bDead) return -1;
      return 0;
    });

  const filteredList = visibleList;

  const nextUncalled = visibleList.find(
    (e) => (e.callCount ?? 0) === 0 && !isEntryDead(e)
  );

  function jumpToNextUncalled() {
    if (!nextUncalled) return;
    const el = document.getElementById(`crm-entry-${nextUncalled.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "box-shadow 1.4s ease";
      el.style.boxShadow = "0 0 0 2px rgba(176,255,0,0.45)";
      setTimeout(() => { el.style.boxShadow = ""; }, 1500);
    }
  }

  // Active count excludes dead and movedToLeads (for header display)
  const activeCount = callList.filter(
    (e) => !e.movedToLeads && !isEntryDead(e)
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">CRM</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {activeCount} businesses to call through. Find more in Business Finder.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {callList.length > 0 && (
            <button
              onClick={exportCSV}
              className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
            >
              Export CSV
            </button>
          )}
          {callList.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirmOpen(true)}
              className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "rgba(255,107,107,0.12)",
                color: "#ff6b6b",
                border: "1px solid rgba(255,107,107,0.25)",
              }}
            >
              Delete All from CRM
            </button>
          )}
        </div>
      </div>

      {/* Fixed toggle button */}
      <button
        onClick={() => setScriptOpen((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 script-toggle-btn"
        style={{
          position: 'fixed',
          top: 16,
          right: scriptOpen ? 'calc(30% + 8px)' : 8,
          zIndex: 51,
          background: scriptOpen ? "rgba(176,255,0,0.12)" : "rgba(255,255,255,0.05)",
          color: scriptOpen ? "#b0ff00" : "rgba(255,255,255,0.6)",
          border: `1px solid ${scriptOpen ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        {scriptOpen ? "Hide script" : "📋 Script"}
      </button>
      <style>{`
        @media (max-width: 1023px) {
          .script-toggle-btn { top: 64px !important; }
        }
      `}</style>

      {/* Split layout — left scrolls, right is fixed */}
      <div className="flex gap-5 items-start">
        {/* Call list — adjusts width when script panel is open */}
        <div
          className="flex flex-col gap-3 min-w-0"
          style={{ marginRight: scriptOpen ? '30%' : 0, flex: 1 }}
        >
          {callList.length === 0 ? (
            <div
              className="rounded-sm px-5 py-10 text-center text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
            >
              No businesses in your call list yet. Use Business Finder to search and add businesses.
            </div>
          ) : (
            <>
              {/* Search input + jump-to-next-uncalled */}
              <div className="flex items-stretch gap-2 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
                <button
                  onClick={jumpToNextUncalled}
                  disabled={!nextUncalled}
                  className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{
                    background: "rgba(176,255,0,0.1)",
                    color: "#b0ff00",
                    border: "1px solid rgba(176,255,0,0.25)",
                    maxWidth: 280,
                  }}
                  title={nextUncalled ? `Jump to ${nextUncalled.businessName}` : "No uncalled businesses"}
                >
                  {nextUncalled
                    ? `→ Next uncalled: ${nextUncalled.businessName.length > 24 ? nextUncalled.businessName.slice(0, 22) + "…" : nextUncalled.businessName}`
                    : "All called"}
                </button>
              </div>

              {/* Match count */}
              {searchQ && (
                <p className="text-xs -mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Showing {filteredList.length} of {callList.length} businesses
                </p>
              )}

              {/* Cards or no-match state */}
              {filteredList.length === 0 ? (
                <div
                  className="rounded-sm px-5 py-8 text-center text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                >
                  No businesses match your search.
                </div>
              ) : (
                filteredList.map((entry) => (
                  <CRMCard
                    key={entry.id}
                    entry={entry}
                    onToggleDead={toggleDead}
                    onNotesChange={updateNotes}
                    onCallIncrement={incrementCallCount}
                    onDelete={(id, name) => setDeleteConfirm({ id, name })}
                    onSubmitToLeads={() => openSubmitLeads(entry)}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Script panel — fixed */}
        {scriptOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '30%',
              height: '100vh',
              overflowY: 'auto',
              zIndex: 50,
              background: '#0d0d0d',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ padding: '24px', fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Cold Call Script</p>

              {/* Opening */}
              <div style={{ background: 'rgba(176,255,0,0.08)', border: '1px solid rgba(176,255,0,0.25)', borderRadius: '4px', padding: '16px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b0ff00', marginBottom: '10px' }}>Opening</p>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#ffffff' }}>
                  {`"Hi, how's it going? My name's Sam from Dygiko — we noticed you didn't have a website so we wanted to offer you a free template, and if you like it we can get you on one of our subscriptions."`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete All confirmation modal */}
      {deleteAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div>
              <h3 className="font-semibold text-white mb-1">Delete all from CRM?</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Are you sure you want to delete all <span className="text-white font-medium">{callList.length} businesses</span> from your CRM list? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllConfirmOpen(false)}
                disabled={deletingAll}
                className="flex-1 py-2.5 text-sm rounded-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={doDeleteAll}
                disabled={deletingAll}
                className="flex-1 py-2.5 text-sm font-semibold rounded-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.25)" }}
              >
                {deletingAll ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete single confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div>
              <h3 className="font-semibold text-white mb-1">Delete entry?</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Are you sure you want to remove <span className="text-white font-medium">{deleteConfirm.name}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm rounded-sm transition-opacity hover:opacity-80"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="flex-1 py-2.5 text-sm font-semibold rounded-sm transition-opacity hover:opacity-80"
                style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.25)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit to Leads modal */}
      {submitLeadsId && (() => {
        const entry = callList.find((c) => c.id === submitLeadsId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
            <div className="w-full max-w-md rounded-sm p-6 flex flex-col gap-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Submit to Leads</h3>
                <button onClick={() => setSubmitLeadsId(null)} style={{ color: "rgba(255,255,255,0.35)" }}>✕</button>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Business name</label>
                <input
                  type="text"
                  value={entry?.businessName ?? ""}
                  readOnly
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, opacity: 0.6 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Contact name</label>
                  <input
                    type="text"
                    value={leadsForm.contactName}
                    onChange={(e) => setLeadsForm((f) => ({ ...f, contactName: e.target.value }))}
                    className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                    style={inputSt}
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Phone number</label>
                  <input
                    type="text"
                    value={leadsForm.phone}
                    onChange={(e) => setLeadsForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                    style={inputSt}
                    placeholder="07..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Email address</label>
                <input
                  type="email"
                  value={leadsForm.email}
                  onChange={(e) => setLeadsForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                  placeholder="contact@business.com"
                />
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Package interested in</label>
                <select
                  value={leadsForm.packageInterest}
                  onChange={(e) => setLeadsForm((f) => ({ ...f, packageInterest: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                >
                  {PACKAGES.map((p) => (
                    <option key={p} value={p} style={{ background: "#121212" }}>{p || "Not discussed"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Notes about project</label>
                <textarea
                  rows={3}
                  value={leadsForm.notes}
                  onChange={(e) => setLeadsForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any details from the call…"
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSubmitLeadsId(null)}
                  className="flex-1 py-2.5 text-sm rounded-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitToLeads}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#b0ff00" }}
                >
                  {submitting ? "Submitting…" : "Submit to Leads"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CRMCard({
  entry,
  onToggleDead,
  onNotesChange,
  onCallIncrement,
  onDelete,
  onSubmitToLeads,
}: {
  entry: CallEntry;
  onToggleDead: (id: string, current: boolean) => void;
  onNotesChange: (id: string, n: string) => void;
  onCallIncrement: (id: string, current: number) => void;
  onDelete: (id: string, name: string) => void;
  onSubmitToLeads: () => void;
}) {
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNotes(entry.notes ?? "");
  }, [entry.notes]);

  async function saveNotes() {
    setSavingNotes(true);
    await onNotesChange(entry.id, notes);
    setSavingNotes(false);
  }

  async function copyNumber() {
    if (!entry.phone) return;
    try { await navigator.clipboard.writeText(entry.phone.replace(/\s/g, "")); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const callCount = entry.callCount ?? 0;
  const dead = isEntryDead(entry);

  return (
    <div
      id={`crm-entry-${entry.id}`}
      className="rounded-sm p-4 flex flex-col gap-3 shrink-0 scroll-mt-24"
      style={{
        border: `1px solid ${dead ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`,
        background: "rgba(255,255,255,0.02)",
        opacity: dead ? 0.4 : 1,
      }}
    >
      {/* Top */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm truncate">{entry.businessName}</p>
            {entry.movedToLeads && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00" }}>
                In Leads
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{entry.address}</p>
          {entry.pscName && (
            <p className="text-sm font-bold mt-1" style={{ color: "#b0ff00" }}>Director: {entry.pscName}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(entry.id, entry.businessName)}
          className="text-xs shrink-0 opacity-35 hover:opacity-80 transition-opacity"
          style={{ color: "#ff6b6b" }}
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Phone + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {entry.phone && (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>📱 {entry.phone}</span>
        )}
        {entry.phone && (
          <button
            onClick={() => { dialViaJustCall(entry.phone.replace(/\s/g, ""), entry.id); onCallIncrement(entry.id, callCount); }}
            className="text-xs px-2.5 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(176,255,0,0.12)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.2)", cursor: "pointer" }}
          >
            📞 Call
          </button>
        )}
        {entry.phone && (
          <button
            onClick={copyNumber}
            className="text-xs px-2 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: copied ? "#b0ff00" : "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
            title="Copy number to clipboard"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
        {entry.phone && callCount > 0 && (
          <a
            href={`https://wa.me/${entry.phone.replace(/[^\d]/g, "").replace(/^0/, "44")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", textDecoration: "none" }}
            title="Open WhatsApp with this number prefilled (free)"
          >
            💚 WhatsApp
          </a>
        )}
        {callCount > 0 && (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {callCount} call{callCount !== 1 ? "s" : ""}
          </span>
        )}
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(cleanNameForSearch(entry.businessName))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2.5 py-1 rounded-sm transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
        >
          Check Google ↗
        </a>
        <button
          onClick={() => onToggleDead(entry.id, dead)}
          className="ml-auto text-xs px-3 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: dead ? "rgba(255,107,107,0.18)" : "rgba(255,255,255,0.05)",
            color: dead ? "#ff6b6b" : "rgba(255,255,255,0.55)",
            border: `1px solid ${dead ? "rgba(255,107,107,0.3)" : "rgba(255,255,255,0.1)"}`,
            cursor: "pointer",
          }}
          title={dead ? "Bring back to active" : "Mark as Dead"}
        >
          {dead ? "✓ Dead" : "💀 Mark Dead"}
        </button>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes…"
          className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
        />
        <div className="flex gap-2 justify-between items-center">
          <button
            onClick={saveNotes}
            disabled={savingNotes || notes === (entry.notes ?? "")}
            className="text-xs px-3 py-1 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </button>
          {!entry.movedToLeads && (
            <button
              onClick={onSubmitToLeads}
              className="text-xs px-3 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.2)" }}
            >
              Submit to Leads →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search by business name or phone number..."
        className="w-full rounded-sm px-4 py-3 text-sm outline-none transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "#b0ff00" : "rgba(255,255,255,0.1)"}`,
          color: "#fff",
          paddingRight: value ? "2.5rem" : "1rem",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 leading-none transition-opacity hover:opacity-100"
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", opacity: 0.6 }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
