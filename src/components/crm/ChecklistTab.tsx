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

// Personal to-do list, stored in Firestore so it follows Eden across devices.
// Deliberately bare: type a thing, optionally tag it to a client, add it.

interface Task {
  id: string;
  title: string;
  client: string;
  done: boolean;
  createdAt: Timestamp | null;
}

type Filter = "Open" | "Done" | "All";

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

export default function ChecklistTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("Open");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [clients, setClients] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "checklist"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
    });
  }, []);

  // Offer existing clients in the dropdown so tasks tie back to real work.
  useEffect(() => {
    return onSnapshot(collection(db, "clients"), (snap) => {
      const names = snap.docs
        .map((d) => (d.data() as { businessName?: string }).businessName)
        .filter((n): n is string => !!n);
      setClients([...new Set(names)].sort());
    });
  }, []);

  async function addTask() {
    if (!title.trim() || saving) return;
    setSaving(true);
    await addDoc(collection(db, "checklist"), {
      title: title.trim(),
      client: client.trim(),
      done: false,
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setSaving(false);
  }

  const toggle = (t: Task) => updateDoc(doc(db, "checklist", t.id), { done: !t.done });
  const remove = (id: string) => deleteDoc(doc(db, "checklist", id));

  async function saveEdit(id: string) {
    if (editTitle.trim()) await updateDoc(doc(db, "checklist", id), { title: editTitle.trim() });
    setEditId(null);
  }

  async function clearDone() {
    await Promise.all(tasks.filter((t) => t.done).map((t) => deleteDoc(doc(db, "checklist", t.id))));
  }

  // Open tasks first, newest first within each group.
  const shown = useMemo(() => {
    const list = tasks.filter((t) =>
      filter === "All" ? true : filter === "Done" ? t.done : !t.done
    );
    return [...list].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  }, [tasks, filter]);

  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - openCount;

  return (
    <div className="max-w-4xl">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-1">
        <h2 className="text-lg font-semibold text-white">Checklist</h2>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {openCount} open{doneCount > 0 && ` · ${doneCount} done`}
        </p>
      </div>
      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
        Your running to-do list — saved to the CRM, so it&apos;s the same on your phone and laptop.
      </p>

      {/* Add a task */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Task</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs doing?"
            className="w-full rounded-sm px-3 py-2 text-sm outline-none"
            style={inputSt}
          />
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Client</label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="rounded-sm px-3 py-2 text-sm outline-none"
            style={inputSt}
          >
            <option value="" style={{ background: "#121212" }}>—</option>
            {clients.map((c) => (
              <option key={c} value={c} style={{ background: "#121212" }}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={addTask}
          disabled={!title.trim() || saving}
          className="px-4 py-2 rounded-sm text-sm font-semibold transition-opacity"
          style={{
            background: title.trim() ? "#b0ff00" : "rgba(255,255,255,0.08)",
            color: title.trim() ? "#080808" : "rgba(255,255,255,0.3)",
            cursor: title.trim() ? "pointer" : "not-allowed",
          }}
        >
          Add
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="inline-flex gap-1 p-1 rounded-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["Open", "Done", "All"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
              style={{
                background: filter === f ? "#b0ff00" : "transparent",
                color: filter === f ? "#080808" : "rgba(255,255,255,0.5)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="text-xs px-2.5 py-1 rounded-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Clear {doneCount} done
          </button>
        )}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <p className="text-xs py-8 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          {filter === "Open" ? "Nothing on the list — add something above." : "Nothing here."}
        </p>
      ) : (
        <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {shown.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => toggle(t)}
                aria-label={t.done ? "Mark as not done" : "Mark as done"}
                className="shrink-0 w-4 h-4 rounded-sm flex items-center justify-center text-[10px] transition-colors"
                style={{
                  border: `1px solid ${t.done ? "#48c78e" : "rgba(255,255,255,0.25)"}`,
                  background: t.done ? "#48c78e" : "transparent",
                  color: "#0b1b3b",
                }}
              >
                {t.done ? "✓" : ""}
              </button>

              <div className="flex-1 min-w-0">
                {editId === t.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(t.id);
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="w-full rounded-sm px-2 py-1 text-sm outline-none"
                    style={inputSt}
                  />
                ) : (
                  <span
                    onClick={() => { setEditId(t.id); setEditTitle(t.title); }}
                    className="text-sm cursor-text block truncate"
                    style={{
                      color: t.done ? "rgba(255,255,255,0.3)" : "#fff",
                      textDecoration: t.done ? "line-through" : "none",
                    }}
                  >
                    {t.title}
                  </span>
                )}
                {t.client && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{t.client}</span>
                )}
              </div>

              <button
                onClick={() => remove(t.id)}
                aria-label="Delete task"
                className="shrink-0 text-xs px-1.5 transition-opacity opacity-30 hover:opacity-100"
                style={{ color: "#ef4444" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
