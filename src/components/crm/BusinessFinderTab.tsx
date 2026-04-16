"use client";

import { useState, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UK_POSTCODES } from "@/lib/uk-postcodes";

// ── Search history helpers ────────────────────────────────────────────────────
const HISTORY_KEY = "dygiko_bf_history";

function loadHistory(): Set<string> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function addToHistory(combo: string) {
  try {
    const h = loadHistory();
    h.add(combo);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...h]));
  } catch {}
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

function exportHistoryCSV() {
  const entries = [...loadHistory()];
  if (entries.length === 0) return;
  const rows = entries.map((combo) => {
    const [keyword = "", postcode = ""] = combo.split("::");
    return [keyword, postcode];
  });
  const csv = [["Keyword", "Postcode"], ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dygiko-search-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type PlaceResult = {
  businessName: string;
  address: string;
  phone: string;
  rating?: number;
  googleMapsUrl: string;
  placeId: string;
};

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

export default function BusinessFinderTab() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [limit, setLimit] = useState("25");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [statusText, setStatusText] = useState("");
  const [historyCount, setHistoryCount] = useState(0);
  const cancelledRef = useRef(false);
  // All CRM place IDs loaded once at search start — used for instant in-memory dedup
  const crmIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const existing = loadHistory();
    if (existing.size > 0) {
      setHistoryCount(existing.size);
      return;
    }
    // First visit on this device: seed localStorage from Firestore if available
    getDoc(doc(db, "config", "searchHistory")).then((snap) => {
      if (!snap.exists()) return;
      const entries: string[] = snap.data()?.entries ?? [];
      if (entries.length === 0) return;
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
        setHistoryCount(entries.length);
      } catch {}
    }).catch(() => {});
  }, []);

  function addKeyword() {
    const parts = keywordInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setKeywords((prev) => {
      const next = [...prev];
      for (const kw of parts) {
        if (!next.includes(kw)) next.push(kw);
      }
      return next;
    });
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (keywords.length === 0) return;

    cancelledRef.current = false;

    setSearching(true);
    setSearchError("");
    setResults([]);
    setSelectedIds(new Set());
    setAddedIds(new Set());
    setRemovedIds(new Set());
    setSearched(true);
    setStatusText("");
    setDebugLogs([]);

    try {
      const parsedLimit = Math.max(parseInt(limit) || 25, 1);
      const logs: string[] = [];

      // Load ALL CRM place IDs into memory once — instant dedup for every result, no per-item reads
      crmIdsRef.current = new Set<string>();
      try {
        const [callListSnap, leadsSnap] = await Promise.all([
          getDocs(collection(db, "callList")),
          getDocs(collection(db, "leads")),
        ]);
        for (const doc of [...callListSnap.docs, ...leadsSnap.docs]) {
          const pid = doc.data().placeId as string | undefined;
          if (pid) crmIdsRef.current.add(pid);
        }
        if (debugMode) logs.push(`CRM IDs loaded: ${crmIdsRef.current.size}`);
      } catch {
        if (debugMode) logs.push("Could not load CRM IDs — skipping dedup");
      }

      // sessionIds tracks results found this search for dedup across postcodes
      const sessionIds = new Set<string>();
      let totalFound = 0;

      // Load already-searched keyword+postcode pairs from localStorage — skip them instantly
      const searchedCombos = loadHistory();
      let skippedCount = 0;

      // For each keyword, cycle through all UK postcode districts until target reached
      outer: for (const keyword of keywords) {
        for (let pi = 0; pi < UK_POSTCODES.length; pi++) {
          if (cancelledRef.current || totalFound >= parsedLimit) break outer;

          const postcode = UK_POSTCODES[pi];
          const combo = `${keyword.toLowerCase()}::${postcode}`;

          // Skip combos already searched in a previous run
          if (searchedCombos.has(combo)) {
            skippedCount++;
            continue;
          }

          setStatusText(`Searching: ${keyword} in ${postcode}…`);
          if (debugMode) logs.push(`"${keyword}" in ${postcode}…`);

          // Mark as searched before calling API so a cancelled/errored request still counts
          addToHistory(combo);
          searchedCombos.add(combo);

          try {
            const allExcluded = [...crmIdsRef.current, ...sessionIds];
            const res = await fetch("/api/places-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ keyword, location: postcode, excludeIds: allExcluded }),
            });

            const data = await res.json() as { results?: PlaceResult[]; error?: string };

            if (!res.ok || data.error) {
              if (debugMode) logs.push(`  ERROR: ${data.error ?? "request failed"}`);
              continue;
            }

            const keywordResults = data.results ?? [];
            if (debugMode) logs.push(`  ${keywordResults.length} clean results`);

            const needed = parsedLimit - totalFound;
            const toAdd = keywordResults.slice(0, needed);

            for (const r of toAdd) sessionIds.add(r.placeId);
            totalFound += toAdd.length;

            if (toAdd.length > 0) {
              setResults((prev) => {
                const existingIds = new Set(prev.map((r) => r.placeId));
                return [...prev, ...toAdd.filter((r) => !existingIds.has(r.placeId))];
              });
            }

            if (debugMode) {
              logs.push(`  +${toAdd.length} | total=${totalFound}/${parsedLimit}`);
              setDebugLogs([...logs]);
            }
          } catch {
            if (debugMode) logs.push(`  Network error for "${keyword}" in ${postcode}, skipping`);
            continue;
          }
        }
      }

      if (debugMode && skippedCount > 0) logs.push(`Skipped ${skippedCount} already-searched combos`);
      setHistoryCount(searchedCombos.size);

      setStatusText("");
      if (debugMode) setDebugLogs([...logs]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function cancelSearch() {
    cancelledRef.current = true;
    setSearching(false);
    setStatusText("");
  }

  async function addToCRM(items: PlaceResult[]) {
    const ids = items.map((i) => i.placeId);
    setAddingIds(new Set(ids));
    const ref = collection(db, "callList");
    for (const item of items) {
      if (crmIdsRef.current.has(item.placeId)) continue; // instant in-memory check
      await addDoc(ref, {
        businessName: item.businessName,
        address: item.address,
        phone: item.phone,
        googleMapsUrl: item.googleMapsUrl,
        placeId: item.placeId,
        rating: item.rating ?? null,
        category: "",
        status: "New",
        notes: "",
        movedToLeads: false,
        source: "google_places",
        callCount: 0,
        dateAdded: serverTimestamp(),
      });
    }
    setAddedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => crmIdsRef.current.add(id));
    setAddingIds(new Set());
    setSelectedIds(new Set());
  }

  function toggleSelect(placeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });
  }

  function removeResult(placeId: string) {
    setRemovedIds((prev) => new Set([...prev, placeId]));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(placeId); return next; });
  }

  const visibleResults = results.filter((r) => !removedIds.has(r.placeId));
  const unadded = visibleResults.filter((r) => !addedIds.has(r.placeId));
  const selectedResults = results.filter((r) => selectedIds.has(r.placeId));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Business Finder</h2>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          Search Google Places by keyword — filters for UK mobile numbers and businesses without a website.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="rounded-sm p-5 flex flex-col gap-4"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* Keywords */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Keywords
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              placeholder='e.g. Plumber, Electrician'
              className="flex-1 rounded-sm px-3 py-2.5 text-sm outline-none"
              style={inputSt}
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={!keywordInput.trim()}
              className="px-4 py-2.5 text-sm font-medium rounded-sm transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Add keywords
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5 items-center">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "rgba(176,255,0,0.12)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.25)" }}
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                    style={{ color: "#b0ff00" }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setKeywords([])}
                className="text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          {/* How many */}
          <div className="w-28 shrink-0">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              How many
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min={1}
              className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
              style={inputSt}
            />
          </div>

          {/* Search / Cancel */}
          {searching ? (
            <button
              type="button"
              onClick={cancelSearch}
              className="px-5 py-2.5 text-sm font-semibold rounded-sm transition-opacity hover:opacity-80 whitespace-nowrap shrink-0"
              style={{ background: "rgba(255,100,100,0.15)", color: "#ff9999", border: "1px solid rgba(255,100,100,0.3)" }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={keywords.length === 0}
              className="px-5 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap shrink-0"
              style={{ background: "#b0ff00" }}
            >
              Search
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between -mt-3 flex-wrap gap-2">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Results appear as they load. Large searches may take a minute.
        </p>
        <div className="flex items-center gap-2">
          {historyCount > 0 && (
            <>
              <button
                type="button"
                onClick={exportHistoryCSV}
                disabled={searching}
                className="text-xs px-2.5 py-1 rounded-sm transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}
              >
                Export history CSV
              </button>
              <button
                type="button"
                onClick={() => { clearHistory(); setHistoryCount(0); }}
                disabled={searching}
                className="text-xs px-2.5 py-1 rounded-sm transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(255,100,100,0.2)", color: "rgba(255,130,130,0.6)" }}
              >
                Clear search history ({historyCount.toLocaleString()})
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setDebugMode((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-sm transition-colors"
            style={{
              border: `1px solid ${debugMode ? "rgba(176,255,0,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: debugMode ? "#b0ff00" : "rgba(255,255,255,0.3)",
              background: debugMode ? "rgba(176,255,0,0.06)" : "transparent",
            }}
          >
            {debugMode ? "● Debug on" : "Debug"}
          </button>
        </div>
      </div>

      {debugMode && debugLogs.length > 0 && (
        <div
          className="rounded-sm p-4 flex flex-col gap-1 font-mono text-xs overflow-auto"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(176,255,0,0.15)", maxHeight: "200px", color: "#b0ff00" }}
        >
          {debugLogs.map((log, i) => (
            <span key={i}>{log}</span>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {searching && (
        <div className="rounded-sm p-4 flex items-center gap-2" style={{ background: "rgba(176,255,0,0.04)", border: "1px solid rgba(176,255,0,0.12)" }}>
          <span className="inline-block w-3 h-3 rounded-full border animate-spin shrink-0" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
          <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
            {statusText || "Loading…"}
            {visibleResults.length > 0 && ` — ${visibleResults.length} found so far`}
          </span>
        </div>
      )}

      {searchError && (
        <div className="rounded-sm px-4 py-3 text-sm" style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff9999" }}>
          {searchError.startsWith("<") ? "An unexpected error occurred. Please try again." : searchError}
        </div>
      )}

      {/* Results header + bulk actions */}
      {searched && visibleResults.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-white">
            {visibleResults.length} businesses found
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() =>
                setSelectedIds(selectedIds.size === visibleResults.length ? new Set() : new Set(visibleResults.map((r) => r.placeId)))
              }
              className="text-xs px-3 py-1.5 rounded-sm transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
            >
              {selectedIds.size === visibleResults.length ? "Deselect all" : "Select all"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => addToCRM(selectedResults)}
                disabled={addingIds.size > 0}
                className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(176,255,0,0.15)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.25)" }}
              >
                Add selected ({selectedIds.size}) to CRM
              </button>
            )}
            <button
              onClick={() => addToCRM(unadded)}
              disabled={addingIds.size > 0 || unadded.length === 0}
              className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "#b0ff00", color: "#000" }}
            >
              Add all ({unadded.length}) to CRM
            </button>
          </div>
        </div>
      )}

      {/* Result cards */}
      {searched && visibleResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visibleResults.map((r) => {
            if (!r || !r.placeId || !r.businessName) return null;
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
                {/* Header */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(r.placeId)}
                    disabled={isAdded}
                    className="mt-1 accent-[#b0ff00] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base leading-tight">{r.businessName}</p>
                    {r.rating !== undefined && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        ★ {r.rating.toFixed(1)} on Google Maps
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{r.phone}</span>
                  <a
                    href={`tel:${r.phone.replace(/\s/g, "")}`}
                    className="text-xs px-3 py-1.5 rounded-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#b0ff00", color: "#000", textDecoration: "none" }}
                  >
                    📞 Call
                  </a>
                </div>

                {/* Address */}
                {r.address && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{r.address}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(r.businessName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-sm transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                    >
                      Check Google ↗
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAdded ? (
                      <span className="text-xs" style={{ color: "rgba(176,255,0,0.6)" }}>✓ Added to CRM</span>
                    ) : (
                      <button
                        onClick={() => addToCRM([r])}
                        disabled={isAdding}
                        className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "#b0ff00", color: "#000" }}
                      >
                        {isAdding ? "Adding…" : "Add to CRM"}
                      </button>
                    )}
                    <button
                      onClick={() => removeResult(r.placeId)}
                      className="text-xs px-2.5 py-1.5 rounded-sm transition-opacity hover:opacity-80"
                      style={{ border: "1px solid rgba(255,100,100,0.2)", color: "rgba(255,130,130,0.6)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {searched && !searching && visibleResults.length === 0 && !searchError && (
        <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
          No businesses found. Try different keywords or location.
        </div>
      )}
    </div>
  );
}
