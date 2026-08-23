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
const PACKAGES = [
  "Website",
  "CRM",
  "Website + CRM",
  "Social media management",
  "Website + Social media management",
] as const;
type Package = (typeof PACKAGES)[number];

// How the client pays us.
const PAYMENT_TYPES = ["PayPal", "Invoice"] as const;
type PaymentType = (typeof PAYMENT_TYPES)[number];

// How often they're billed. `price` is always the amount for ONE cycle;
// everything annualised multiplies by this. Clients saved before this field
// existed have no value and are treated as Annual.
const BILLING_PERIODS = ["Annual", "Quarterly", "Monthly"] as const;
type BillingPeriod = (typeof BILLING_PERIODS)[number];
const CYCLES_PER_YEAR: Record<BillingPeriod, number> = { Annual: 1, Quarterly: 4, Monthly: 12 };
const PERIOD_SUFFIX: Record<BillingPeriod, string> = { Annual: "/yr", Quarterly: "/qtr", Monthly: "/mo" };

const periodOf = (c: { billingPeriod?: string }): BillingPeriod =>
  (BILLING_PERIODS as readonly string[]).includes(c.billingPeriod ?? "")
    ? (c.billingPeriod as BillingPeriod)
    : "Annual";

// Legacy package names from clients added before the rebrand. Read-only — kept
// so existing client cards and revenue calcs don't break. Pre-existing clients
// keep their stored package name; only new clients pick from PACKAGES above.
type LegacyPackage = "Basic" | "Growth" | "Full Business";
type AnyPackage = Package | LegacyPackage;

// Annual subscription prices — what a client pays each year.
const PACKAGE_PRICE: Record<AnyPackage, number> = {
  Website: 360,
  CRM: 600,
  "Website + CRM": 840,
  "Social media management": 150,
  "Website + Social media management": 510,
  // Legacy — map to a sensible annual amount so old docs don't crash.
  Basic: 360,
  Growth: 360,
  "Full Business": 840,
};

type SubStatus = "Active" | "Paused" | "Cancelled";

type Client = {
  id: string;
  businessName: string;
  email: string;
  package: AnyPackage;
  subscriptionStatus: SubStatus;
  billingPeriod?: string; // "Annual" | "Quarterly" | "Monthly" — absent means Annual
  websiteUrl: string;
  monthlyPrice?: number; // legacy field — ignored; use `price`
  price?: number; // the amount charged each billing cycle
  paymentType?: PaymentType; // how they pay — PayPal or Invoice
  ownerUid?: string | null;
  ownerName?: string | null;
  dateAdded: { toDate?: () => Date } | null;
};

// Local date (YYYY-MM-DD) for the date <input>, avoiding UTC off-by-one.
const todayInput = (): string => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};
const dateToInput = (ts: Client["dateAdded"]): string => {
  const d = ts?.toDate?.();
  if (!d) return todayInput();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

// What the client is charged each billing cycle.
const cyclePriceFor = (c: Client): number => {
  if (typeof c.price === "number") return c.price;
  const annual = PACKAGE_PRICE[c.package] ?? 0;
  return Math.round(annual / CYCLES_PER_YEAR[periodOf(c)]);
};

// Annualised — a £69/mo client is £828/yr. Drives ARR and the monthly average.
const revenueFor = (c: Client): number =>
  cyclePriceFor(c) * CYCLES_PER_YEAR[periodOf(c)];

// Package default for a given billing period, so switching period gives a
// sensible starting figure rather than an annual price on a monthly plan.
const defaultCyclePrice = (pkg: AnyPackage, period: BillingPeriod): number =>
  Math.round((PACKAGE_PRICE[pkg] ?? 0) / CYCLES_PER_YEAR[period]);

const SUB_STATUS_COLORS: Record<SubStatus, { bg: string; color: string }> = {
  Active: { bg: "rgba(176,255,0,0.1)", color: "#b0ff00" },
  Paused: { bg: "rgba(255,165,0,0.1)", color: "#ffa500" },
  Cancelled: { bg: "rgba(255,107,107,0.1)", color: "#ff6b6b" },
};

const PKG_COLORS: Record<AnyPackage, { bg: string; color: string }> = {
  Website: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" },
  CRM: { bg: "rgba(176,255,0,0.08)", color: "#b0ff00" },
  "Website + CRM": { bg: "rgba(176,255,0,0.15)", color: "#b0ff00" },
  "Social media management": { bg: "rgba(168,85,247,0.12)", color: "#c084fc" },
  "Website + Social media management": { bg: "rgba(168,85,247,0.18)", color: "#c084fc" },
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

const PAYPAL_ACTIVITY_URL = "https://www.paypal.com/myaccount/activities/";

const blankForm = () => ({
  businessName: "",
  email: "",
  package: "Website" as Package,
  subscriptionStatus: "Active" as SubStatus,
  websiteUrl: "",
  price: PACKAGE_PRICE.Website,
  billingPeriod: "Annual" as BillingPeriod,
  paymentType: "PayPal" as PaymentType,
  dateAdded: todayInput(),
});

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blankForm);

  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("dateAdded", "desc"));
    return onSnapshot(q, (snap) => {
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
    });
  }, []);

  async function addClient() {
    if (!form.businessName.trim()) return;
    setSaving(true);
    const defaultPrice = defaultCyclePrice(form.package, form.billingPeriod);
    await addDoc(collection(db, "clients"), {
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      websiteUrl: form.websiteUrl.trim(),
      package: form.package,
      subscriptionStatus: "Active",
      price: Number(form.price) || defaultPrice,
      billingPeriod: form.billingPeriod,
      paymentType: form.paymentType,
      dateAdded: form.dateAdded ? new Date(form.dateAdded + "T12:00:00") : serverTimestamp(),
    });
    setForm(blankForm());
    setShowAdd(false);
    setSaving(false);
  }

  async function saveEdit(id: string) {
    const defaultPrice = defaultCyclePrice(editForm.package, editForm.billingPeriod);
    await updateDoc(doc(db, "clients", id), {
      businessName: editForm.businessName.trim(),
      email: editForm.email.trim(),
      package: editForm.package,
      subscriptionStatus: "Active",
      websiteUrl: editForm.websiteUrl.trim(),
      price: Number(editForm.price) || defaultPrice,
      billingPeriod: editForm.billingPeriod,
      paymentType: editForm.paymentType,
      dateAdded: editForm.dateAdded ? new Date(editForm.dateAdded + "T12:00:00") : serverTimestamp(),
      // Clear the legacy field that the `price` field replaced
      monthlyPrice: null,
    });
    setEditId(null);
  }

  async function doDelete() {
    if (!deleteConfirm) return;
    await deleteDoc(doc(db, "clients", deleteConfirm.id));
    setDeleteConfirm(null);
  }

  // Annual recurring revenue = sum of active clients' yearly prices.
  // Each user sees only their own clients; admins see everyone's.
  const visibleClients = clients;
  const activeClients = visibleClients.filter((c) => c.subscriptionStatus === "Active");
  const arr = activeClients.reduce((sum, c) => sum + revenueFor(c), 0);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
        </div>
        <div className="flex gap-2">
          <a
            href={PAYPAL_ACTIVITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none" }}
          >
            PayPal activity ↗
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

      {/* Recurring-revenue summary */}
      {visibleClients.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "ARR", value: `£${arr.toLocaleString("en-GB")}/yr` },
            { label: "Monthly avg", value: `£${Math.round(arr / 12).toLocaleString("en-GB")}` },
            { label: "Active clients", value: String(activeClients.length) },
          ].map((s) => (
            <div key={s.label} className="rounded-sm px-4 py-3" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              <div className="text-lg font-bold mt-0.5" style={{ color: "#b0ff00" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

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
                    setForm((f) => ({ ...f, package: pkg, price: defaultCyclePrice(pkg, f.billingPeriod) }));
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
                    setForm((f) => ({ ...f, billingPeriod: bp, price: defaultCyclePrice(f.package, bp) }));
                  }}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
                >
                  {BILLING_PERIODS.map((b) => <option key={b} value={b} style={{ background: "#121212" }}>{b}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  £{PERIOD_SUFFIX[form.billingPeriod]} (override)
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
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Payment type</label>
              <select
                value={form.paymentType}
                onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value as PaymentType }))}
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
              >
                {PAYMENT_TYPES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Date created</label>
              <input
                type="date"
                value={form.dateAdded}
                onChange={(e) => setForm((f) => ({ ...f, dateAdded: e.target.value }))}
                className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                style={inputSt}
              />
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
      {visibleClients.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleClients.map((client) => (
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
                          setEditForm((f) => ({ ...f, package: pkg, price: defaultCyclePrice(pkg, f.billingPeriod) }));
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
                          setEditForm((f) => ({ ...f, billingPeriod: bp, price: defaultCyclePrice(f.package, bp) }));
                        }} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                          {BILLING_PERIODS.map((b) => <option key={b} value={b} style={{ background: "#121212" }}>{b}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          £{PERIOD_SUFFIX[editForm.billingPeriod]} (override)
                        </label>
                        <input type="number" min={0} step={1} value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Payment type</label>
                      <select value={editForm.paymentType} onChange={(e) => setEditForm((f) => ({ ...f, paymentType: e.target.value as PaymentType }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                        {PAYMENT_TYPES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Date created</label>
                      <input type="date" value={editForm.dateAdded} onChange={(e) => setEditForm((f) => ({ ...f, dateAdded: e.target.value }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
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
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
                          title={`£${revenueFor(client).toLocaleString("en-GB")} a year`}
                        >
                          £{cyclePriceFor(client).toLocaleString("en-GB")}{PERIOD_SUFFIX[periodOf(client)]}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={client.paymentType === "Invoice"
                            ? { background: "rgba(251,191,36,0.12)", color: "#fbbf24" }
                            : { background: "rgba(72,199,142,0.12)", color: "#48c78e" }}
                          title="Payment type"
                        >
                          {client.paymentType ?? "PayPal"}
                        </span>
                      </div>
                      {client.email && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{client.email}</p>
                      )}
                      {client.dateAdded?.toDate && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Client since {client.dateAdded.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditId(client.id);
                          setEditForm({
                            businessName: client.businessName,
                            email: client.email,
                            package: client.package as Package,
                            subscriptionStatus: client.subscriptionStatus,
                            websiteUrl: client.websiteUrl,
                            price: cyclePriceFor(client),
                            billingPeriod: periodOf(client),
                            paymentType: client.paymentType ?? "PayPal",
                            dateAdded: dateToInput(client.dateAdded),
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
