"use client";

import { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// New packages — picked from the dropdown for new clients
const PACKAGES = ["Website", "CRM", "Website + CRM"] as const;
const SUB_STATUSES = ["Active", "Paused", "Cancelled"] as const;
const BILLING_PERIODS = ["monthly", "annual"] as const;
type Package = (typeof PACKAGES)[number];
type SubStatus = (typeof SUB_STATUSES)[number];
type BillingPeriod = (typeof BILLING_PERIODS)[number];

// Legacy package names from clients added before the rebrand. Read-only — kept
// so existing client cards and MRR calcs don't break. Pre-existing clients
// keep their stored package name; only new clients pick from PACKAGES above.
type LegacyPackage = "Basic" | "Growth" | "Full Business";
type AnyPackage = Package | LegacyPackage;

const PACKAGE_PRICE_MONTHLY: Record<AnyPackage, number> = {
  Website: 69,
  CRM: 129,
  "Website + CRM": 149,
  // Legacy
  Basic: 49,
  Growth: 69,
  "Full Business": 99,
};

const PACKAGE_PRICE_ANNUAL: Record<AnyPackage, number> = {
  Website: 690,
  CRM: 1290,
  "Website + CRM": 1490,
  // Legacy
  Basic: 490,
  Growth: 690,
  "Full Business": 990,
};

type Client = {
  id: string;
  businessName: string;
  email: string;
  package: AnyPackage;
  subscriptionStatus: SubStatus;
  billingPeriod?: BillingPeriod; // defaults to "monthly" for legacy clients
  websiteUrl: string;
  monthlyPrice?: number; // legacy override field — still used as fallback
  price?: number; // new override field — what the customer actually pays per period
  dateAdded: { toDate?: () => Date } | null;
};

// Returns the MRR contribution this client makes (annual subs → annual / 12).
const monthlyFor = (c: Client): number => {
  const period = c.billingPeriod ?? "monthly";
  if (period === "annual") {
    const annual = typeof c.price === "number" ? c.price : (PACKAGE_PRICE_ANNUAL[c.package] ?? 0);
    return annual / 12;
  }
  // Monthly — prefer new `price` field, fall back to legacy `monthlyPrice`, then to package default
  if (typeof c.price === "number") return c.price;
  if (typeof c.monthlyPrice === "number") return c.monthlyPrice;
  return PACKAGE_PRICE_MONTHLY[c.package] ?? 0;
};

// Returns what the customer is actually billed per period (for display on cards).
const periodPriceFor = (c: Client): { amount: number; suffix: string } => {
  const period = c.billingPeriod ?? "monthly";
  if (period === "annual") {
    const annual = typeof c.price === "number" ? c.price : (PACKAGE_PRICE_ANNUAL[c.package] ?? 0);
    return { amount: annual, suffix: "/yr" };
  }
  const monthly = typeof c.price === "number" ? c.price
    : typeof c.monthlyPrice === "number" ? c.monthlyPrice
    : (PACKAGE_PRICE_MONTHLY[c.package] ?? 0);
  return { amount: monthly, suffix: "/mo" };
};

const SUB_STATUS_COLORS: Record<SubStatus, { bg: string; color: string }> = {
  Active: { bg: "rgba(176,255,0,0.1)", color: "#b0ff00" },
  Paused: { bg: "rgba(255,165,0,0.1)", color: "#ffa500" },
  Cancelled: { bg: "rgba(255,107,107,0.1)", color: "#ff6b6b" },
};

const PKG_COLORS: Record<AnyPackage, { bg: string; color: string }> = {
  Website: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" },
  CRM: { bg: "rgba(176,255,0,0.08)", color: "#b0ff00" },
  "Website + CRM": { bg: "rgba(176,255,0,0.15)", color: "#b0ff00" },
  // Legacy
  Basic: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" },
  Growth: { bg: "rgba(176,255,0,0.08)", color: "#b0ff00" },
  "Full Business": { bg: "rgba(176,255,0,0.15)", color: "#b0ff00" },
};

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

const STRIPE_SUBS_URL =
  "https://dashboard.stripe.com/acct_1TGOpQE4vQN588dM/subscriptions?status=active";

const emptyForm = {
  businessName: "",
  email: "",
  package: "Website" as Package,
  subscriptionStatus: "Active" as SubStatus,
  billingPeriod: "monthly" as BillingPeriod,
  websiteUrl: "",
  price: PACKAGE_PRICE_MONTHLY.Website,
};

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("dateAdded", "desc"));
    return onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
    });
  }, []);

  async function addClient() {
    if (!form.businessName.trim()) return;
    setSaving(true);
    const defaultPrice = form.billingPeriod === "annual"
      ? PACKAGE_PRICE_ANNUAL[form.package]
      : PACKAGE_PRICE_MONTHLY[form.package];
    await addDoc(collection(db, "clients"), {
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      websiteUrl: form.websiteUrl.trim(),
      package: form.package,
      subscriptionStatus: form.subscriptionStatus,
      billingPeriod: form.billingPeriod,
      price: Number(form.price) || defaultPrice,
      dateAdded: serverTimestamp(),
    });
    setForm(emptyForm);
    setShowAdd(false);
    setSaving(false);
  }

  async function saveEdit(id: string) {
    const defaultPrice = editForm.billingPeriod === "annual"
      ? (PACKAGE_PRICE_ANNUAL[editForm.package] ?? 0)
      : (PACKAGE_PRICE_MONTHLY[editForm.package] ?? 0);
    await updateDoc(doc(db, "clients", id), {
      businessName: editForm.businessName.trim(),
      email: editForm.email.trim(),
      package: editForm.package,
      subscriptionStatus: editForm.subscriptionStatus,
      billingPeriod: editForm.billingPeriod,
      websiteUrl: editForm.websiteUrl.trim(),
      price: Number(editForm.price) || defaultPrice,
      // Clear legacy field so it doesn't conflict with the new `price` field on existing docs
      monthlyPrice: null,
    });
    setEditId(null);
  }

  async function doDelete() {
    if (!deleteConfirm) return;
    await deleteDoc(doc(db, "clients", deleteConfirm.id));
    setDeleteConfirm(null);
  }

  const activeClients = clients.filter((c) => c.subscriptionStatus === "Active");
  const activeCount = activeClients.length;
  const monthlyIncome = activeClients.reduce((sum, c) => sum + monthlyFor(c), 0);
  const annualIncome = monthlyIncome * 12;
  const monthlySubsCount = activeClients.filter((c) => (c.billingPeriod ?? "monthly") === "monthly").length;
  const annualSubsCount = activeClients.filter((c) => c.billingPeriod === "annual").length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Monthly passive income callout */}
      <div
        className="rounded-sm px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: "rgba(176,255,0,0.06)", border: "1px solid rgba(176,255,0,0.25)" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#b0ff00" }}>
            Monthly passive income
          </p>
          <p className="text-4xl font-black text-white mt-1" style={{ letterSpacing: "-0.02em" }}>
            £{monthlyIncome.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
            <span className="text-base font-medium ml-1" style={{ color: "rgba(255,255,255,0.45)" }}>/ month</span>
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            annual subs normalised (annual ÷ 12)
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Annual run rate
          </p>
          <p className="text-lg font-semibold text-white mt-1">
            £{annualIncome.toLocaleString("en-GB", { maximumFractionDigits: 0 })}<span className="text-xs font-medium ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>/ year</span>
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {monthlySubsCount} monthly · {annualSubsCount} annual
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""} · {activeCount} active subscription{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={STRIPE_SUBS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none" }}
          >
            Stripe subscriptions ↗
          </a>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: showAdd ? "rgba(176,255,0,0.12)" : "#b0ff00", color: showAdd ? "#b0ff00" : "#000", border: showAdd ? "1px solid rgba(176,255,0,0.25)" : "none" }}
          >
            {showAdd ? "Cancel" : "+ Add Client"}
          </button>
        </div>
      </div>

      {/* Add client form */}
      {showAdd && (
        <div
          className="rounded-sm p-5 flex flex-col gap-4"
          style={{ border: "1px solid rgba(176,255,0,0.2)", background: "rgba(176,255,0,0.02)" }}
        >
          <p className="text-sm font-semibold text-white">New Client</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Business name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                placeholder="e.g. Sunrise Plumbing"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contact@business.com"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Website URL</label>
              <input
                type="text"
                value={form.websiteUrl}
                onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://business.com"
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
                <select
                  value={form.package}
                  onChange={(e) => {
                    const pkg = e.target.value as Package;
                    const newPrice = form.billingPeriod === "annual" ? PACKAGE_PRICE_ANNUAL[pkg] : PACKAGE_PRICE_MONTHLY[pkg];
                    setForm((f) => ({ ...f, package: pkg, price: newPrice }));
                  }}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
                >
                  {PACKAGES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Billing</label>
                <select
                  value={form.billingPeriod}
                  onChange={(e) => {
                    const bp = e.target.value as BillingPeriod;
                    const newPrice = bp === "annual" ? PACKAGE_PRICE_ANNUAL[form.package] : PACKAGE_PRICE_MONTHLY[form.package];
                    setForm((f) => ({ ...f, billingPeriod: bp, price: newPrice }));
                  }}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
                >
                  <option value="monthly" style={{ background: "#121212" }}>Monthly</option>
                  <option value="annual" style={{ background: "#121212" }}>Annual</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
                <select
                  value={form.subscriptionStatus}
                  onChange={(e) => setForm((f) => ({ ...f, subscriptionStatus: e.target.value as SubStatus }))}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
                >
                  {SUB_STATUSES.map((s) => <option key={s} value={s} style={{ background: "#121212" }}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  £ {form.billingPeriod === "annual" ? "/year" : "/month"} (override)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={inputSt}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={addClient}
              disabled={!form.businessName.trim() || saving}
              className="text-xs px-5 py-2.5 rounded-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "#b0ff00", color: "#000" }}
            >
              {saving ? "Saving…" : "Save Client"}
            </button>
          </div>
        </div>
      )}

      {/* Clients list */}
      {clients.length === 0 ? (
        <div
          className="rounded-sm px-5 py-12 text-center text-sm"
          style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
        >
          No clients yet. Add your first client above.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-sm p-4 flex flex-col gap-3"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
            >
              {editId === client.id ? (
                /* Inline edit form */
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Business name</label>
                      <input type="text" value={editForm.businessName} onChange={(e) => setEditForm((f) => ({ ...f, businessName: e.target.value }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Website URL</label>
                      <input type="text" value={editForm.websiteUrl} onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
                        <select value={editForm.package} onChange={(e) => {
                          const pkg = e.target.value as Package;
                          const newPrice = editForm.billingPeriod === "annual" ? (PACKAGE_PRICE_ANNUAL[pkg] ?? 0) : (PACKAGE_PRICE_MONTHLY[pkg] ?? 0);
                          setEditForm((f) => ({ ...f, package: pkg, price: newPrice }));
                        }} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                          {PACKAGES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
                          {/* If client is on a legacy package, keep it selectable so we don't silently change their package */}
                          {!PACKAGES.includes(editForm.package as Package) && (
                            <option value={editForm.package} style={{ background: "#121212" }}>{editForm.package} (legacy)</option>
                          )}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Billing</label>
                        <select value={editForm.billingPeriod} onChange={(e) => {
                          const bp = e.target.value as BillingPeriod;
                          const newPrice = bp === "annual" ? (PACKAGE_PRICE_ANNUAL[editForm.package] ?? 0) : (PACKAGE_PRICE_MONTHLY[editForm.package] ?? 0);
                          setEditForm((f) => ({ ...f, billingPeriod: bp, price: newPrice }));
                        }} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                          <option value="monthly" style={{ background: "#121212" }}>Monthly</option>
                          <option value="annual" style={{ background: "#121212" }}>Annual</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
                        <select value={editForm.subscriptionStatus} onChange={(e) => setEditForm((f) => ({ ...f, subscriptionStatus: e.target.value as SubStatus }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                          {SUB_STATUSES.map((s) => <option key={s} value={s} style={{ background: "#121212" }}>{s}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          £ {editForm.billingPeriod === "annual" ? "/year" : "/month"} (override)
                        </label>
                        <input type="number" min={0} step={1} value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                    <button onClick={() => saveEdit(client.id)} disabled={!editForm.businessName.trim()} className="text-xs px-3 py-1.5 rounded-sm font-semibold disabled:opacity-40" style={{ background: "#b0ff00", color: "#000" }}>Save</button>
                  </div>
                </div>
              ) : (
                /* Card view */
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">{client.businessName}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={PKG_COLORS[client.package] ?? PKG_COLORS.Basic}
                        >
                          {client.package}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={SUB_STATUS_COLORS[client.subscriptionStatus] ?? SUB_STATUS_COLORS.Active}
                        >
                          {client.subscriptionStatus}
                        </span>
                        {(() => {
                          const { amount, suffix } = periodPriceFor(client);
                          return (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
                              title={client.billingPeriod === "annual" ? `MRR contribution: £${(monthlyFor(client)).toFixed(0)}/mo` : undefined}
                            >
                              £{amount.toLocaleString("en-GB")}{suffix}
                            </span>
                          );
                        })()}
                      </div>
                      {client.email && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{client.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditId(client.id);
                          const period = client.billingPeriod ?? "monthly";
                          const { amount } = periodPriceFor(client);
                          setEditForm({
                            businessName: client.businessName,
                            email: client.email,
                            package: client.package as Package,
                            subscriptionStatus: client.subscriptionStatus,
                            billingPeriod: period,
                            websiteUrl: client.websiteUrl,
                            price: amount,
                          });
                        }}
                        className="text-xs px-2.5 py-1 rounded-sm transition-opacity hover:opacity-80"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: client.id, name: client.businessName })}
                        className="text-xs opacity-35 hover:opacity-80 transition-opacity"
                        style={{ color: "#ff6b6b" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {client.websiteUrl && (
                    <a
                      href={client.websiteUrl.startsWith("http") ? client.websiteUrl : `https://${client.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs transition-opacity hover:opacity-80 w-fit"
                      style={{ color: "#b0ff00", textDecoration: "none" }}
                    >
                      {client.websiteUrl.replace(/^https?:\/\//, "")} ↗
                    </a>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-sm p-6 flex flex-col gap-5" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div>
              <h3 className="font-semibold text-white mb-1">Remove client?</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Remove <span className="text-white font-medium">{deleteConfirm.name}</span> from the client list?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
              <button onClick={doDelete} className="flex-1 py-2.5 text-sm font-semibold rounded-sm" style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.25)" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
