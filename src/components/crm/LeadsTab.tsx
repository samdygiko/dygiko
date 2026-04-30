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
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { dialViaJustCall } from "@/components/crm/JustCallDialerPanel";

type Stage = "Pending/Callback" | "Template Made" | "Sent" | "Dead";
type Package = "" | "Basic £49/mo" | "Growth £69/mo" | "Full Business £99/mo";

const STAGES: Stage[] = ["Pending/Callback", "Template Made", "Sent", "Dead"];

const STAGE_COLORS: Record<Stage, { bg: string; color: string }> = {
  "Pending/Callback": { bg: "rgba(255,165,0,0.12)", color: "#ffa500" },
  "Template Made": { bg: "rgba(168,85,247,0.15)", color: "#c084fc" },
  "Sent": { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  "Dead": { bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)" },
};

const PACKAGES: Package[] = ["", "Basic £49/mo", "Growth £69/mo", "Full Business £99/mo"];

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
  templateSent: boolean;
  templateLink: string;
  dateAdded: { toDate?: () => Date } | null;
  updates?: { text: string; at: Timestamp }[];
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
  const [moveToClientsId, setMoveToClientsId] = useState<string | null>(null);
  const [moveWebsiteUrl, setMoveWebsiteUrl] = useState("");
  const [movingToClients, setMovingToClients] = useState(false);
  const [panelTemplateLink, setPanelTemplateLink] = useState("");
  const [currentUpdate, setCurrentUpdate] = useState("");
  const router = useRouter();

  const sendTemplateToAdmin = async () => {
    const url = panelTemplateLink.trim();
    if (!url || !selectedLead) return;
    try { await savePanelChanges(); } catch { /* keep going even if save fails */ }
    const params = new URLSearchParams({
      tab: "Admin",
      prefillName: panelName.trim(),
      prefillUrl: url,
    });
    router.push(`/crm?${params.toString()}`);
  };

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("dateAdded", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => {
        const data = d.data();
        if (data.stage === "Template Made & Sent" || data.stage === "Template Sent") {
          data.stage = "Template Made";
          updateDoc(doc(db, "leads", d.id), { stage: "Template Made" }).catch(() => {});
        }
        return { id: d.id, ...data } as Lead;
      }));
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
        setPanelTemplateLink(updated.templateLink ?? "");
      }
    } else {
      setCurrentUpdate("");
    }
  }, [leads, selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStage(id: string, stage: Stage) {
    await updateDoc(doc(db, "leads", id), { stage });
  }

  async function updatePackage(id: string, pkg: Package) {
    await updateDoc(doc(db, "leads", id), { package: pkg });
  }

  async function savePanelChanges() {
    if (!selectedLead) return;
    setSaving(true);
    const trimmedUpdate = currentUpdate.trim();
    const payload: Record<string, unknown> = {
      notes: panelNotes,
      email: panelEmail,
      contactName: panelName,
      templateLink: panelTemplateLink,
    };
    if (trimmedUpdate) {
      payload.updates = arrayUnion({ text: trimmedUpdate, at: Timestamp.now() });
    }
    await updateDoc(doc(db, "leads", selectedLead.id), payload);
    if (trimmedUpdate) setCurrentUpdate("");
    setSaving(false);
  }

  async function toggleTemplateSent(lead: Lead) {
    await updateDoc(doc(db, "leads", lead.id), { templateSent: !lead.templateSent });
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

    // Map labelled package → name. Accepts both new (£49/mo) and legacy (£500) labels.
    const pkgMap: Record<string, string> = {
      "Basic £49/mo": "Basic",
      "Growth £69/mo": "Growth",
      "Full Business £99/mo": "Full Business",
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

  const activeLeads = leads.filter((l) => l.stage !== "Dead");

  const filtered = leads
    .filter((l) => {
      if (filterStage !== "All" && l.stage !== filterStage) return false;
      if (filterPackage !== "All" && l.package !== filterPackage) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.stage === "Dead" && b.stage !== "Dead") return 1;
      if (a.stage !== "Dead" && b.stage === "Dead") return -1;
      return 0;
    });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {activeLeads.length} total · {leads.filter((l) => l.stage === "Template Made").length} templated
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
                      setPanelTemplateLink(lead.templateLink ?? "");
                    }}
                    className="cursor-pointer transition-colors duration-100"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: selectedLead?.id === lead.id ? "rgba(176,255,0,0.04)" : "transparent",
                      opacity: lead.stage === "Dead" ? 0.3 : 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = selectedLead?.id === lead.id ? "rgba(176,255,0,0.06)" : "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedLead?.id === lead.id ? "rgba(176,255,0,0.04)" : "transparent")}
                  >
                    <td className="py-3 px-3 font-medium text-white max-w-[160px] truncate">{lead.businessName}</td>
                    <td className="py-3 px-3 max-w-[120px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.contactName || "—"}</td>
                    <td className="py-3 px-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {lead.phone ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); dialViaJustCall(lead.phone!.replace(/\s/g, ""), lead.id || ""); }}
                          style={{ color: "#b0ff00", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          {lead.phone}
                        </button>
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
                    <button
                      onClick={() => dialViaJustCall(selectedLead.phone!.replace(/\s/g, ""), selectedLead.id || "")}
                      style={{ color: "#b0ff00", background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                    >
                      {selectedLead.phone}
                    </button>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Template link</label>
                <div className="rounded-sm p-2.5 flex flex-col gap-2" style={{ background: "rgba(176,255,0,0.04)", border: "1px solid rgba(176,255,0,0.2)" }}>
                  <input
                    value={panelTemplateLink}
                    onChange={(e) => setPanelTemplateLink(e.target.value)}
                    placeholder="https://template.dygiko.com/…"
                    className="w-full rounded-sm px-2.5 py-1.5 text-xs outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={sendTemplateToAdmin}
                      disabled={!panelTemplateLink.trim()}
                      className="flex-1 text-xs py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "#b0ff00", color: "#000", border: "1px solid rgba(176,255,0,0.3)" }}
                    >
                      Send template via SMS →
                    </button>
                    {panelTemplateLink.trim() && (
                      <a
                        href={panelTemplateLink.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs py-1.5 px-3 rounded-sm font-medium transition-opacity hover:opacity-80"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        Open ↗
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Opens the Admin SMS template with name and URL pre-filled. Auto-saves the link to this lead.</p>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Current update</label>
                <textarea
                  value={currentUpdate}
                  onChange={(e) => setCurrentUpdate(e.target.value)}
                  rows={3}
                  placeholder="What's the latest? (e.g. 'cb monday 28/04 3pm')"
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "rgba(176,255,0,0.05)", border: "1px solid rgba(176,255,0,0.25)", color: "#fff" }}
                />
                <button
                  onClick={savePanelChanges}
                  disabled={saving}
                  className="text-xs py-2 rounded-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "#b0ff00", color: "#000" }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>

                {/* Updates timeline — newest first */}
                {(() => {
                  const sorted = [...(selectedLead.updates ?? [])].sort((a, b) => {
                    const ta = a.at?.toMillis?.() ?? 0;
                    const tb = b.at?.toMillis?.() ?? 0;
                    return tb - ta;
                  });
                  if (sorted.length === 0) return null;
                  const fmt = (t: Timestamp) => {
                    try {
                      return t.toDate().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                    } catch { return ""; }
                  };
                  return (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="rounded-sm px-3 py-2.5" style={{ background: "rgba(176,255,0,0.08)", border: "1px solid rgba(176,255,0,0.2)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#b0ff00" }}>Latest</div>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "#fff" }}>{sorted[0].text}</p>
                        <div className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(sorted[0].at)}</div>
                      </div>
                      {sorted.length > 1 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Earlier updates</div>
                          {sorted.slice(1).map((u, i) => (
                            <div key={i} className="rounded-sm px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <p className="text-xs whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.6)" }}>{u.text}</p>
                              <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{fmt(u.at)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Legacy notes — collapsed by default */}
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>Earlier notes (legacy)</summary>
                  <textarea
                    value={panelNotes}
                    onChange={(e) => setPanelNotes(e.target.value)}
                    rows={4}
                    placeholder="Older free-form notes live here…"
                    className="w-full rounded-sm px-3 py-2 text-xs outline-none resize-none mt-1.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  />
                </details>

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

    </div>
  );
}
