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
type Package = (typeof PACKAGES)[number];

// Legacy package names from clients added before the rebrand. Read-only — kept
// so existing client cards and revenue calcs don't break. Pre-existing clients
// keep their stored package name; only new clients pick from PACKAGES above.
type LegacyPackage = "Basic" | "Growth" | "Full Business";
type AnyPackage = Package | LegacyPackage;

// One-off prices — the canonical amount a client pays for a build.
const PACKAGE_PRICE: Record<AnyPackage, number> = {
  Website: 500,
  CRM: 1000,
  "Website + CRM": 1250,
  // Legacy — map to a sensible one-off so old docs don't crash.
  Basic: 500,
  Growth: 500,
  "Full Business": 1250,
};

type SubStatus = "Active" | "Paused" | "Cancelled";

type Client = {
  id: string;
  businessName: string;
  email: string;
  package: AnyPackage;
  subscriptionStatus: SubStatus;
  billingPeriod?: string; // legacy field — ignored under one-off pricing
  websiteUrl: string;
  monthlyPrice?: number; // legacy field — ignored under one-off pricing
  price?: number; // the one-off amount the customer paid
  dateAdded: { toDate?: () => Date } | null;
};

// Returns the one-off revenue this client represents.
// Prefers the stored `price`, falls back to the package default, then 0.
// Gracefully ignores legacy `billingPeriod` / `monthlyPrice` fields.
const revenueFor = (c: Client): number => {
  if (typeof c.price === "number") return c.price;
  return PACKAGE_PRICE[c.package] ?? 0;
};

const SUB_STATUS_COLORS: Record<SubStatus, { bg: string; color: string }> = {
  Active: { bg: "rgba(59, 130, 246,0.1)", color: "#3b82f6" },
  Paused: { bg: "rgba(255,165,0,0.1)", color: "#ffa500" },
  Cancelled: { bg: "rgba(255,107,107,0.1)", color: "#ff6b6b" },
};

const PKG_COLORS: Record<AnyPackage, { bg: string; color: string }> = {
  Website: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" },
  CRM: { bg: "rgba(59, 130, 246,0.08)", color: "#3b82f6" },
  "Website + CRM": { bg: "rgba(59, 130, 246,0.15)", color: "#3b82f6" },
  // Legacy
  Basic: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" },
  Growth: { bg: "rgba(59, 130, 246,0.08)", color: "#3b82f6" },
  "Full Business": { bg: "rgba(59, 130, 246,0.15)", color: "#3b82f6" },
};

const inputSt = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

const PAYPAL_ACTIVITY_URL = "https://www.paypal.com/myaccount/activities/";

const emptyForm = {
  businessName: "",
  email: "",
  package: "Website" as Package,
  subscriptionStatus: "Active" as SubStatus,
  websiteUrl: "",
  price: PACKAGE_PRICE.Website,
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
    const defaultPrice = PACKAGE_PRICE[form.package] ?? 0;
    await addDoc(collection(db, "clients"), {
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      websiteUrl: form.websiteUrl.trim(),
      package: form.package,
      subscriptionStatus: "Active",
      price: Number(form.price) || defaultPrice,
      dateAdded: serverTimestamp(),
    });
    setForm(emptyForm);
    setShowAdd(false);
    setSaving(false);
  }

  async function saveEdit(id: string) {
    const defaultPrice = PACKAGE_PRICE[editForm.package] ?? 0;
    await updateDoc(doc(db, "clients", id), {
      businessName: editForm.businessName.trim(),
      email: editForm.email.trim(),
      package: editForm.package,
      subscriptionStatus: "Active",
      websiteUrl: editForm.websiteUrl.trim(),
      price: Number(editForm.price) || defaultPrice,
      // Clear legacy fields so they don't conflict with the one-off `price` field
      billingPeriod: null,
      monthlyPrice: null,
    });
    setEditId(null);
  }

  async function doDelete() {
    if (!deleteConfirm) return;
    await deleteDoc(doc(db, "clients", deleteConfirm.id));
    setDeleteConfirm(null);
  }

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
            style={{ background: showAdd ? "rgba(59, 130, 246,0.12)" : "#3b82f6", color: showAdd ? "#3b82f6" : "#000", border: showAdd ? "1px solid rgba(59, 130, 246,0.25)" : "none" }}
          >
            {showAdd ? "Cancel" : "+ Add Client"}
          </button>
        </div>
      </div>

      {/* Add client form */}
      {showAdd && (
        <div
          className="rounded-sm p-5 flex flex-col gap-4"
          style={{ border: "1px solid rgba(59, 130, 246,0.2)", background: "rgba(59, 130, 246,0.02)" }}
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
                    setForm((f) => ({ ...f, package: pkg, price: PACKAGE_PRICE[pkg] ?? 0 }));
                  }}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
                  style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}
                >
                  {PACKAGES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  £ one-off (override)
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
              style={{ background: "#3b82f6", color: "#000" }}
            >
              {saving ? "Saving…" : "Save Client"}
            </button>
          </div>
        </div>
      )}

      {/* Clients list */}
      {clients.length > 0 && (
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
                          setEditForm((f) => ({ ...f, package: pkg, price: PACKAGE_PRICE[pkg] ?? 0 }));
                        }} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={{ ...inputSt, background: "rgba(255,255,255,0.04)" }}>
                          {PACKAGES.map((p) => <option key={p} value={p} style={{ background: "#121212" }}>{p}</option>)}
                          {/* If client is on a legacy package, keep it selectable so we don't silently change their package */}
                          {!PACKAGES.includes(editForm.package as Package) && (
                            <option value={editForm.package} style={{ background: "#121212" }}>{editForm.package} (legacy)</option>
                          )}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          £ one-off (override)
                        </label>
                        <input type="number" min={0} step={1} value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Cancel</button>
                    <button onClick={() => saveEdit(client.id)} disabled={!editForm.businessName.trim()} className="text-xs px-3 py-1.5 rounded-sm font-semibold disabled:opacity-40" style={{ background: "#3b82f6", color: "#000" }}>Save</button>
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
                        >
                          £{revenueFor(client).toLocaleString("en-GB")} one-off
                        </span>
                      </div>
                      {client.email && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{client.email}</p>
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
                            price: revenueFor(client),
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
                      style={{ color: "#3b82f6", textDecoration: "none" }}
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
