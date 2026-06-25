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
import { db } from "@/lib/firebase";
import { dialViaJustCall } from "@/components/crm/JustCallDialerPanel";

type Stage = "Pending" | "Booked" | "Dead";

const STAGES: Stage[] = ["Pending", "Booked", "Dead"];

const STAGE_COLORS: Record<Stage, { bg: string; color: string }> = {
  "Pending": { bg: "rgba(255,165,0,0.12)", color: "#ffa500" },
  "Booked": { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  "Dead": { bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)" },
};

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
  notes: string;
  emailSentInterest: boolean;
  emailSentClosed: boolean;
  templateSent: boolean;
  templateLink: string;
  bookingDateTime?: string; // ISO datetime when the consultation is scheduled
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
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [panelNotes, setPanelNotes] = useState("");
  const [panelEmail, setPanelEmail] = useState("");
  const [panelName, setPanelName] = useState("");
  const [saving, setSaving] = useState(false);
  const [moveToClientsId, setMoveToClientsId] = useState<string | null>(null);
  const [moveWebsiteUrl, setMoveWebsiteUrl] = useState("");
  const [movePackage, setMovePackage] = useState<"Website" | "CRM" | "Website + CRM">("Website");
  const [moveBilling, setMoveBilling] = useState<"monthly" | "annual">("monthly");
  const [movingToClients, setMovingToClients] = useState(false);
  const [panelBookingDateTime, setPanelBookingDateTime] = useState("");
  const [currentUpdate, setCurrentUpdate] = useState("");

  // Add Lead modal
  const [addOpen, setAddOpen] = useState(false);
  const [addBusiness, setAddBusiness] = useState("");
  const [addContact, setAddContact] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "leads"), orderBy("dateAdded", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map((d) => {
        const data = d.data();
        // Migrate legacy stages to the new pipeline (Pending / Booked / Dead).
        // Old 'Closed' is also gone — closed leads should have been moved to Clients;
        // any stragglers map to Booked so they're still visible at the top of the list.
        const LEGACY_TO_NEW: Record<string, Stage> = {
          "Pending/Callback": "Pending",
          "Template Made": "Booked",
          "Template Made & Sent": "Booked",
          "Template Sent": "Booked",
          "Sent": "Booked",
          "Closed": "Booked",
        };
        if (LEGACY_TO_NEW[data.stage]) {
          const next = LEGACY_TO_NEW[data.stage];
          data.stage = next;
          updateDoc(doc(db, "leads", d.id), { stage: next }).catch(() => {});
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
        setPanelBookingDateTime(updated.bookingDateTime ?? "");
      }
    } else {
      setCurrentUpdate("");
    }
  }, [leads, selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStage(id: string, stage: Stage) {
    await updateDoc(doc(db, "leads", id), { stage });
  }

  async function savePanelChanges() {
    if (!selectedLead) return;
    setSaving(true);
    const trimmedUpdate = currentUpdate.trim();
    const payload: Record<string, unknown> = {
      notes: panelNotes,
      email: panelEmail,
      contactName: panelName,
      bookingDateTime: panelBookingDateTime || null,
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

  function resetAddForm() {
    setAddBusiness("");
    setAddContact("");
    setAddPhone("");
    setAddEmail("");
    setAddNotes("");
    setAddError("");
  }

  async function submitNewLead() {
    const business = addBusiness.trim();
    const phone = addPhone.trim();
    if (!business) { setAddError("Business name is required."); return; }
    if (!phone) { setAddError("Phone number is required."); return; }

    setAddSaving(true);
    setAddError("");
    try {
      await addDoc(collection(db, "leads"), {
        businessName: business,
        contactName: addContact.trim(),
        email: addEmail.trim(),
        phone,
        address: "",
        category: "",
        websiteStatus: "",
        googleMapsUrl: "",
        stage: "Pending/Callback",
        package: "",
        notes: addNotes.trim(),
        emailSentInterest: false,
        emailSentClosed: false,
        templateSent: false,
        templateLink: "",
        manuallyAdded: true,
        dateAdded: serverTimestamp(),
      });
      resetAddForm();
      setAddOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add lead.");
    } finally {
      setAddSaving(false);
    }
  }

  async function confirmMoveToClients() {
    if (!moveToClientsId) return;
    const lead = leads.find((l) => l.id === moveToClientsId);
    if (!lead) return;
    setMovingToClients(true);

    // Use the package + billing chosen in the move modal
    const PACKAGE_PRICE_MONTHLY = { "Website": 69, "CRM": 129, "Website + CRM": 149 } as const;
    const PACKAGE_PRICE_ANNUAL  = { "Website": 690, "CRM": 1290, "Website + CRM": 1490 } as const;
    const price = moveBilling === "annual" ? PACKAGE_PRICE_ANNUAL[movePackage] : PACKAGE_PRICE_MONTHLY[movePackage];

    await addDoc(collection(db, "clients"), {
      businessName: lead.businessName,
      email: lead.email ?? "",
      package: movePackage,
      billingPeriod: moveBilling,
      price,
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
    const headers = ["Business", "Contact", "Email", "Phone", "Category", "Stage", "Notes", "Date"];
    const rows = filtered.map((l) => [
      l.businessName,
      l.contactName ?? "",
      l.email ?? "",
      l.phone ?? "",
      l.category ?? "",
      l.stage,
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
            {activeLeads.length} total · {leads.filter((l) => l.stage === "Booked").length} booked · {leads.filter((l) => l.stage === "Pending").length} pending
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle: list / calendar */}
          <div
            className="inline-flex p-0.5 rounded-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setView("list")}
              className="text-xs px-3 py-1.5 rounded-sm font-medium transition-colors"
              style={{ background: view === "list" ? "rgba(176,255,0,0.12)" : "transparent", color: view === "list" ? "#b0ff00" : "rgba(255,255,255,0.5)" }}
            >
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className="text-xs px-3 py-1.5 rounded-sm font-medium transition-colors"
              style={{ background: view === "calendar" ? "rgba(176,255,0,0.12)" : "transparent", color: view === "calendar" ? "#b0ff00" : "rgba(255,255,255,0.5)" }}
            >
              📅 Calendar
            </button>
          </div>
          <button
            onClick={() => { resetAddForm(); setAddOpen(true); }}
            className="text-xs px-4 py-2 rounded-sm font-semibold text-black transition-opacity hover:opacity-80"
            style={{ background: "#b0ff00" }}
          >
            + Add lead
          </button>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
        </div>
      ) : view === "calendar" ? (
        <CalendarView
          leads={leads.filter((l) => !!l.bookingDateTime)}
          month={calMonth}
          onPrev={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNext={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          onToday={() => { const d = new Date(); setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}
          onSelectLead={(lead) => {
            setSelectedLead(lead);
            setPanelNotes(lead.notes ?? "");
            setPanelEmail(lead.email ?? "");
            setPanelName(lead.contactName ?? "");
            setPanelBookingDateTime(lead.bookingDateTime ?? "");
          }}
        />
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
                  {["Business", "Contact", "Phone", "Stage", "Date", ""].map((h) => (
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
                      setPanelBookingDateTime(lead.bookingDateTime ?? "");
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
                  <p className="flex items-center gap-2 flex-wrap">
                    📱{" "}
                    <button
                      onClick={() => dialViaJustCall(selectedLead.phone!.replace(/\s/g, ""), selectedLead.id || "")}
                      style={{ color: "#b0ff00", background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                    >
                      {selectedLead.phone}
                    </button>
                    <a
                      href={`https://wa.me/${selectedLead.phone.replace(/[^\d]/g, "").replace(/^0/, "44")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded-sm font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)", textDecoration: "none" }}
                      title="Open WhatsApp with this number prefilled (free)"
                    >
                      💚 WhatsApp
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
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Booking date &amp; time
                  {selectedLead.bookingDateTime && (
                    <span className="ml-2 font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>
                      · {new Date(selectedLead.bookingDateTime).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={panelBookingDateTime}
                  onChange={(e) => setPanelBookingDateTime(e.target.value)}
                  className="w-full rounded-sm px-3 py-2 text-xs outline-none"
                  style={inputSt}
                />
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

      {/* Add Lead modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md rounded-sm p-6 flex flex-col gap-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Add lead manually</h3>
              <button
                onClick={() => { setAddOpen(false); resetAddForm(); }}
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                ✕
              </button>
            </div>

            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Add a lead manually. Only business name and phone are required.
            </p>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Business name <span style={{ color: "#ff6b6b" }}>*</span>
              </label>
              <input
                type="text"
                value={addBusiness}
                onChange={(e) => setAddBusiness(e.target.value)}
                placeholder="e.g. Lucy Interior Design"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Contact name
              </label>
              <input
                type="text"
                value={addContact}
                onChange={(e) => setAddContact(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Phone <span style={{ color: "#ff6b6b" }}>*</span>
              </label>
              <input
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="07xxx xxxxxx"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Email
              </label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="email@business.com"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Notes
              </label>
              <textarea
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                rows={3}
                placeholder="Anything useful — where the lead came from, what they want, follow-up timing."
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none resize-none"
                style={inputSt}
              />
            </div>

            {addError && (
              <p className="text-xs" style={{ color: "#ff6b6b" }}>{addError}</p>
            )}

            <div className="flex gap-3 mt-1">
              <button
                onClick={() => { setAddOpen(false); resetAddForm(); }}
                className="flex-1 py-2.5 text-sm rounded-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Cancel
              </button>
              <button
                onClick={submitNewLead}
                disabled={addSaving}
                className="flex-1 py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "#b0ff00" }}
              >
                {addSaving ? "Saving…" : "Save lead"}
              </button>
            </div>
          </div>
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
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
                  <select
                    value={movePackage}
                    onChange={(e) => setMovePackage(e.target.value as typeof movePackage)}
                    className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                    style={inputSt}
                  >
                    <option value="Website" style={{ background: "#121212" }}>Website (£69/mo · £690/yr)</option>
                    <option value="CRM" style={{ background: "#121212" }}>CRM (£129/mo · £1,290/yr)</option>
                    <option value="Website + CRM" style={{ background: "#121212" }}>Website + CRM (£149/mo · £1,490/yr)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Billing</label>
                  <select
                    value={moveBilling}
                    onChange={(e) => setMoveBilling(e.target.value as "monthly" | "annual")}
                    className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                    style={inputSt}
                  >
                    <option value="monthly" style={{ background: "#121212" }}>Monthly</option>
                    <option value="annual" style={{ background: "#121212" }}>Annual (2 months free)</option>
                  </select>
                </div>
              </div>
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

/* ─── Calendar view ──────────────────────────────────────────────────────── */

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarView({
  leads,
  month,
  onPrev,
  onNext,
  onToday,
  onSelectLead,
}: {
  leads: Lead[];
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectLead: (lead: Lead) => void;
}) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  // Build a 6-row grid covering the month, padded into the previous/next month so the grid is always full
  const firstOfMonth = new Date(year, monthIdx, 1);
  // JS weekday: Sun=0 ... we want Mon=0
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIdx, 1 - firstWeekday);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }

  // Group leads with bookingDateTime by yyyy-mm-dd
  const byDay = new Map<string, Lead[]>();
  for (const l of leads) {
    if (!l.bookingDateTime) continue;
    const d = new Date(l.bookingDateTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = byDay.get(key) ?? [];
    arr.push(l);
    byDay.set(key, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => new Date(a.bookingDateTime!).getTime() - new Date(b.bookingDateTime!).getTime());
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const monthBookings = leads.filter((l) => {
    if (!l.bookingDateTime) return false;
    const d = new Date(l.bookingDateTime);
    return d.getFullYear() === year && d.getMonth() === monthIdx;
  });

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Month header + nav */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="text-sm px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-white" style={{ minWidth: 180, textAlign: "center" }}>
            {MONTH_NAMES[monthIdx]} {year}
          </h3>
          <button
            onClick={onNext}
            className="text-sm px-3 py-1.5 rounded-sm transition-opacity hover:opacity-80"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            →
          </button>
          <button
            onClick={onToday}
            className="text-xs px-3 py-1.5 rounded-sm font-medium transition-opacity hover:opacity-80 ml-2"
            style={{ border: "1px solid rgba(176,255,0,0.3)", color: "#b0ff00" }}
          >
            Today
          </button>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {monthBookings.length} booking{monthBookings.length !== 1 ? "s" : ""} this month
        </p>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10px] font-semibold uppercase tracking-[0.12em] py-1.5 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          const inMonth = cell.getMonth() === monthIdx;
          const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
          const dayLeads = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className="rounded-sm p-2 flex flex-col gap-1 min-w-0 overflow-hidden"
              style={{
                minHeight: 96,
                background: inMonth ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.005)",
                border: `1px solid ${isToday ? "rgba(176,255,0,0.35)" : "rgba(255,255,255,0.06)"}`,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: isToday ? "#b0ff00" : inMonth ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}
              >
                {cell.getDate()}
              </span>
              <div className="flex flex-col gap-1 min-w-0">
                {dayLeads.slice(0, 3).map((lead) => {
                  const t = new Date(lead.bookingDateTime!);
                  const time = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <button
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="text-left rounded-sm px-1.5 py-1 transition-opacity hover:opacity-80 block w-full min-w-0 overflow-hidden"
                      style={{
                        background: stageColor(lead.stage).bg,
                        color: stageColor(lead.stage).color,
                        fontSize: "10px",
                        lineHeight: 1.3,
                        border: "none",
                        cursor: "pointer",
                      }}
                      title={`${lead.businessName} — ${lead.stage}`}
                    >
                      <div className="font-semibold">{time}</div>
                      <div
                        className="opacity-90"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lead.businessName}
                      </div>
                    </button>
                  );
                })}
                {dayLeads.length > 3 && (
                  <span className="text-[10px] px-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    +{dayLeads.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
