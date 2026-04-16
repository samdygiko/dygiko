"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DygikoLogo from "@/components/DygikoLogo";
import BusinessFinderTab from "@/components/crm/BusinessFinderTab";
import CRMTab from "@/components/crm/CRMTab";
import LeadsTab from "@/components/crm/LeadsTab";

const TABS = ["Business Finder", "CRM", "Leads", "Admin", "Design"] as const;
type Tab = (typeof TABS)[number];

const PAYMENT_LINKS = [
  { label: "Basic Website", price: "£500", url: "https://buy.stripe.com/4gMcN5aQg1wXdJq20SfjG00" },
  { label: "Growth Website", price: "£750", url: "https://buy.stripe.com/fZueVdbUk2B16gYaxofjG01" },
  { label: "Full Business Package", price: "£1,500", url: "https://buy.stripe.com/bJebJ19McdfFdJq0WOfjG02" },
];

const QUICK_LINKS = [
  { label: "Firebase Console", url: "https://console.firebase.google.com/project/sako-digital" },
  { label: "IONOS", url: "https://my.ionos.co.uk" },
  { label: "Stripe Dashboard", url: "https://dashboard.stripe.com" },
  { label: "Zoho Mail", url: "https://mail.zoho.eu" },
  { label: "Trustpilot Business", url: "https://businessapp.b2b.trustpilot.com" },
  { label: "Leave a Trustpilot Review ↗", url: "https://au.trustpilot.com/review/dygiko.com" },
  { label: "Google Search Console", url: "https://search.google.com/search-console" },
  { label: "Companies House Dev Hub", url: "https://developer.company-information.service.gov.uk" },
  { label: "Google Custom Search", url: "https://programmablesearchengine.google.com" },
];

const DESIGN_SITES = [
  { name: "Site Inspire", url: "https://www.siteinspire.com/", description: "Curated web design gallery" },
  { name: "Awwwards — Hotels & Restaurants", url: "https://www.awwwards.com/websites/hotel-restaurant/", description: "Award-winning hospitality sites" },
  { name: "Godly — SaaS", url: "https://godly.website/?types=%5B%22saas%22%5D", description: "Curated SaaS UI inspiration" },
  { name: "Saaspo", url: "https://saaspo.com", description: "SaaS website design inspiration" },
  { name: "Hayford Group", url: "https://hayfordgroup.com", description: "Live client site" },
];

const TAB_ICONS: Record<Tab, string> = {
  "Business Finder": "🔍",
  CRM: "☎",
  Leads: "◎",
  Admin: "⚙",
  Design: "✦",
};

export default function CRMPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Business Finder");
  const [callCount, setCallCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/crm/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, "callList"), (s) => setCallCount(s.size));
    const u2 = onSnapshot(collection(db, "leads"), (s) => {
      const docs = s.docs.map((d) => d.data());
      setLeadsCount(docs.length);
      setClosedCount(docs.filter((d) => d.stage === "Closed").length);
    });
    return () => { u1(); u2(); };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const convRate = leadsCount > 0 ? ((closedCount / leadsCount) * 100).toFixed(1) : "0.0";

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
              { label: "CRM list", value: callCount },
              { label: "Leads", value: leadsCount },
              { label: "Conversion", value: `${convRate}%` },
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
                {t === "Design" ? "Design Inspiration" : t === "Business Finder" ? "Business Finder" : t}
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
          {/* BusinessFinderTab is always mounted so searches persist across tab navigation */}
          <div style={{ display: tab === "Business Finder" ? "block" : "none" }}>
            <BusinessFinderTab />
          </div>
          {tab === "CRM" && <CRMTab />}
          {tab === "Leads" && <LeadsTab />}
          {tab === "Admin" && <AdminContent />}
          {tab === "Design" && <DesignContent />}
        </main>
      </div>
    </div>
  );
}

const TC_URL = "/terms-and-conditions.pdf";

const QUOTE_TEMPLATES = [
  {
    key: "quote-basic",
    label: "01 — Basic",
    name: "Basic Website",
    price: "£500",
    recur: "+ £29/month",
    stripeUrl: "https://buy.stripe.com/4gMcN5aQg1wXdJq20SfjG00",
    includes: [
      "Custom website design",
      "Domain registration & hosting setup",
      "Mobile-responsive build",
      "Basic on-page SEO",
      "Live within 2 business days",
      "Monthly hosting & support (£29/mo)",
    ],
  },
  {
    key: "quote-growth",
    label: "02 — Growth",
    name: "Growth Website",
    price: "£750",
    recur: "+ £29/month",
    stripeUrl: "https://buy.stripe.com/fZueVdbUk2B16gYaxofjG01",
    includes: [
      "Everything in Basic",
      "Advanced SEO configuration",
      "Blog setup with 3 starter posts",
      "Contact form integration",
      "Professional company email address",
      "Live within 2 business days",
      "Monthly hosting & support (£29/mo)",
    ],
  },
  {
    key: "quote-full-business",
    label: "03 — Full Business",
    name: "Full Business Package",
    price: "£1,500",
    recur: "+ £29/month",
    stripeUrl: "https://buy.stripe.com/bJebJ19McdfFdJq0WOfjG02",
    includes: [
      "Everything in Growth",
      "Google Business Profile setup & optimisation",
      "Custom CRM system",
      "WhatsApp & click-to-call button integration",
      "Live within 2 business days",
      "Monthly hosting & support (£29/mo)",
    ],
  },
];

function buildEmailHtml(pkg: typeof QUOTE_TEMPLATES[0], firstName: string, businessName: string) {
  const name = firstName || "[First name]";
  const biz = businessName || "[Business name]";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
.wrapper{max-width:600px;margin:0 auto;background:#0D0D0D;}
.top-bar{background:#CCFF00;height:4px;}
.header{padding:28px 36px 22px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:8px;}
.logo-text{font-size:17px;font-weight:700;color:#CCFF00;letter-spacing:-0.02em;}
.body{padding:32px 36px;}
.greeting{font-size:14px;color:rgba(255,255,255,0.55);margin-bottom:18px;}
.intro{font-size:14px;color:#C8C8C8;line-height:1.7;margin-bottom:22px;}
.card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:6px;padding:22px 26px;margin-bottom:24px;}
.pkg-label{font-size:10px;font-weight:600;color:rgba(255,255,255,0.38);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:5px;}
.pkg-name{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:4px;}
.pkg-price{font-size:26px;font-weight:700;color:#CCFF00;letter-spacing:-0.02em;}
.pkg-recur{font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:18px;}
hr{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:14px 0;}
.inc-title{font-size:10px;font-weight:600;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;}
.inc-item{font-size:13px;color:#B8B8B8;padding:3px 0 3px 18px;position:relative;line-height:1.5;}
.inc-item::before{content:"✓";position:absolute;left:0;color:#CCFF00;font-weight:700;font-size:12px;}
.cta{text-align:center;margin-bottom:24px;}
.cta a{display:inline-block;background:#CCFF00;color:#080808;font-size:13px;font-weight:700;padding:13px 34px;border-radius:4px;text-decoration:none;}
.cta-note{font-size:11px;color:rgba(255,255,255,0.28);margin-top:9px;}
.tc-box{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:14px 18px;margin-bottom:24px;}
.tc-box p{font-size:11px;color:rgba(255,255,255,0.38);line-height:1.6;}
.tc-box a{color:#CCFF00;text-decoration:none;}
.signoff{font-size:13px;color:#C8C8C8;line-height:1.8;margin-bottom:6px;}
.sig-name{font-size:13px;font-weight:600;color:#fff;}
.sig-role{font-size:12px;color:rgba(255,255,255,0.38);}
.footer{padding:18px 36px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;}
.footer-brand{font-size:12px;font-weight:700;color:#CCFF00;}
.footer-info{font-size:10px;color:rgba(255,255,255,0.28);}
</style>
</head>
<body>
<div class="wrapper">
  <div class="top-bar"></div>
  <div class="header">
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" fill="#CCFF00"/><rect x="18" y="2" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/><rect x="2" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/><rect x="18" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.3"/></svg>
    <span class="logo-text">dygiko</span>
  </div>
  <div class="body">
    <p class="greeting">Hi ${name},</p>
    <p class="intro">It was great speaking with you! Here's your personalised quote for <strong style="color:#fff">${biz}</strong>. Everything you need to get your business online — live within 2 days of payment.</p>
    <div class="card">
      <div class="pkg-label">${pkg.label}</div>
      <div class="pkg-name">${pkg.name}</div>
      <div class="pkg-price">${pkg.price}</div>
      <div class="pkg-recur">${pkg.recur}</div>
      <hr/>
      <div class="inc-title">What's included</div>
      ${pkg.includes.map(i => `<div class="inc-item">${i}</div>`).join("")}
    </div>
    <div class="cta">
      <a href="${pkg.stripeUrl}" target="_blank" rel="noopener noreferrer">Pay securely →</a>
      <p class="cta-note">Secure payment via Stripe · Work starts immediately on receipt</p>
    </div>
    <div class="tc-box">
      <p>By proceeding with payment you agree to our <a href="${TC_URL}">Terms &amp; Conditions of Service</a>. You can download and review the full document before paying. Monthly retainer covers hosting, security updates, and ongoing support — cancel anytime with 30 days' notice.</p>
    </div>
    <p class="signoff">Any questions at all, just reply to this email or give me a call.<br/>Looking forward to building something great for ${biz}!</p>
  </div>
  <div class="footer">
    <span class="footer-brand">dygiko</span>
    <span class="footer-info">dygiko.com · sam@dygiko.com</span>
  </div>
</div>
</body></html>`;
}

function QuoteEmailModal({ pkg, onClose }: { pkg: typeof QUOTE_TEMPLATES[0]; onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [copiedStripe, setCopiedStripe] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const subject = `Your Dygiko quote — ${pkg.name} for ${businessName || "[Business name]"}`;
  const html = buildEmailHtml(pkg, firstName, businessName);

  // Fix #2: write HTML directly to iframe document so it updates live without remounting
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  // Fix #1: plain-text version of the email for copying
  function buildPlainText() {
    const name = firstName || "[First name]";
    const biz = businessName || "[Business name]";
    return `Subject: ${subject}

Hi ${name},

It was great speaking with you! Here's your personalised quote for ${biz}. Everything you need to get your business online — live within 2 days of payment.

PACKAGE: ${pkg.name}
PRICE: ${pkg.price} ${pkg.recur}

What's included:
${pkg.includes.map(i => `✓ ${i}`).join("\n")}

PAY SECURELY:
${pkg.stripeUrl}

TERMS & CONDITIONS:
${window.location.origin}${TC_URL}

By proceeding with payment you agree to our Terms & Conditions of Service. Monthly retainer covers hosting, security updates, and ongoing support — cancel anytime with 30 days' notice.

Any questions, just reply to this email or give me a call.
Looking forward to building something great for ${biz}!`;
  }

  const inputSt: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "2px",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  };

  const labelSt: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.35)",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.8)" }} onClick={onClose}>
      <div
        className="ml-auto flex h-full"
        style={{ width: "min(92vw, 1040px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: controls */}
        <div
          className="flex flex-col overflow-y-auto shrink-0"
          style={{ width: "300px", background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.09)", padding: "24px 20px" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>Quote Email</p>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{pkg.name}</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#b0ff00", letterSpacing: "-0.02em" }}>{pkg.price}</p>
            </div>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)", fontSize: "18px", lineHeight: 1 }}>✕</button>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label style={labelSt}>First name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. James" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Business name</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Sunrise Plumbing" style={inputSt} />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
              <label style={labelSt}>Subject line</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, flex: 1 }}>{subject}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(subject); setCopiedSubject(true); setTimeout(() => setCopiedSubject(false), 2000); }}
                  style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "2px", background: copiedSubject ? "rgba(176,255,0,0.15)" : "rgba(255,255,255,0.07)", color: copiedSubject ? "#b0ff00" : "rgba(255,255,255,0.55)", border: `1px solid ${copiedSubject ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  {copiedSubject ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
              <label style={labelSt}>Stripe payment link</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", flex: 1, wordBreak: "break-all" }}>{pkg.stripeUrl}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(pkg.stripeUrl); setCopiedStripe(true); setTimeout(() => setCopiedStripe(false), 2000); }}
                  style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "2px", background: copiedStripe ? "rgba(176,255,0,0.15)" : "rgba(255,255,255,0.07)", color: copiedStripe ? "#b0ff00" : "rgba(255,255,255,0.55)", border: `1px solid ${copiedStripe ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {copiedStripe ? "✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
              <label style={labelSt}>T&amp;Cs PDF</label>
              <a href={TC_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#b0ff00", textDecoration: "none" }}>
                View / download ↗
              </a>
            </div>
          </div>

          {/* Fix #1: Copy full email button */}
          <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "20px" }}>
            <button
              onClick={() => { navigator.clipboard.writeText(buildPlainText()); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2500); }}
              style={{ width: "100%", background: copiedEmail ? "rgba(176,255,0,0.15)" : "#b0ff00", color: copiedEmail ? "#b0ff00" : "#080808", fontWeight: 700, fontSize: "13px", padding: "12px", borderRadius: "4px", border: copiedEmail ? "1px solid rgba(176,255,0,0.3)" : "none", cursor: "pointer", transition: "all 0.15s" }}
            >
              {copiedEmail ? "✓ Copied!" : "Copy full email"}
            </button>
          </div>
        </div>

        {/* Right: email preview — Fix #2 + #3 */}
        <div style={{ flex: 1, background: "#1a1a1a", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Email Preview</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>— updates live as you type</span>
          </div>
          <iframe
            ref={iframeRef}
            style={{ flex: 1, border: "none", width: "100%" }}
            title="Email preview"
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        </div>
      </div>
    </div>
  );
}

function AdminContent() {
  const [clientName, setClientName] = useState("");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [openQuotePkg, setOpenQuotePkg] = useState<typeof QUOTE_TEMPLATES[0] | null>(null);

  const SUBJECT = "Welcome to Dygiko — Let's get started!";
  const bodyWithName = `Hi ${clientName || "[Name]"},\n\nAmazing — really excited to be working with you! Here's what happens next:\n\nWe'll build your website within 2 days and send you a preview link to review. Once you're happy we go live.\n\nIf you need anything in the meantime just reply here or call 07723396306.\n\nWelcome aboard!`;

  function copySubject() {
    navigator.clipboard.writeText(SUBJECT);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  }

  function copyBody() {
    navigator.clipboard.writeText(bodyWithName);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  }

  return (
    <div className="flex flex-col gap-14 max-w-4xl">
      {openQuotePkg && <QuoteEmailModal pkg={openQuotePkg} onClose={() => setOpenQuotePkg(null)} />}

      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Admin</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
          Payment links and dashboards.
        </p>

        <h3 className="text-base font-semibold text-white mb-4">Payment Links</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {PAYMENT_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 px-6 py-4 rounded-sm transition-opacity hover:opacity-80"
              style={{ background: "#b0ff00", textDecoration: "none", flex: "1 1 0" }}
            >
              <span className="text-xs font-medium" style={{ color: "rgba(0,0,0,0.55)" }}>{item.label}</span>
              <span className="text-xl font-black text-black">{item.price}</span>
              <span className="text-xs font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>Open Stripe checkout ↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quote Email Templates */}
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Quote Email Templates</h3>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Fill in client details, preview the email, then send via Resend — or copy the Stripe link to send manually.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {QUOTE_TEMPLATES.map((pkg) => (
            <button
              key={pkg.key}
              onClick={() => setOpenQuotePkg(pkg)}
              className="flex flex-col gap-2 px-5 py-5 rounded-sm text-left transition-all duration-150 hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", flex: "1 1 0" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(176,255,0,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
            >
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{pkg.label}</span>
              <span className="text-base font-bold text-white">{pkg.name}</span>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#b0ff00", letterSpacing: "-0.02em" }}>{pkg.price}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{pkg.recur}</span>
              <span className="mt-1 text-xs font-semibold" style={{ color: "#b0ff00" }}>Open template →</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-4 rounded-sm transition-all duration-150"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <span className="text-sm font-medium text-white">{item.label}</span>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Payment Received Email */}
      <div>
        <h3 className="text-base font-semibold text-white mb-4">Payment Received Email</h3>
        <div
          className="rounded-sm p-5 flex flex-col gap-5"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
        >
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Client name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. James"
              className="w-full rounded-sm px-3 py-2.5 text-sm outline-none max-w-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            />
          </div>
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Subject</p>
            <div className="flex items-center gap-3">
              <p className="text-sm text-white flex-1">{SUBJECT}</p>
              <button
                onClick={copySubject}
                className="text-xs px-3 py-1.5 rounded-sm font-medium transition-all shrink-0"
                style={{
                  background: copiedSubject ? "rgba(176,255,0,0.15)" : "rgba(255,255,255,0.07)",
                  color: copiedSubject ? "#b0ff00" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${copiedSubject ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {copiedSubject ? "✓ Copied!" : "Copy subject"}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Body</p>
            <div
              className="rounded-sm p-4 text-sm whitespace-pre-wrap mb-3"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}
            >
              {bodyWithName}
            </div>
            <button
              onClick={copyBody}
              className="text-xs px-3 py-1.5 rounded-sm font-medium transition-all"
              style={{
                background: copiedBody ? "rgba(176,255,0,0.15)" : "rgba(255,255,255,0.07)",
                color: copiedBody ? "#b0ff00" : "rgba(255,255,255,0.6)",
                border: `1px solid ${copiedBody ? "rgba(176,255,0,0.25)" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {copiedBody ? "✓ Copied!" : "Copy email body"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function DesignContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Design Inspiration</h2>
      <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
        Reference sites for UI patterns, typography, and layout ideas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DESIGN_SITES.map((site) => (
          <a
            key={site.url}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-sm overflow-hidden transition-all duration-150"
            style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(176,255,0,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          >
            {/* Screenshot preview */}
            <div className="w-full overflow-hidden" style={{ height: "160px", background: "rgba(255,255,255,0.03)" }}>
              <img
                src={`https://image.thum.io/get/width/600/crop/400/${site.url}`}
                alt={site.name}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="p-4">
              <p className="font-semibold text-white group-hover:text-[#b0ff00] transition-colors duration-150 text-sm mb-1">
                {site.name}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{site.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
