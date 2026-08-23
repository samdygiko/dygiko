"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Order = {
  id: string;
  friendlyId?: string;
  packageName?: string | null;
  amountTotal?: number | null; // pence
  status?: string;
  customer?: { name?: string | null; email?: string | null; phone?: string | null; business?: string | null } | null;
  createdAt?: { toDate: () => Date } | null;
};

export default function OrdersTab() {
  const [items, setItems] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (s) => { setItems(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Order[]); setLoaded(true); },
      () => setLoaded(true)
    );
    return () => unsub();
  }, []);

  const paid = items.filter((o) => o.status === "paid");
  const revenue = paid.reduce((sum, o) => sum + (o.amountTotal || 0), 0) / 100;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-1">Orders</h2>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
        Paid checkouts from your website land here.
      </p>

      <div className="flex gap-3 mb-8">
        <div className="px-5 py-3 rounded-sm" style={{ background: "rgba(176,255,0,0.08)", border: "1px solid rgba(176,255,0,0.2)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Paid orders</p>
          <p className="text-xl font-bold" style={{ color: "#b0ff00" }}>{paid.length}</p>
        </div>
        <div className="px-5 py-3 rounded-sm" style={{ background: "rgba(176,255,0,0.08)", border: "1px solid rgba(176,255,0,0.2)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total revenue</p>
          <p className="text-xl font-bold" style={{ color: "#b0ff00" }}>£{revenue.toLocaleString()}</p>
        </div>
      </div>

      {loaded && items.length === 0 && (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No orders yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((o) => (
          <div key={o.id} className="rounded-sm p-5 flex items-start justify-between gap-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold">{o.packageName || "Order"}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                  background: o.status === "paid" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                  color: o.status === "paid" ? "#4ade80" : "rgba(255,255,255,0.5)",
                }}>{o.status === "pending_payment" ? "pending" : o.status || "—"}</span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                {o.customer?.name || "—"}
                {o.customer?.email ? ` · ${o.customer.email}` : ""}
                {o.customer?.phone ? ` · ${o.customer.phone}` : ""}
                {o.customer?.business ? ` · ${o.customer.business}` : ""}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {o.friendlyId || o.id}{o.createdAt?.toDate ? " · " + o.createdAt.toDate().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            </div>
            <p className="text-lg font-bold shrink-0" style={{ color: "#fff" }}>
              {typeof o.amountTotal === "number" ? `£${(o.amountTotal / 100).toLocaleString()}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
