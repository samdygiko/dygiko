"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES = [
  "All categories",
  "Plumber",
  "Electrician",
  "Roofer",
  "Plasterer",
  "Painter",
  "Carpenter",
  "Cleaner",
  "Removal Company",
  "Mobile Mechanic",
  "Dog Groomer",
  "Driving Instructor",
  "Takeaway",
  "Café",
  "Hair Salon",
  "Barber",
  "Nail Salon",
  "Skip Hire",
  "Locksmith",
  "Pest Control",
];

type SearchResult = {
  businessName: string;
  address: string;
  phone: string;
  websiteStatus: "no_website" | "social_only";
  googleMapsUrl: string;
  placeId: string;
  website: string;
};

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

function extractPostcode(address: string): string {
  const match = address.match(/\b([A-Z]{1,2}\d{1,2})\b/i);
  return match ? match[1].toUpperCase() : "";
}

export default function SearchTab() {
  const [category, setCategory] = useState("Plumber");
  const [postcodeArea, setPostcodeArea] = useState("");
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!postcodeArea.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSelected(new Set());
    setAdded(new Set());
    setSearched(true);

    try {
      const res = await fetch("/api/places-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category === "All categories" ? "local business" : category,
          postcodeArea: postcodeArea.trim().toUpperCase(),
          limit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      setTotalFound(data.results?.length ?? 0);
      setTotalFiltered(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function addLeads(leads: SearchResult[]) {
    const ids = leads.map((l) => l.placeId);
    setAdding(new Set(ids));

    // Check which placeIds already exist in Firestore
    const leadsRef = collection(db, "leads");
    const existing = new Set<string>();
    for (const lead of leads) {
      const q = query(leadsRef, where("placeId", "==", lead.placeId));
      const snap = await getDocs(q);
      if (!snap.empty) existing.add(lead.placeId);
    }

    const toAdd = leads.filter((l) => !existing.has(l.placeId));
    for (const lead of toAdd) {
      await addDoc(leadsRef, {
        businessName: lead.businessName,
        category: category === "All categories" ? "" : category,
        postcode: extractPostcode(lead.address),
        phone: lead.phone,
        address: lead.address,
        websiteStatus: lead.websiteStatus,
        googleMapsUrl: lead.googleMapsUrl,
        placeId: lead.placeId,
        stage: "New",
        notes: "",
        contacted: false,
        dateAdded: serverTimestamp(),
      });
    }

    setAdded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setAdding(new Set());
    setSelected(new Set());
  }

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.placeId)));
    }
  }

  const selectedLeads = results.filter((r) => selected.has(r.placeId));
  const unadded = results.filter((r) => !added.has(r.placeId));

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Business Finder</h2>
      <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
        Find local businesses with no real website using Google Places.
      </p>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="rounded-sm p-6 mb-8 flex flex-col sm:flex-row gap-4 items-end"
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex-1 min-w-0">
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "#121212" }}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Postcode area
          </label>
          <input
            type="text"
            value={postcodeArea}
            onChange={(e) => setPostcodeArea(e.target.value)}
            placeholder="e.g. SO, BH, SW"
            required
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="w-36">
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Results
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n} style={{ background: "#121212" }}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !postcodeArea.trim()}
          className="px-6 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40 whitespace-nowrap"
          style={{ background: "#b0ff00" }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div
          className="rounded-sm px-4 py-3 text-sm mb-6"
          style={{
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.2)",
            color: "#ff9999",
          }}
        >
          {error}
        </div>
      )}

      {/* Results header */}
      {searched && !loading && results.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-sm font-medium text-white">
              {totalFound} businesses without a real website found
            </span>
            {totalFiltered > totalFound && (
              <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                ({totalFiltered - totalFound} filtered out)
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleAll}
              className="px-3 py-1.5 text-xs rounded-sm transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {selected.size === results.length ? "Deselect all" : "Select all"}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => addLeads(selectedLeads)}
                disabled={adding.size > 0}
                className="px-3 py-1.5 text-xs rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(176,255,0,0.15)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.25)" }}
              >
                Add selected ({selected.size}) to CRM
              </button>
            )}
            <button
              onClick={() => addLeads(unadded)}
              disabled={adding.size > 0 || unadded.length === 0}
              className="px-3 py-1.5 text-xs rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "#b0ff00", color: "#000" }}
            >
              Add all ({unadded.length}) to CRM
            </button>
          </div>
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div
          className="rounded-sm px-5 py-8 text-center"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          No businesses without a website found. Try a different category or postcode area.
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {results.map((r) => {
            const isSelected = selected.has(r.placeId);
            const isAdded = added.has(r.placeId);
            const isAdding = adding.has(r.placeId);

            return (
              <div
                key={r.placeId}
                className="rounded-sm p-4 transition-all duration-150"
                style={{
                  border: `1px solid ${
                    isSelected
                      ? "rgba(176,255,0,0.3)"
                      : isAdded
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  background: isSelected
                    ? "rgba(176,255,0,0.04)"
                    : "rgba(255,255,255,0.02)",
                  opacity: isAdded ? 0.6 : 1,
                }}
              >
                {/* Card header */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(r.placeId)}
                    disabled={isAdded}
                    className="mt-0.5 accent-[#b0ff00]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm leading-tight truncate">
                      {r.businessName}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {r.address}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={
                      r.websiteStatus === "no_website"
                        ? { background: "rgba(176,255,0,0.12)", color: "#b0ff00" }
                        : { background: "rgba(255,165,0,0.12)", color: "#ffa500" }
                    }
                  >
                    {r.websiteStatus === "no_website" ? "No website" : "Social only"}
                  </span>
                </div>

                {/* Phone */}
                {r.phone && (
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                    📞 {r.phone}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {r.googleMapsUrl && (
                    <a
                      href={r.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-sm transition-colors"
                      style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.45)",
                        textDecoration: "none",
                      }}
                    >
                      Maps ↗
                    </a>
                  )}
                  {isAdded ? (
                    <span className="text-xs ml-auto" style={{ color: "rgba(176,255,0,0.6)" }}>
                      ✓ Added
                    </span>
                  ) : (
                    <button
                      onClick={() => addLeads([r])}
                      disabled={isAdding}
                      className="text-xs px-3 py-1 rounded-sm font-medium ml-auto transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: "#b0ff00", color: "#000" }}
                    >
                      {isAdding ? "Adding…" : "Add to CRM"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
