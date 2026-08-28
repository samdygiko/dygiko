"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AREAS, ZONES, ZONE_LABELS, ALREADY_DONE, slugify, type Area } from "@/lib/areas";

// Shop-to-shop canvassing tracker. The area list itself is a constant in
// src/lib/areas.ts; Firestore only holds the per-area progress, so adding new
// areas to the list never touches saved data.

type Status = "todo" | "doing" | "done";
type Progress = { status?: Status; notes?: string; leads?: number };

const NEXT: Record<Status, Status> = { todo: "doing", doing: "done", done: "todo" };

const STATUS_STYLE: Record<Status, { label: string; bg: string; fg: string }> = {
  todo: { label: "Not done", bg: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.5)" },
  doing: { label: "In progress", bg: "rgba(245,158,11,0.15)", fg: "#f59e0b" },
  done: { label: "Done ✓", bg: "rgba(72,199,142,0.15)", fg: "#48c78e" },
};

const inputSt = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function AreasTab() {
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [zone, setZone] = useState<string>("All");
  const [hideDone, setHideDone] = useState(false);
  const [search, setSearch] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "areas"), (snap) => {
      const next: Record<string, Progress> = {};
      snap.docs.forEach((d) => { next[d.id] = d.data() as Progress; });
      setProgress(next);
      setSeeded(true);
    });
    return unsub;
  }, []);

  // First load only: mark the areas already walked so the tab reflects reality.
  useEffect(() => {
    if (!seeded) return;
    ALREADY_DONE.forEach((name) => {
      const id = slugify(name);
      if (!progress[id]) {
        setDoc(doc(db, "areas", id), { status: "done", updatedAt: serverTimestamp() }, { merge: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded]);

  const save = (area: Area, patch: Progress) =>
    setDoc(doc(db, "areas", slugify(area.name)), { ...patch, name: area.name, updatedAt: serverTimestamp() }, { merge: true });

  const statusOf = (a: Area): Status => progress[slugify(a.name)]?.status || "todo";

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AREAS.filter((a) => {
      if (zone !== "All" && a.zone !== zone) return false;
      if (hideDone && statusOf(a) === "done") return false;
      if (q && !a.name.toLowerCase().includes(q) && !a.note.toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, hideDone, search, progress]);

  const doneCount = AREAS.filter((a) => statusOf(a) === "done").length;
  const totalLeads = Object.values(progress).reduce((n, p) => n + (Number(p.leads) || 0), 0);
  const pct = Math.round((doneCount / AREAS.length) * 100);

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-1">Areas</h2>
      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
        High streets to walk shop to shop. Tap the status to cycle Not done → In progress → Done.
      </p>

      {/* Progress */}
      <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(176,255,0,0.2)" }}>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-semibold text-white">{doneCount} of {AREAS.length} areas done</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            {AREAS.length - doneCount} left{totalLeads > 0 && ` · ${totalLeads} leads logged`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#b0ff00" }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["All", ...ZONES].map((z) => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
            style={{
              background: zone === z ? "#b0ff00" : "rgba(255,255,255,0.05)",
              color: zone === z ? "#080808" : "rgba(255,255,255,0.55)",
            }}
          >
            {z === "All" ? "All" : ZONE_LABELS[z]}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search areas…"
          className="rounded-sm px-3 py-1.5 text-xs outline-none ml-auto"
          style={{ ...inputSt, width: 160 }}
        />
        <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.5)" }}>
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Hide done
        </label>
      </div>

      {/* Area list */}
      <div className="flex flex-col gap-2">
        {shown.length === 0 ? (
          <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            Nothing matches that filter.
          </div>
        ) : (
          shown.map((a) => {
            const id = slugify(a.name);
            const p = progress[id] || {};
            const st = statusOf(a);
            const style = STATUS_STYLE[st];
            return (
              <div
                key={id}
                className="px-4 py-3 rounded-sm"
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: st === "done" ? "rgba(72,199,142,0.04)" : "rgba(255,255,255,0.02)",
                  opacity: st === "done" ? 0.7 : 1,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {a.name}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-normal" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>
                        {ZONE_LABELS[a.zone]}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{a.note}</div>
                  </div>
                  <button
                    onClick={() => save(a, { status: NEXT[st] })}
                    className="text-xs px-2.5 py-1 rounded-full shrink-0 font-semibold transition-opacity hover:opacity-80"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {style.label}
                  </button>
                </div>
                {st !== "todo" && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      defaultValue={p.notes || ""}
                      onBlur={(e) => e.target.value !== (p.notes || "") && save(a, { notes: e.target.value })}
                      placeholder="Notes — who to go back to, what's there…"
                      className="flex-1 rounded-sm px-2.5 py-1.5 text-xs outline-none"
                      style={inputSt}
                    />
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.leads ?? ""}
                      onBlur={(e) => Number(e.target.value || 0) !== (p.leads ?? 0) && save(a, { leads: Number(e.target.value || 0) })}
                      placeholder="Leads"
                      className="rounded-sm px-2.5 py-1.5 text-xs outline-none"
                      style={{ ...inputSt, width: 70 }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
