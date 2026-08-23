"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DygikoLogo from "@/components/DygikoLogo";
import LeadsTab from "@/components/crm/LeadsTab";
import EnquiriesTab from "@/components/crm/EnquiriesTab";
import ClientsTab from "@/components/crm/ClientsTab";
import OrdersTab from "@/components/crm/OrdersTab";
import ChecklistTab from "@/components/crm/ChecklistTab";
import { UK_POSTCODES } from "@/lib/ukPostcodes";

const TABS = ["Leads", "Enquiries", "Clients", "Orders", "Checklist", "Admin"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Leads: "◎",
  Enquiries: "✉",
  Clients: "◈",
  Orders: "🧾",
  Checklist: "✓",
  Admin: "⚙",
};

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageInner />
    </Suspense>
  );
}

function CRMPageInner() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams?.get("tab");
    return (TABS as readonly string[]).includes(t || "") ? (t as Tab) : "Leads";
  });
  const [leadsCount, setLeadsCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Back-to-top button. The list can scroll inside a nested container, so we
  // listen in the capture phase (scroll doesn't bubble) to catch whichever
  // element actually scrolls, and scroll that one back up.
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement;
      if (!t || typeof t.scrollTop !== "number") return;
      scrollerRef.current = t;
      setShowTop(t.scrollTop > 400);
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, []);
  const goTop = () => {
    const el = scrollerRef.current;
    if (el && typeof el.scrollTo === "function") el.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/crm/login");
  }, [loading, user, router]);

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && (TABS as readonly string[]).includes(t)) setTab(t as Tab);
  }, [searchParams]);

  // Arrow-key navigation through the sidebar tabs (ignored while typing in a field).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const el = (e.target as HTMLElement | null) ?? (document.activeElement as HTMLElement | null);
      if (el) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return;
      }
      e.preventDefault();
      setTab((cur) => {
        const i = TABS.indexOf(cur);
        const next = e.key === "ArrowDown"
          ? (i + 1) % TABS.length
          : (i - 1 + TABS.length) % TABS.length;
        return TABS[next];
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const u2 = onSnapshot(collection(db, "leads"), (s) =>
      setLeadsCount(s.docs.filter((d) => d.data().notInterested !== true).length)
    );
    const u3 = onSnapshot(collection(db, "clients"), (s) => setClientsCount(s.size));
    return () => { u2(); u3(); };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080808", color: "#fff" }}>
      {/* Mobile top bar */}
      <div
        className="flex lg:hidden items-center justify-between px-4 h-14 sticky top-0 z-30"
        style={{ background: "#080808", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <DygikoLogo iconSize={20} />
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-sm"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
        >
          {sidebarOpen ? "✕" : "☰"} {tab}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-56 flex flex-col lg:static lg:flex lg:translate-x-0 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ background: "#080808", borderRight: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}
        >
          <div className="px-5 pb-6 hidden lg:flex items-center">
            <a href="/" className="opacity-70 hover:opacity-100 transition-opacity">
              <DygikoLogo iconSize={20} />
            </a>
            <span className="ml-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>CRM</span>
          </div>

          {/* Stats */}
          <div className="px-4 mb-6 flex flex-col gap-2">
            {[
              { label: "Leads", value: leadsCount },
              { label: "Clients", value: clientsCount },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between px-3 py-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
                <span className="text-sm font-bold" style={{ color: "#b0ff00" }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-sm transition-colors duration-100"
                style={{
                  background: tab === t ? "rgba(176,255,0,0.08)" : "transparent",
                  color: tab === t ? "#b0ff00" : "rgba(255,255,255,0.45)",
                  fontWeight: tab === t ? 600 : 400,
                }}
              >
                <span className="text-base">{TAB_ICONS[t]}</span>
                {t}
              </button>
            ))}
          </nav>

          <div className="px-3 pb-6 mt-4">
            <button
              onClick={() => signOut().then(() => router.replace("/crm/login"))}
              className="w-full px-3 py-2 text-xs rounded-sm transition-colors text-left"
              style={{ color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-10 lg:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-w-0 overflow-auto px-6 py-8 lg:px-8">
          {tab === "Leads" && <LeadsTab />}
          {tab === "Enquiries" && <EnquiriesTab />}
          {tab === "Clients" && <ClientsTab />}
          {tab === "Orders" && <OrdersTab />}
          {tab === "Checklist" && <ChecklistTab />}
          {tab === "Admin" && <AdminContent />}
        </main>
      </div>

      {showTop && (
        <button
          onClick={goTop}
          title="Back to top"
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-opacity hover:opacity-80"
          style={{ background: "#b0ff00", color: "#080808", border: "none" }}
        >
          ↑
        </button>
      )}
    </div>
  );
}

function AdminContent() {
  return (
    <div className="max-w-4xl">
      <QueuedEmails />
      <PostcodeSweep />
    </div>
  );
}

// Emails queued to send at 7am (Firestore scheduled_emails, not yet sent).
// Lets you see exactly what will go out — and cancel any before they fire.
function QueuedEmails() {
  const [rows, setRows] = useState<{ id: string; email: string; trade: string; createdAt?: { seconds: number } }[]>([]);
  useEffect(() => {
    const q = query(collection(db, "scheduled_emails"), where("sent", "==", false));
    const unsub = onSnapshot(q, (s) => {
      const list = s.docs.map((d) => ({ id: d.id, ...(d.data() as { email: string; trade: string; createdAt?: { seconds: number } }) }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRows(list);
    });
    return () => unsub();
  }, []);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this queued email? It won't be sent.")) return;
    try { await deleteDoc(doc(db, "scheduled_emails", id)); } catch { /* ignore */ }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-white">
          Queued for 7am{rows.length > 0 ? ` · ${rows.length}` : ""}
        </h3>
      </div>
      {rows.length === 0 ? (
        <div className="text-sm px-3 py-4 rounded-sm" style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
          Nothing queued. Hit ✉ Email on a business to line one up.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{r.email}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.trade}</div>
              </div>
              <button
                onClick={() => cancel(r.id)}
                className="text-xs px-2.5 py-1 rounded-sm shrink-0 ml-3 transition-colors"
                style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Postcode tracker — tick off districts as you clear them (saved locally).
function PostcodeSweep() {
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    try { const raw = localStorage.getItem("kojoPostcodesDone"); if (raw) setDone(new Set(JSON.parse(raw))); } catch { /* ignore */ }
  }, []);
  const persist = (s: Set<string>) => { try { localStorage.setItem("kojoPostcodesDone", JSON.stringify([...s])); } catch { /* ignore */ } };
  const toggle = (d: string) => setDone((prev) => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); persist(n); return n; });

  const areas = UK_POSTCODES;

  return (
    <div>
      <h3 className="text-base font-semibold text-white mb-3">Postcodes</h3>
      <div className="flex flex-col gap-1">
        {areas.map((a) => {
          const cleared = a.districts.filter((d) => done.has(d)).length;
          const total = a.districts.length;
          const isOpen = openArea === a.area;
          const allDone = cleared === total;
          return (
            <div key={a.area} className="rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setOpenArea(isOpen ? null : a.area)}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
              >
                <span className="text-sm" style={{ color: allDone ? "rgba(255,255,255,0.35)" : "#fff" }}>
                  <span className="font-semibold">{a.area}</span> · {a.name}
                </span>
                <span className="text-xs" style={{ color: allDone ? "#48c78e" : "rgba(255,255,255,0.4)" }}>
                  {cleared}/{total}{allDone ? " ✓" : ""}
                </span>
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {a.districts.map((d) => {
                    const on = done.has(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggle(d)}
                        className="text-xs px-2 py-1 rounded-sm transition-colors"
                        style={{
                          background: on ? "rgba(72,199,142,0.12)" : "rgba(255,255,255,0.04)",
                          border: on ? "1px solid rgba(72,199,142,0.3)" : "1px solid rgba(255,255,255,0.1)",
                          color: on ? "#48c78e" : "rgba(255,255,255,0.65)",
                          textDecoration: on ? "line-through" : "none",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
