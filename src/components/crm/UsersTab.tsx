"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type CrmUser = { id: string; name?: string; email?: string; role?: string };

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CrmUser)));
    });
    return unsub;
  }, []);

  const inputSt = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canAdd = !!name.trim() && emailValid && password.length >= 6;

  const addUser = async () => {
    if (!canAdd || !user) return;
    setSaving(true); setMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create user");
      setMsg({ ok: true, text: `${name.trim()} can now log in with ${email.trim()}` });
      setName(""); setEmail(""); setPassword("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't create user" });
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (u: CrmUser) => {
    if (!window.confirm(`Remove ${u.name || u.email} from the team list? (Their login stays — this just hides them here.)`)) return;
    await deleteDoc(doc(db, "users", u.id));
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-1">Users</h2>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Add team members with their own login. Leads and clients they add show under their name — you see everyone&apos;s.
      </p>

      {/* Add user */}
      <div className="rounded-lg p-4 mb-6 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(176,255,0,0.2)" }}>
        <p className="text-sm font-semibold text-white">Add a team member</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (their login)" className="rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ chars)" className="rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addUser}
            disabled={!canAdd || saving}
            className="px-4 py-2 rounded-sm text-sm font-semibold transition-opacity"
            style={{ background: "#b0ff00", color: "#080808", opacity: !canAdd || saving ? 0.4 : 1 }}
          >
            {saving ? "Creating…" : "Create login"}
          </button>
          {msg && (
            <span className="text-xs font-medium" style={{ color: msg.ok ? "#48c78e" : "#ff6b6b" }}>
              {msg.ok ? "✓ " : "✕ "}{msg.text}
            </span>
          )}
        </div>
      </div>

      {/* User list */}
      <div className="flex flex-col gap-2">
        {users.length === 0 ? (
          <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            No team members yet. Add one above — they&apos;ll log in at the same CRM address with the email + password you set.
          </div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{u.name || u.email}</div>
                <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>{u.role || "user"}</span>
                <button onClick={() => removeUser(u)} className="text-xs opacity-40 hover:opacity-90 transition-opacity" style={{ color: "#ff6b6b" }} title="Remove from list">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
