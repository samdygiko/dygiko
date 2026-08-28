"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DygikoLogo from "@/components/DygikoLogo";
import LeadsTab from "@/components/crm/LeadsTab";
import ClientsTab from "@/components/crm/ClientsTab";
import OrdersTab from "@/components/crm/OrdersTab";
import ChecklistTab from "@/components/crm/ChecklistTab";
import AreasTab from "@/components/crm/AreasTab";
import UsersTab from "@/components/crm/UsersTab";
import { useCrmUser } from "@/lib/useCrmUser";

const TABS = ["Leads", "Clients", "Orders", "Checklist", "Areas", "Users", "Admin"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Leads: "◎",
  Clients: "◈",
  Orders: "🧾",
  Checklist: "✓",
  Areas: "🗺",
  Users: "👥",
  Admin: "⚙",
};

// Tabs only admins see.
const ADMIN_ONLY: Tab[] = ["Users", "Admin"];

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageInner />
    </Suspense>
  );
}

function CRMPageInner() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useCrmUser();

  // The call-tracker extension identifies the caller from here, so a lead
  // claimed on Google Maps is stamped with the same name as in the CRM.
  const me = useCrmUser();
  useEffect(() => {
    const el = document.documentElement;
    if (me.name) {
      el.dataset.crmUser = me.name;
      // The uid too, so a lead captured on Maps is owned by the same account
      // the CRM knows — not just tagged with a display name.
      if (me.uid) el.dataset.crmUid = me.uid;
      el.dataset.crmBrand = "dygiko";
    } else {
      delete el.dataset.crmUser;
      delete el.dataset.crmUid;
    }
  }, [me.name, me.uid]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams?.get("tab");
    return (TABS as readonly string[]).includes(t || "") ? (t as Tab) : "Clients";
  });
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
    const u3 = onSnapshot(collection(db, "clients"), (s) => setClientsCount(s.size));
    return () => { u3(); };
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
            {TABS.filter((t) => isAdmin || !ADMIN_ONLY.includes(t)).map((t) => (
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
          {tab === "Clients" && <ClientsTab />}
          {tab === "Orders" && <OrdersTab />}
          {tab === "Checklist" && <ChecklistTab />}
          {tab === "Areas" && <AreasTab />}
          {tab === "Users" && isAdmin && <UsersTab />}
          {tab === "Admin" && isAdmin && <AdminContent />}
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
      <InvoiceGenerator />
      <CustomPriceLink />
      <DemoLinks />
    </div>
  );
}

// Simple invoice generator — fill in who you're invoicing, the reason and the
// amount, and it opens a clean printable invoice (Save as PDF from the print
// dialog). Payment details are fixed to Eden's account.
// TODO: confirm Dygiko's bank details before invoicing a client.
const PAY = { name: "Sam Sako", sort: "00-00-00", account: "00000000" };

function InvoiceGenerator() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const defaultNo = `INV-${iso.replace(/-/g, "")}`;

  const [company, setCompany] = useState("");
  const [companyNo, setCompanyNo] = useState("");
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [invNo, setInvNo] = useState(defaultNo);
  const [date, setDate] = useState(iso);

  const amt = Number(amount);
  const valid = company.trim() !== "" && reason.trim() !== "" && Number.isFinite(amt) && amt > 0;

  const money = (n: number) =>
    "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prettyDate = (isoStr: string) => {
    const d = new Date(isoStr + "T00:00:00");
    return isNaN(d.getTime())
      ? isoStr
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };

  const generate = () => {
    if (!valid) return;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const addressHtml = esc(address.trim()).replace(/\n/g, "<br>");
    const reasonHtml = esc(reason.trim()).replace(/\n/g, "<br>");

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(invNo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 48px; font-size: 14px; line-height: 1.5; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0b1b3b; padding-bottom: 20px; }
  .brand { font-size: 22px; font-weight: bold; color: #0b1b3b; }
  .brand small { display: block; font-size: 12px; font-weight: normal; color: #6b7280; margin-top: 3px; }
  h1 { font-size: 26px; letter-spacing: 2px; color: #0b1b3b; margin: 0; text-transform: uppercase; }
  .meta { text-align: right; font-size: 13px; color: #4b5563; margin-top: 6px; }
  .meta b { color: #1a1a1a; }
  .parties { display: flex; justify-content: space-between; gap: 40px; margin: 34px 0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; border-bottom: 1px solid #e5e7eb; padding: 0 0 8px; }
  th.r, td.r { text-align: right; }
  td { padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .total-row td { border: none; padding-top: 18px; font-size: 18px; font-weight: bold; color: #0b1b3b; }
  .pay { margin-top: 40px; background: #f6f8fc; border: 1px solid #e5e9f2; border-radius: 6px; padding: 18px 22px; }
  .pay .label { color: #0b1b3b; }
  .pay-grid { display: flex; gap: 40px; }
  .pay-grid div span { display: block; font-size: 11px; color: #9ca3af; }
  .pay-grid div b { font-size: 15px; }
  .foot { margin-top: 34px; font-size: 12px; color: #9ca3af; text-align: center; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #b0ff00; color: #fff; border: none; border-radius: 6px; padding: 10px 18px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  @media print { body { padding: 0; } .wrap { max-width: none; } .print-btn { display: none; } }
</style></head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="wrap">
  <div class="top">
    <div>
      <div class="brand">Dygiko<small>Custom websites &amp; operations systems</small></div>
    </div>
    <div>
      <h1>Invoice</h1>
      <div class="meta">
        <div><b>${esc(invNo)}</b></div>
        <div>Date: ${esc(prettyDate(date))}</div>
      </div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="label">From</div>
      <div><b>${esc(PAY.name)}</b><br>Dygiko<br>dygiko.com<br>info@dygiko.com</div>
    </div>
    <div style="text-align:right">
      <div class="label">Bill to</div>
      <div><b>${esc(company.trim())}</b>${companyNo.trim() ? "<br>Company no. " + esc(companyNo.trim()) : ""}${addressHtml ? "<br>" + addressHtml : ""}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
    <tbody>
      <tr><td>${reasonHtml}</td><td class="r">${money(amt)}</td></tr>
      <tr class="total-row"><td class="r">Total due</td><td class="r">${money(amt)}</td></tr>
    </tbody>
  </table>

  <div class="pay">
    <div class="label">Payment details</div>
    <div class="pay-grid">
      <div><span>Account name</span><b>${esc(PAY.name)}</b></div>
      <div><span>Sort code</span><b>${esc(PAY.sort)}</b></div>
      <div><span>Account number</span><b>${esc(PAY.account)}</b></div>
    </div>
  </div>

  <div class="foot">Thank you for your business.</div>
</div>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) { alert("Please allow pop-ups to generate the invoice."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const inputSt = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };
  const lbl = "block text-xs mb-1.5";
  const lblSt = { color: "rgba(255,255,255,0.4)" };

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-white mb-1">Invoice generator</h3>
      <p className="text-xs mb-4" style={lblSt}>
        Fill in the details and generate a printable invoice — use &ldquo;Save as PDF&rdquo; in the print dialog.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={lbl} style={lblSt}>Invoice to (company)</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Ltd"
            className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
        </div>
        <div>
          <label className={lbl} style={lblSt}>Amount (£)</label>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="600"
            className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
        </div>
      </div>

      <div className="mb-3">
        <label className={lbl} style={lblSt}>Company number</label>
        <input value={companyNo} onChange={(e) => setCompanyNo(e.target.value)} placeholder="12345678"
          className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
      </div>

      <div className="mb-3">
        <label className={lbl} style={lblSt}>Registered address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder={"123 High Street\nLondon\nSW1A 1AA"}
          className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-y" style={inputSt} />
      </div>

      <div className="mb-3">
        <label className={lbl} style={lblSt}>Reason for invoice</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Website design & build — annual subscription"
          className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-y" style={inputSt} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className={lbl} style={lblSt}>Invoice number</label>
          <input value={invNo} onChange={(e) => setInvNo(e.target.value)}
            className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
        </div>
        <div>
          <label className={lbl} style={lblSt}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-sm px-3 py-2 text-sm outline-none" style={inputSt} />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!valid}
        className="px-4 py-2 rounded-sm text-sm font-semibold transition-opacity"
        style={{ background: valid ? "#b0ff00" : "rgba(255,255,255,0.08)", color: valid ? "#080808" : "rgba(255,255,255,0.3)", cursor: valid ? "pointer" : "not-allowed" }}
      >
        Generate invoice
      </button>
    </div>
  );
}

// Generate a checkout link at a bespoke price — for deals negotiated
// door-to-door. The link is /checkout?pkg=<key>&price=<amount> (annual sub),
// &quarterly=<amount> (every 3 months), &monthly=<amount> (every month) or
// &oneoff=<amount> (single payment); checkout shows that price and charges it.
function CustomPriceLink() {
  const PKGS = [
    { key: "site", label: "Website" },
    { key: "crm", label: "CRM" },
    { key: "bundle", label: "Website + CRM" },
  ] as const;
  const [pkg, setPkg] = useState<(typeof PKGS)[number]["key"]>("crm");
  const [mode, setMode] = useState<"oneoff" | "year" | "quarter" | "month">("oneoff");
  const [price, setPrice] = useState("500");
  const [copied, setCopied] = useState(false);

  const amount = Math.round(Number(price));
  const max = 100000;
  const valid = Number.isFinite(amount) && amount >= 10 && amount <= max;
  const param =
    mode === "year" ? "price"
    : mode === "quarter" ? "quarterly"
    : mode === "month" ? "monthly"
    : "oneoff";
  const url = valid ? `https://www.dygiko.com/checkout?pkg=${pkg}&${param}=${amount}` : "";

  const copy = async () => {
    if (!url) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); ok = true; }
    } catch { /* fall through */ }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = url; ta.style.cssText = "position:fixed;top:-1000px;opacity:0;";
        document.body.appendChild(ta); ta.focus(); ta.select();
        ok = document.execCommand("copy"); ta.remove();
      } catch { /* ignore */ }
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  const inputSt = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-white mb-1">Custom price link</h3>
      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
        Set a bespoke price for a deal — one-off, monthly, quarterly or annual — and generate a checkout link.
      </p>

      {/* One-off / Quarterly / Annual toggle */}
      <div className="inline-flex gap-1 p-1 rounded-sm mb-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["oneoff", "month", "quarter", "year"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors"
            style={{
              background: mode === m ? "#b0ff00" : "transparent",
              color: mode === m ? "#080808" : "rgba(255,255,255,0.5)",
            }}
          >
            {m === "oneoff" ? "One-off" : m === "month" ? "Monthly" : m === "quarter" ? "Quarterly" : "Annual"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Package</label>
          <select
            value={pkg}
            onChange={(e) => setPkg(e.target.value as typeof pkg)}
            className="rounded-sm px-3 py-2 text-sm outline-none"
            style={inputSt}
          >
            {PKGS.map((p) => (
              <option key={p.key} value={p.key} style={{ background: "#121212" }}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {mode === "year" ? "£ / year" : mode === "quarter" ? "£ / quarter" : mode === "month" ? "£ / month" : "£ one-off"}
          </label>
          <input
            type="number"
            min={10}
            max={max}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-sm px-3 py-2 text-sm outline-none w-28"
            style={inputSt}
          />
        </div>
      </div>
      {valid && mode === "quarter" ? (
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          Billed every 3 months — £{(amount * 4).toLocaleString()}/yr, about £{Math.round((amount * 4) / 12)}/mo.
        </p>
      ) : null}
      {valid && mode === "month" ? (
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          Billed every month — £{(amount * 12).toLocaleString()}/yr, £{(amount * 3).toLocaleString()}/qtr.
        </p>
      ) : null}
      {valid ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{url}</span>
          <button
            onClick={copy}
            className="text-xs px-2.5 py-1 rounded-sm shrink-0 transition-colors"
            style={{
              color: copied ? "#48c78e" : "rgba(255,255,255,0.5)",
              border: `1px solid ${copied ? "rgba(72,199,142,0.4)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "#fbbf24" }}>Enter a price between £10 and £{max.toLocaleString()}.</p>
      )}
    </div>
  );
}

// Every live demo, one tap away — for pulling up on the spot when selling
// shop to shop. `phrase` is how the message names their business.
const DEMOS = [
  { trade: "Barber", url: "https://blendsmith-crm.vercel.app", icon: "💈", phrase: "barbershop" },
  { trade: "Hair salon", url: "https://lumiere-crm-two.vercel.app", icon: "❀", phrase: "hair salon" },
  { trade: "Beauty salon", url: "https://velora-crm-beta.vercel.app", icon: "✦", phrase: "beauty salon" },
  { trade: "Tailor", url: "https://ashcroft-crm.vercel.app", icon: "🧵", phrase: "tailoring business" },
  { trade: "Recording studio", url: "https://basswood-crm.vercel.app", icon: "🎙️", phrase: "recording studio" },
  { trade: "Architect", url: "https://halden-crm.vercel.app", icon: "📐", phrase: "architecture practice" },
  { trade: "Hotel", url: "https://ellison-crm.vercel.app", icon: "🛎️", phrase: "hotel" },
  { trade: "Pet store", url: "https://barkwell-crm.vercel.app", icon: "🐾", phrase: "pet store" },
  { trade: "Pub", url: "https://oakwell-crm.vercel.app", icon: "🍺", phrase: "pub" },
  { trade: "Restaurant", url: "https://sorrel-crm.vercel.app", icon: "🍽️", phrase: "restaurant" },
  { trade: "Café", url: "https://fernwood-crm.vercel.app", icon: "☕", phrase: "café" },
  { trade: "Internet café", url: "https://pixelpoint-crm.vercel.app", icon: "🖥", phrase: "internet café" },
  { trade: "Electrician", url: "https://voltix-crm.vercel.app", icon: "⚡", phrase: "electrical business" },
  { trade: "Construction", url: "https://marsden-crm.vercel.app", icon: "🏗", phrase: "construction business" },
  { trade: "Dental", url: "https://brightwater-crm.vercel.app", icon: "🦷", phrase: "dental practice" },
  { trade: "Phone repair", url: "https://fonefix-crm.vercel.app", icon: "🔧", phrase: "phone repair shop" },
];

// Demo marketing WEBSITES (the "Website" product) — grows as each is built.
const DEMO_SITES = [
  { trade: "Barber", url: "https://blendsmith-web.vercel.app", icon: "💈", phrase: "barbershop" },
  { trade: "Hair salon", url: "https://lumiere-web-theta.vercel.app", icon: "❀", phrase: "hair salon" },
  { trade: "Beauty salon", url: "https://velora-web-self.vercel.app", icon: "✦", phrase: "beauty salon" },
  { trade: "Tailor", url: "https://ashcroft-web.vercel.app", icon: "🧵", phrase: "tailoring business" },
  { trade: "Recording studio", url: "https://basswood-web.vercel.app", icon: "🎙️", phrase: "recording studio" },
  { trade: "Architect", url: "https://halden-web.vercel.app", icon: "📐", phrase: "architecture practice" },
  { trade: "Hotel", url: "https://ellison-web.vercel.app", icon: "🛎️", phrase: "hotel" },
  { trade: "Pet store", url: "https://barkwell-web.vercel.app", icon: "🐾", phrase: "pet store" },
  { trade: "Pub", url: "https://oakwell-web.vercel.app", icon: "🍺", phrase: "pub" },
  { trade: "Restaurant", url: "https://sorrel-web-lac.vercel.app", icon: "🍽️", phrase: "restaurant" },
  { trade: "Café", url: "https://fernwood-web.vercel.app", icon: "☕", phrase: "café" },
  { trade: "Internet café", url: "https://pixelpoint-web.vercel.app", icon: "🖥", phrase: "internet café" },
  { trade: "Electrician", url: "https://voltix-web-mocha.vercel.app", icon: "⚡", phrase: "electrical business" },
  { trade: "Construction", url: "https://marsden-web.vercel.app", icon: "🏗", phrase: "construction business" },
  { trade: "Dental", url: "https://brightwater-web.vercel.app", icon: "🦷", phrase: "dental practice" },
  { trade: "Phone repair", url: "https://fonefix-web.vercel.app", icon: "🔧", phrase: "phone repair shop" },
];

function DemoLinks() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (url: string) => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); ok = true; }
    } catch { /* fall through to legacy copy */ }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;top:-1000px;left:0;opacity:0;";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch { /* ignore */ }
    }
    if (ok) { setCopied(url); setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500); }
  };
  const Row = ({ d }: { d: { trade: string; url: string; icon: string } }) => (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
        <span style={{ fontSize: 18 }}>{d.icon}</span>
        <div className="min-w-0">
          <div className="text-sm text-white">{d.trade}</div>
          <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{d.url.replace("https://", "")}</div>
        </div>
      </a>
      <button
        onClick={() => copy(d.url)}
        className="text-xs px-2.5 py-1 rounded-sm shrink-0 transition-colors"
        style={{
          color: copied === d.url ? "#48c78e" : "rgba(255,255,255,0.5)",
          border: `1px solid ${copied === d.url ? "rgba(72,199,142,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}
        title="Copy link"
      >
        {copied === d.url ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );

  return (
    <div className="mb-8 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Demo sites</h3>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Marketing websites — for selling the Website product.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_SITES.map((d) => <Row key={d.trade} d={d} />)}
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Demo CRMs</h3>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Operations systems — for selling the OMS product.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMOS.map((d) => <Row key={d.trade} d={d} />)}
        </div>
      </div>
    </div>
  );
}
