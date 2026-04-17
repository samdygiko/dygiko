"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Stage = "Pending/Callback" | "Closed" | "Not Interested" | "Completed";
type Package = "" | "Basic £500" | "Growth £750" | "Full Business £1,500";

const STAGES: Stage[] = ["Pending/Callback", "Closed", "Not Interested", "Completed"];

const STAGE_COLORS: Record<Stage, { bg: string; color: string }> = {
  "Pending/Callback": { bg: "rgba(255,165,0,0.12)", color: "#ffa500" },
  Closed: { bg: "rgba(72,199,142,0.15)", color: "#48c78e" },
  "Not Interested": { bg: "rgba(255,107,107,0.12)", color: "#ff6b6b" },
  Completed: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
};

const PACKAGES: Package[] = ["", "Basic £500", "Growth £750", "Full Business £1,500"];

const FALLBACK_STAGE_COLOR = { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" };
function stageColor(stage: string) {
  return STAGE_COLORS[stage as Stage] ?? FALLBACK_STAGE_COLOR;
}

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
  stage: Stage;
  package: Package;
  notes: string;
  emailSentInterest: boolean;
  emailSentClosed: boolean;
  dateAdded: { toDate?: () => Date } | null;
};

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStage, setFilterStage] = useState("All");
  const [filterPackage, setFilterPackage] = useState("All");
  const [panelNotes, setPanelNotes] = useState("");
  const [panelEmail, setPanelEmail] = useState("");
  const [panelName, setPanelName] = useState("");
  const [saving, setSaving] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [moveToClientsId, setMoveToClientsId] = useState<string | null>(null);
  const [moveWebsiteUrl, setMoveWebsiteUrl] = useState("");
  const [movingToClients, setMovingToClients] = useState(false);
  const [callbackDay, setCallbackDay] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    return d.toLocaleDateString("en-GB", { weekday: "long" });
  });
  const [copiedCallbackEmail, setCopiedCallbackEmail] = useState(false);
  const [followUpNameWarning, setFollowUpNameWarning] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("dateAdded", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead)));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l.id === selectedLead.id);
      if (updated) {
        setSelectedLead(updated);
        setPanelNotes(updated.notes ?? "");
        setPanelEmail(updated.email ?? "");
        setPanelName(updated.contactName ?? "");
        setFollowUpNameWarning(false);
      }
    }
  }, [leads]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStage(id: string, stage: Stage) {
    await updateDoc(doc(db, "leads", id), { stage });
  }

  async function updatePackage(id: string, pkg: Package) {
    await updateDoc(doc(db, "leads", id), { package: pkg });
  }

  async function savePanelChanges() {
    if (!selectedLead) return;
    setSaving(true);
    await updateDoc(doc(db, "leads", selectedLead.id), {
      notes: panelNotes,
      email: panelEmail,
      contactName: panelName,
    });
    setSaving(false);
  }

  async function deleteLead(id: string) {
    if (selectedLead?.id === id) setSelectedLead(null);
    await deleteDoc(doc(db, "leads", id));
  }

  async function confirmMoveToClients() {
    if (!moveToClientsId) return;
    const lead = leads.find((l) => l.id === moveToClientsId);
    if (!lead) return;
    setMovingToClients(true);

    // Map "Basic £500" → "Basic" etc.
    const pkgMap: Record<string, string> = {
      "Basic £500": "Basic",
      "Growth £750": "Growth",
      "Full Business £1,500": "Full Business",
    };
    const clientPkg = pkgMap[lead.package] ?? "Basic";

    await addDoc(collection(db, "clients"), {
      businessName: lead.businessName,
      email: lead.email ?? "",
      package: clientPkg,
      subscriptionStatus: "Active",
      websiteUrl: moveWebsiteUrl.trim(),
      dateAdded: serverTimestamp(),
    });
    await deleteDoc(doc(db, "leads", moveToClientsId));
    if (selectedLead?.id === moveToClientsId) setSelectedLead(null);
    setMoveToClientsId(null);
    setMoveWebsiteUrl("");
    setMovingToClients(false);
  }

  // Ensure name is saved to Firestore before follow-up actions; returns false if name is missing
  async function ensureNameSaved(): Promise<boolean> {
    if (!selectedLead) return false;
    if (!panelName.trim()) {
      setFollowUpNameWarning(true);
      return false;
    }
    setFollowUpNameWarning(false);
    // Auto-save name to Firestore if it changed
    if (panelName.trim() !== (selectedLead.contactName ?? "").trim()) {
      await updateDoc(doc(db, "leads", selectedLead.id), { contactName: panelName.trim() });
    }
    return true;
  }

  async function handleSendCallbackText() {
    const ok = await ensureNameSaved();
    if (!ok || !selectedLead) return;
    const phone = selectedLead.phone?.replace(/[\s()-]/g, "") ?? "";
    const msg = `Hi ${panelName.trim()}, it's Samuel from Dygiko. Great speaking with you! I'll give you a call back ${callbackDay} as discussed. In the meantime feel free to check out our website: dygiko.com 😊`;
    window.open(`sms:${phone}?&body=${encodeURIComponent(msg)}`);
  }

  async function handleCopyCallbackEmail() {
    const ok = await ensureNameSaved();
    if (!ok || !selectedLead) return;
    const name = panelName.trim();
    const biz = selectedLead.businessName;
    const text = `Subject: Great speaking with you - Dygiko Web Design\n\nHi ${name},\n\nIt was great speaking with you today! As discussed, I'll give you a call back ${callbackDay} to walk you through what we can build for ${biz}.\n\nIn the meantime, feel free to check out our website to see examples of our work: dygiko.com\n\nLooking forward to speaking again!`;
    await navigator.clipboard.writeText(text);
    setCopiedCallbackEmail(true);
    setTimeout(() => setCopiedCallbackEmail(false), 2500);
  }

  function formatDate(lead: Lead) {
    if (!lead.dateAdded?.toDate) return "—";
    return lead.dateAdded.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function exportCSV() {
    const headers = ["Business", "Contact", "Email", "Phone", "Category", "Stage", "Package", "Notes", "Date"];
    const rows = filtered.map((l) => [
      l.businessName,
      l.contactName ?? "",
      l.email ?? "",
      l.phone ?? "",
      l.category ?? "",
      l.stage,
      l.package ?? "",
      (l.notes ?? "").replace(/\n/g, " "),
      formatDate(l),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dygiko-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = leads.filter((l) => {
    if (filterStage !== "All" && l.stage !== filterStage) return false;
    if (filterPackage !== "All" && l.package !== filterPackage) return false;
    return true;
  });

  const contactName = selectedLead?.contactName || panelName || "[Name]";
  const businessName = selectedLead?.businessName || "[Business Name]";

  return (
    <div className="flex flex-col h-full">
      {/* Fixed script toggle button */}
      <button
        onClick={() => setScriptOpen((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80"
        style={{
          position: "fixed",
          top: 16,
          right: scriptOpen ? "calc(40% + 8px)" : 8,
          zIndex: 51,
          background: scriptOpen ? "rgba(176,255,0,0.12)" : "rgba(255,255,255,0.05)",
          color: scriptOpen ? "#b0ff00" : "rgba(255,255,255,0.6)",
          border: `1px solid ${scriptOpen ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        {scriptOpen ? "Hide script" : "📋 Closing Script"}
      </button>

      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {leads.length} total · {leads.filter((l) => l.stage === "Closed").length} closed
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={exportCSV}
            className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 my-5">
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="rounded-sm px-3 py-2 text-xs outline-none"
          style={inputSt}
        >
          <option value="All" style={{ background: "#121212" }}>All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s} style={{ background: "#121212" }}>{s}</option>
          ))}
        </select>
        <select
          value={filterPackage}
          onChange={(e) => setFilterPackage(e.target.value)}
          className="rounded-sm px-3 py-2 text-xs outline-none"
          style={inputSt}
        >
          <option value="All" style={{ background: "#121212" }}>All packages</option>
          {PACKAGES.filter(Boolean).map((p) => (
            <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-sm px-5 py-10 text-center text-sm"
          style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
        >
          {leads.length === 0
            ? "No leads yet. Use the Call List tab and click 'Move to Leads' on interested businesses."
            : "No leads match your filters."}
        </div>
      ) : (
        <div className="flex gap-5 flex-1 min-h-0">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Business", "Contact", "Phone", "Package", "Stage", "Date", ""].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setPanelNotes(lead.notes ?? "");
                      setPanelEmail(lead.email ?? "");
                      setPanelName(lead.contactName ?? "");
                    }}
                    className="cursor-pointer transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: selectedLead?.id === lead.id ? "rgba(176,255,0,0.04)" : "transparent",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = selectedLead?.id === lead.id ? "rgba(176,255,0,0.06)" : "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedLead?.id === lead.id ? "rgba(176,255,0,0.04)" : "transparent")}
                  >
                    <td className="py-3 px-3 font-medium text-white max-w-[160px] truncate">{lead.businessName}</td>
                    <td className="py-3 px-3 max-w-[120px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.contactName || "—"}</td>
                    <td className="py-3 px-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone.replace(/\s/g, "")}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "#b0ff00", textDecoration: "none" }}
                        >
                          {lead.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.package ?? ""}
                        onChange={(e) => updatePackage(lead.id, e.target.value as Package)}
                        className="rounded-sm px-2 py-1 text-xs outline-none"
                        style={{
                          background: lead.package ? "rgba(176,255,0,0.08)" : "rgba(255,255,255,0.05)",
                          color: lead.package ? "#b0ff00" : "rgba(255,255,255,0.35)",
                          border: "none",
                          maxWidth: "140px",
                        }}
                      >
                        <option value="" style={{ background: "#121212", color: "#fff" }}>No package</option>
                        {PACKAGES.filter(Boolean).map((p) => (
                          <option key={p} value={p} style={{ background: "#121212", color: "#fff" }}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.stage}
                        onChange={(e) => updateStage(lead.id, e.target.value as Stage)}
                        className="rounded-sm px-2 py-1 text-xs outline-none font-medium"
                        style={{
                          background: stageColor(lead.stage).bg,
                          color: stageColor(lead.stage).color,
                          border: "none",
                        }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s} style={{ background: "#121212", color: "#fff" }}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{formatDate(lead)}</td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setMoveToClientsId(lead.id); setMoveWebsiteUrl(""); }}
                          className="text-xs px-2 py-1 rounded-sm font-medium transition-opacity hover:opacity-80 whitespace-nowrap"
                          style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.2)" }}
                          title="Move to Clients"
                        >
                          → Client
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Side panel */}
          {selectedLead && (
            <div
              className="w-72 shrink-0 rounded-sm p-5 flex flex-col gap-4 overflow-y-auto"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white leading-snug text-sm">{selectedLead.businessName}</h3>
                <button onClick={() => setSelectedLead(null)} className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>✕</button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Contact name</label>
                  <input type="text" value={panelName} onChange={(e) => setPanelName(e.target.value)} className="w-full rounded-sm px-3 py-2 text-xs outline-none" style={inputSt} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Email
                    {selectedLead.emailSentInterest && <span className="ml-2 text-xs" style={{ color: "#ffa500" }}>Interest email sent</span>}
                    {selectedLead.emailSentClosed && <span className="ml-2 text-xs" style={{ color: "#48c78e" }}>Welcome email sent</span>}
                  </label>
                  <input type="email" value={panelEmail} onChange={(e) => setPanelEmail(e.target.value)} className="w-full rounded-sm px-3 py-2 text-xs outline-none" style={inputSt} placeholder="email@business.com" />
                </div>
              </div>

              <div className="text-xs flex flex-col gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {selectedLead.address && <p>📍 {selectedLead.address}</p>}
                {selectedLead.phone && (
                  <p>
                    📱{" "}
                    <a href={`tel:${selectedLead.phone.replace(/\s/g, "")}`} style={{ color: "#b0ff00" }}>
                      {selectedLead.phone}
                    </a>
                  </p>
                )}
                {selectedLead.category && <p>🏷 {selectedLead.category}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Stage</label>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => updateStage(selectedLead.id, e.target.value as Stage)}
                  className="w-full rounded-sm px-3 py-2 text-xs outline-none font-medium"
                  style={{ background: stageColor(selectedLead.stage).bg, color: stageColor(selectedLead.stage).color, border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s} style={{ background: "#121212", color: "#fff" }}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
                <select
                  value={selectedLead.package ?? ""}
                  onChange={(e) => updatePackage(selectedLead.id, e.target.value as Package)}
                  className="w-full rounded-sm px-3 py-2 text-xs outline-none"
                  style={inputSt}
                >
                  <option value="" style={{ background: "#121212" }}>No package selected</option>
                  {PACKAGES.filter(Boolean).map((p) => (
                    <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Notes</label>
                <textarea
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  rows={5}
                  placeholder="Add notes…"
                  className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
                <button
                  onClick={savePanelChanges}
                  disabled={saving}
                  className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#b0ff00", color: "#000" }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>

                {/* Follow-up tools */}
                <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Follow-up</p>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Callback day</label>
                    <input
                      type="text"
                      value={callbackDay}
                      onChange={(e) => setCallbackDay(e.target.value)}
                      placeholder="e.g. Monday"
                      className="w-full rounded-sm px-3 py-2 text-xs outline-none"
                      style={inputSt}
                    />
                  </div>
                  {followUpNameWarning && (
                    <p className="text-xs" style={{ color: "#ff9999" }}>
                      Enter a contact name above first.
                    </p>
                  )}
                  <button
                    onClick={handleSendCallbackText}
                    className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    💬 Send Callback Text
                  </button>
                  <button
                    onClick={handleCopyCallbackEmail}
                    className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
                    style={{
                      background: copiedCallbackEmail ? "rgba(176,255,0,0.12)" : "rgba(255,255,255,0.06)",
                      color: copiedCallbackEmail ? "#b0ff00" : "rgba(255,255,255,0.7)",
                      border: `1px solid ${copiedCallbackEmail ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {copiedCallbackEmail ? "✓ Copied!" : "✉ Copy Callback Email"}
                  </button>
                </div>

                <button
                  onClick={() => { setMoveToClientsId(selectedLead.id); setMoveWebsiteUrl(""); }}
                  className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80 mt-1"
                  style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00", border: "1px solid rgba(176,255,0,0.2)" }}
                >
                  Move to Clients →
                </button>
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(255,107,107,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.2)" }}
                >
                  Delete lead
                </button>
              </div>

              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                Added {formatDate(selectedLead)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Move to Clients modal */}
      {moveToClientsId && (() => {
        const lead = leads.find((l) => l.id === moveToClientsId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
            <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Move to Clients</h3>
                <button onClick={() => setMoveToClientsId(null)} style={{ color: "rgba(255,255,255,0.35)" }}>✕</button>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Moving <span className="text-white font-medium">{lead?.businessName}</span> to Clients. This will remove them from Leads.
              </p>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Website URL (optional)</label>
                <input
                  type="text"
                  value={moveWebsiteUrl}
                  onChange={(e) => setMoveWebsiteUrl(e.target.value)}
                  placeholder="https://business.com"
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                />
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
        );
      })()}

      {/* Closing script panel — fixed right */}
      {scriptOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "40%",
            height: "100vh",
            overflowY: "auto",
            zIndex: 50,
            background: "#0d0d0d",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ padding: "24px", fontFamily: "var(--font-geist), system-ui, sans-serif" }}>
            <p style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Closing Script</p>

            {/* Opening */}
            <div style={{ background: "rgba(176,255,0,0.08)", border: "1px solid rgba(176,255,0,0.25)", borderRadius: "4px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#b0ff00", marginBottom: "10px" }}>Opening</p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff", marginBottom: "10px" }}>
                {`"Hi ${contactName}, it's Sam calling from Dygiko — we spoke the other day about getting a website built for ${businessName}. How are you doing?"`}
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff", marginBottom: "10px" }}>
                {`"Did you get a chance to have a look at our website at dygiko.com?"`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "12px", borderLeft: "2px solid rgba(176,255,0,0.3)" }}>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                  <span style={{ color: "#b0ff00", fontWeight: 600 }}>If yes →</span> {`"What did you think?"`}
                </p>
                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                  <span style={{ color: "#b0ff00", fontWeight: 600 }}>If no →</span> {`"No worries at all — I can walk you through everything now, it'll only take a couple of minutes."`}
                </p>
              </div>
            </div>

            {/* The Pitch */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>The Pitch</p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff" }}>
                {`"So basically what we do is build fully custom websites for businesses like yours — not templates, everything built from scratch so it looks completely unique to you. The reason it's worth having one is simple — when someone needs a [plumber/electrician/roofer] in your area, the first thing they do is Google it. If you're not showing up, that job goes to someone else. A website puts you in front of those customers 24/7 without you lifting a finger. We've got three packages depending on what you need:"`}
              </p>
            </div>

            {/* Packages */}
            <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "14px" }}>Packages</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {[
                { name: "Basic", price: "£500", recur: "+ £29/month", desc: "Fully custom website, your own domain name, hosting and basic SEO so Google can find you. Live within 2 days." },
                { name: "Growth", price: "£750", recur: "+ £29/month", desc: "Everything in Basic plus advanced SEO, blog, contact form and company email address." },
                { name: "Full Business", price: "£1,500", recur: "+ £29/month", desc: "Everything in Growth plus Google Business Profile setup, custom CRM, WhatsApp and call button integration." },
              ].map((pkg) => (
                <div key={pkg.name} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "5px" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#ffffff" }}>{pkg.name}</span>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#b0ff00" }}>{pkg.price}</span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{pkg.recur}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{pkg.desc}</p>
                </div>
              ))}
            </div>

            {/* Retainer note */}
            <div style={{ background: "rgba(176,255,0,0.05)", border: "1px solid rgba(176,255,0,0.15)", borderRadius: "4px", padding: "12px 16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff" }}>
                {`"All packages are then just £29 a month after that — covers hosting, domain renewal, maintenance, everything. We handle it all so you never have to think about it."`}
              </p>
            </div>

            {/* The Close */}
            <div style={{ background: "rgba(176,255,0,0.08)", border: "1px solid rgba(176,255,0,0.25)", borderRadius: "4px", padding: "16px" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#b0ff00", marginBottom: "10px" }}>The Close</p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff", marginBottom: "12px" }}>
                {`"Most of our clients go for the Basic or Growth to start — gets them online quickly and professionally. Which one sounds like it fits what you need?"`}
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#ffffff" }}>
                {`"Brilliant — I can get started today if you want to go ahead. I'll send you a payment link now and we'll have your website live within 48 hours. What email should I send it to?"`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
