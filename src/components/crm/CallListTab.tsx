"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GBP_CATEGORIES } from "@/lib/gbp-categories";
import Combobox from "@/components/crm/Combobox";

type CallStatus = "New" | "Pending callback" | "Not interested" | "Closed";
type StatusFilter = "All" | "New" | "Pending/Callback" | "Not Interested" | "Closed";

const STATUS_FILTERS: StatusFilter[] = ["All", "New", "Pending/Callback", "Not Interested", "Closed"];

function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === "All") return true;
  if (filter === "New") return /^new$/i.test(status) || !status;
  if (filter === "Pending/Callback") return /pending|callback/i.test(status);
  if (filter === "Not Interested") return /not.?interested/i.test(status);
  if (filter === "Closed") return /^closed$/i.test(status);
  return false;
}

const STATUS_COLORS: Record<CallStatus, { bg: string; color: string }> = {
  New: { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" },
  "Pending callback": { bg: "rgba(255,165,0,0.12)", color: "#ffa500" },
  "Not interested": { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
  Closed: { bg: "rgba(176,255,0,0.1)", color: "#b0ff00" },
};

const STATUS_OPTIONS: CallStatus[] = ["New", "Pending callback", "Not interested", "Closed"];

const COLD_CALL_SCRIPT = `COLD CALL SCRIPT — Initial Call

STEP 1 — Gatekeeper
"Hi, is the owner available at all?"
(If yes, proceed. If no, ask for best time to call back and log in notes.)

STEP 2 — Introduction
"Hi there, my name is Samuel, I'm calling from Dygiko — how are you today?"
(Wait for response)

STEP 3 — The Offer
"That's great! So I was just calling because I came across your business and noticed you didn't have a website — so I wanted to offer to build you a free website. If you like it, you can go ahead and purchase it. Does that sound good?"
(If hesitant: "There's no commitment at all — I'll build it, show you, and if you love it we go from there.")

STEP 4 — Book the Teams Call
"Brilliant! So what we'll do — if it's ok with you — I'll build the design of your website and then we can hop on a quick Teams call so I can show you everything and see if there are any changes you'd like made. Sound good?"
(Wait for yes)

STEP 5 — Close
"Perfect — once I've built it I'll give you a call back and then we can hop on a Teams call so I can go through it properly with you. Does that work?"
(Wait for yes)

STEP 6 — Sign Off
"Brilliant — speak to you soon then, thank you so much, bye!"

─────────────────────────────
REMEMBER:
• Always get their email to send the Teams invite
• Log the call in notes immediately after hanging up
• Move lead to Pending/Callback stage
• Send the automated "We'll be in touch" email straight after`;

type SearchResult = {
  businessName: string;
  address: string;
  phone: string;
  googleMapsUrl: string;
  placeId: string;
  localNotes?: string;
};

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
};

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

export default function CallListTab() {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("25");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  const [callList, setCallList] = useState<CallEntry[]>([]);
  const [callSearch, setCallSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [scriptOpen, setScriptOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const [moveToLeadsId, setMoveToLeadsId] = useState<string | null>(null);
  const [moveForm, setMoveForm] = useState({ name: "", email: "" });
  const [moving, setMoving] = useState(false);

  // Live callList from Firestore
  useEffect(() => {
    const q = query(collection(db, "callList"), orderBy("dateAdded", "desc"));
    return onSnapshot(q, (snap) => {
      setCallList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CallEntry)));
    });
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim()) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setSelectedIds(new Set());
    setAddedIds(new Set());
    setSearched(true);

    try {
      const res = await fetch("/api/places-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, city: "UK", limit: parseInt(limit) || 25 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults((data.results ?? []).map((r: SearchResult) => ({ ...r, localNotes: "" })));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function addToCRM(items: SearchResult[]) {
    const ids = items.map((i) => i.placeId);
    setAddingIds(new Set(ids));
    const ref = collection(db, "callList");
    for (const item of items) {
      const existing = await getDocs(query(ref, where("placeId", "==", item.placeId)));
      if (!existing.empty) continue;
      await addDoc(ref, {
        businessName: item.businessName,
        address: item.address,
        phone: item.phone,
        googleMapsUrl: item.googleMapsUrl,
        placeId: item.placeId,
        category,
        status: "New",
        notes: item.localNotes ?? "",
        movedToLeads: false,
        dateAdded: serverTimestamp(),
      });
    }
    setAddedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setAddingIds(new Set());
    setSelectedIds(new Set());
  }

  async function updateStatus(id: string, status: CallStatus) {
    await updateDoc(doc(db, "callList", id), { status });
  }

  async function updateNotes(id: string, notes: string) {
    await updateDoc(doc(db, "callList", id), { notes });
  }

  function confirmDelete(id: string, name: string) {
    setDeleteConfirm({ id, name });
  }

  async function doDelete() {
    if (!deleteConfirm) return;
    await deleteDoc(doc(db, "callList", deleteConfirm.id));
    setDeleteConfirm(null);
  }

  async function moveToLeads() {
    if (!moveToLeadsId || !moveForm.name) return;
    setMoving(true);
    const entry = callList.find((c) => c.id === moveToLeadsId);
    if (entry) {
      await addDoc(collection(db, "leads"), {
        businessName: entry.businessName,
        contactName: moveForm.name,
        email: moveForm.email,
        phone: entry.phone,
        address: entry.address,
        category: entry.category,
        googleMapsUrl: entry.googleMapsUrl,
        placeId: entry.placeId,
        stage: "New",
        package: "",
        notes: entry.notes,
        emailSentInterest: false,
        emailSentClosed: false,
        dateAdded: serverTimestamp(),
      });
      await updateDoc(doc(db, "callList", moveToLeadsId), { movedToLeads: true });
    }
    setMoveToLeadsId(null);
    setMoveForm({ name: "", email: "" });
    setMoving(false);
  }

  const unadded = results.filter((r) => !addedIds.has(r.placeId));
  const selectedResults = results.filter((r) => selectedIds.has(r.placeId));

  const statusCounts = Object.fromEntries(
    STATUS_FILTERS.map((f) => [
      f,
      f === "All" ? callList.length : callList.filter((e) => matchesStatusFilter(e.status, f)).length,
    ])
  ) as Record<StatusFilter, number>;

  const filteredCallList = callList.filter((e) => {
    if (!matchesStatusFilter(e.status, statusFilter)) return false;
    if (callSearch.trim()) {
      const q = callSearch.toLowerCase();
      return (
        e.businessName?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q) ||
        e.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function toggleSelect(placeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Call List</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Find businesses with no website and call through the list.
          </p>
        </div>
        <button
          onClick={() => setScriptOpen((v) => !v)}
          className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80 shrink-0"
          style={{
            background: scriptOpen ? "rgba(176,255,0,0.12)" : "rgba(255,255,255,0.05)",
            color: scriptOpen ? "#b0ff00" : "rgba(255,255,255,0.6)",
            border: `1px solid ${scriptOpen ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {scriptOpen ? "Hide script" : "📋 Script"}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: search + results + call list */}
        <div
          className="flex flex-col gap-6 min-w-0 overflow-auto"
          style={{ width: scriptOpen ? "60%" : "100%" }}
        >
          {/* Search form — category only */}
          <form
            onSubmit={handleSearch}
            className="rounded-sm p-5 flex flex-col sm:flex-row gap-3 items-end shrink-0"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Category
              </label>
              <Combobox
                value={category}
                onChange={setCategory}
                options={GBP_CATEGORIES}
                placeholder="Select a category…"
              />
            </div>
            <div className="w-28 shrink-0">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min={1}
                max={200}
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !category.trim()}
              className="px-5 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap shrink-0"
              style={{ background: "#b0ff00" }}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {searchError && (
            <div className="rounded-sm px-4 py-3 text-sm shrink-0" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff9999" }}>
              {searchError}
            </div>
          )}

          {/* Search results */}
          {searched && !searching && (
            <div className="shrink-0">
              {results.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-medium text-white">
                    {results.length} businesses found with mobile numbers
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.size === results.length
                            ? new Set()
                            : new Set(results.map((r) => r.placeId))
                        )
                      }
                      className="text-xs px-3 py-1.5 rounded-sm transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                    >
                      {selectedIds.size === results.length ? "Deselect all" : "Select all"}
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => addToCRM(selectedResults)}
                        disabled={addingIds.size > 0}
                        className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(176,255,0,0.15)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.25)" }}
                      >
                        Add selected ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={() => addToCRM(unadded)}
                      disabled={addingIds.size > 0 || unadded.length === 0}
                      className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: "#b0ff00", color: "#000" }}
                    >
                      Add all ({unadded.length})
                    </button>
                  </div>
                </div>
              )}

              {results.length === 0 && !searchError && (
                <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                  No results found. Try a different category.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {results.map((r) => {
                  const isAdded = addedIds.has(r.placeId);
                  const isAdding = addingIds.has(r.placeId);
                  const isSelected = selectedIds.has(r.placeId);
                  return (
                    <div
                      key={r.placeId}
                      className="rounded-sm p-4 flex flex-col gap-3"
                      style={{
                        border: `1px solid ${isSelected ? "rgba(176,255,0,0.3)" : "rgba(255,255,255,0.07)"}`,
                        background: isSelected ? "rgba(176,255,0,0.03)" : "rgba(255,255,255,0.02)",
                        opacity: isAdded ? 0.55 : 1,
                      }}
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(r.placeId)}
                          disabled={isAdded}
                          className="mt-0.5 accent-[#b0ff00]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm leading-tight truncate">{r.businessName}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{r.address}</p>
                        </div>
                      </div>

                      {/* Phone + actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>📱 {r.phone}</span>
                        <a
                          href={`tel:${r.phone.replace(/\s/g, "")}`}
                          className="text-xs px-2.5 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
                          style={{ background: "rgba(176,255,0,0.12)", color: "#b0ff00", textDecoration: "none", border: "1px solid rgba(176,255,0,0.2)" }}
                        >
                          📞 Call
                        </a>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(r.businessName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 rounded-sm transition-colors"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                        >
                          Check online ↗
                        </a>
                      </div>

                      {/* Notes */}
                      <textarea
                        rows={2}
                        placeholder="Notes…"
                        value={r.localNotes ?? ""}
                        onChange={(e) =>
                          setResults((prev) =>
                            prev.map((p) => p.placeId === r.placeId ? { ...p, localNotes: e.target.value } : p)
                          )
                        }
                        className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                      />

                      {/* Add button */}
                      <div className="flex justify-end">
                        {isAdded ? (
                          <span className="text-xs" style={{ color: "rgba(176,255,0,0.6)" }}>✓ Added to call list</span>
                        ) : (
                          <button
                            onClick={() => addToCRM([r])}
                            disabled={isAdding}
                            className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: "#b0ff00", color: "#000" }}
                          >
                            {isAdding ? "Adding…" : "Add to call list"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved call list */}
          {callList.length > 0 && (
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="text-base font-semibold text-white">
                  Saved call list{" "}
                  <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                    ({filteredCallList.length}{filteredCallList.length !== callList.length ? ` of ${callList.length}` : ""})
                  </span>
                </h3>
              </div>

              {/* Search bar */}
              <div className="mb-3">
                <input
                  type="text"
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  placeholder="Search by name, phone, or address…"
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                />
              </div>

              {/* Status filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStatusFilter(f)}
                      className="text-xs px-3 py-1.5 rounded-sm font-medium transition-colors"
                      style={{
                        background: active ? "#b0ff00" : "rgba(255,255,255,0.05)",
                        color: active ? "#000" : "rgba(255,255,255,0.5)",
                        border: `1px solid ${active ? "#b0ff00" : "rgba(255,255,255,0.1)"}`,
                      }}
                    >
                      {f} ({statusCounts[f]})
                    </button>
                  );
                })}
              </div>

              {filteredCallList.length === 0 ? (
                <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                  No businesses match this filter.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredCallList.map((entry) => (
                    <CallListCard
                      key={entry.id}
                      entry={entry}
                      onStatusChange={updateStatus}
                      onNotesChange={updateNotes}
                      onDelete={(id, name) => confirmDelete(id, name)}
                      onSubmitToLeads={() => setMoveToLeadsId(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: script panel */}
        {scriptOpen && (
          <div
            className="shrink-0 flex flex-col rounded-sm overflow-hidden"
            style={{ width: "40%", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
          >
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-semibold text-white">Cold Call Script</span>
            </div>
            <div className="flex-1 overflow-auto px-4 py-4">
              <pre
                className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: "rgba(255,255,255,0.75)", fontFamily: "inherit" }}
              >
                {COLD_CALL_SCRIPT}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
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
      {moveToLeadsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Submit to Leads</h3>
              <button onClick={() => setMoveToLeadsId(null)} style={{ color: "rgba(255,255,255,0.35)" }}>✕</button>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Contact name *</label>
              <input
                type="text"
                value={moveForm.name}
                onChange={(e) => setMoveForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Email (for automated emails)</label>
              <input
                type="email"
                value={moveForm.email}
                onChange={(e) => setMoveForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
                placeholder="contact@business.com"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMoveToLeadsId(null)}
                className="flex-1 py-2.5 text-sm rounded-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={moveToLeads}
                disabled={!moveForm.name || moving}
                className="flex-1 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "#b0ff00" }}
              >
                {moving ? "Submitting…" : "Submit to Leads"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CallListCard({
  entry,
  onStatusChange,
  onNotesChange,
  onDelete,
  onSubmitToLeads,
}: {
  entry: CallEntry;
  onStatusChange: (id: string, s: CallStatus) => void;
  onNotesChange: (id: string, n: string) => void;
  onDelete: (id: string, name: string) => void;
  onSubmitToLeads: () => void;
}) {
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  async function saveNotes() {
    setSavingNotes(true);
    await onNotesChange(entry.id, notes);
    setSavingNotes(false);
  }

  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-3"
      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
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

      {/* Phone + actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>📱 {entry.phone}</span>
        <a
          href={`tel:${entry.phone.replace(/\s/g, "")}`}
          className="text-xs px-2.5 py-1 rounded-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "rgba(176,255,0,0.12)", color: "#b0ff00", textDecoration: "none", border: "1px solid rgba(176,255,0,0.2)" }}
        >
          📞 Call
        </a>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(entry.businessName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2.5 py-1 rounded-sm transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
        >
          Check online ↗
        </a>
        <select
          value={entry.status}
          onChange={(e) => onStatusChange(entry.id, e.target.value as CallStatus)}
          className="ml-auto rounded-sm px-2 py-1 text-xs outline-none font-medium"
          style={{ background: STATUS_COLORS[entry.status].bg, color: STATUS_COLORS[entry.status].color, border: "none" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} style={{ background: "#121212", color: "#fff" }}>{s}</option>
          ))}
        </select>
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
