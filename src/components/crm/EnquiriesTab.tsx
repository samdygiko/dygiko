"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Enquiry = {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  businessType?: string | null;
  message?: string | null;
  source?: string | null;
  status?: string;
  createdAt?: { toDate: () => Date } | null;
};

const STATUSES = ["new", "contacted", "closed"] as const;

export default function EnquiriesTab() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (s) => { setItems(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as Enquiry[]); setLoaded(true); },
      () => setLoaded(true)
    );
    return () => unsub();
  }, []);

  const setStatus = (id: string, status: string) => updateDoc(doc(db, "enquiries", id), { status });
  const remove = (id: string) => { if (confirm("Delete this enquiry?")) deleteDoc(doc(db, "enquiries", id)); };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-8">Enquiries</h2>

      <div className="flex flex-col gap-3">
        {items.map((e) => (
          <div key={e.id} className="rounded-sm p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-white font-semibold">{e.name || "—"}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {[e.email, e.phone].filter(Boolean).join(" · ") || "no contact details"}
                  {e.businessType ? ` · ${e.businessType}` : ""}
                </p>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                {e.createdAt?.toDate ? e.createdAt.toDate().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </div>
            {e.message && (
              <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{e.message}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(e.id, s)}
                  className="text-[11px] px-3 py-1 rounded-full capitalize"
                  style={{
                    background: (e.status || "new") === s ? "#3b82f6" : "transparent",
                    color: (e.status || "new") === s ? "#fff" : "rgba(255,255,255,0.5)",
                    border: "1px solid " + ((e.status || "new") === s ? "#3b82f6" : "rgba(255,255,255,0.12)"),
                  }}
                >
                  {s}
                </button>
              ))}
              {e.phone && (
                <a href={`tel:${e.phone}`} className="text-[11px] px-3 py-1 rounded-full" style={{ color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>Call</a>
              )}
              <button onClick={() => remove(e.id)} className="text-[11px] px-3 py-1 rounded-full ml-auto" style={{ color: "rgba(255,120,120,0.8)", border: "1px solid rgba(255,80,80,0.2)" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
