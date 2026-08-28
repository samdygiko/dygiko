"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

type CrmUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  orphaned?: boolean;
  isSelf?: boolean;
};

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // The list comes from Firebase Auth, not Firestore — otherwise a login that
  // exists without a profile doc stays hidden while its email is still taken.
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
      setMsg({
        ok: true,
        text: data.reclaimed
          ? `${email.trim()} already had a login — password reset and added to the team`
          : `${name.trim()} can now log in with ${email.trim()}`,
      });
      setName(""); setEmail(""); setPassword("");
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't create user" });
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (u: CrmUser) => {
    if (!user) return;
    if (!window.confirm(`Delete ${u.name || u.email}? Their login stops working straight away and the email is freed up for reuse.`)) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uid: u.id }),
    });
    const data = await res.json();
    if (!res.ok) setMsg({ ok: false, text: data.error || "Couldn't remove user" });
    load();
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
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          If the email already has a login, this resets its password to the one you type — you won&apos;t get an &quot;already in use&quot; error.
        </p>
      </div>

      {/* User list */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            Loading logins…
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-sm px-5 py-8 text-center text-sm" style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            No logins yet. Add one above — they&apos;ll log in at the same CRM address with the email + password you set.
          </div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  {u.name || u.email}{u.isSelf && <span className="ml-2 text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>(you)</span>}
                </div>
                <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {u.orphaned && !u.isSelf && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }} title="No profile — this login currently has full admin access">
                    full access
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>{u.role || "user"}</span>
                {!u.isSelf && (
                  <button onClick={() => removeUser(u)} className="text-xs opacity-40 hover:opacity-90 transition-opacity" style={{ color: "#ff6b6b" }} title="Delete this login">✕</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
