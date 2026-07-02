"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { PACKAGES, getPackage } from "@/lib/products";
import { useI18n } from "@/lib/i18n";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const ACCENT = "#2563eb";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonConfig) => { render: (el: HTMLElement) => void };
    };
  }
}

interface PayPalActions {
  subscription: {
    create: (opts: {
      plan_id: string;
      subscriber?: { name?: { given_name?: string; surname?: string }; email_address?: string };
    }) => Promise<string>;
  };
}

interface PayPalButtonConfig {
  style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number };
  createSubscription?: (data: unknown, actions: PayPalActions) => Promise<string>;
  onApprove?: (data: { subscriptionID?: string; orderID?: string }) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const pkgKey = params.get("pkg") || "site";
  const pkg = useMemo(() => getPackage(pkgKey) || PACKAGES[0], [pkgKey]);
  // Localised name / tagline / features for the selected package.
  const tp = t.packages[pkg.key];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const paypalRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [plans, setPlans] = useState<Record<string, string> | null>(null);

  // Fetch the billing-plan IDs (one per package) for the subscription.
  useEffect(() => {
    fetch("/api/paypal/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || null))
      .catch(() => setPlans(null));
  }, []);

  // Lazy-load the PayPal SDK once, in subscription mode.
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || sdkReady) return;
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=GBP&vault=true&intent=subscription&enable-funding=card`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError("Couldn't load PayPal — refresh and try again");
    document.head.appendChild(script);
  }, [sdkReady]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = !!name && emailValid && agreed;

  // Re-mount the PayPal buttons whenever the form changes so the subscription
  // closure always sees the latest customer info.
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current) return;
    const el = paypalRef.current;
    el.innerHTML = "";
    if (!formValid) return;

    const planId = plans?.[pkg.key];
    if (!planId) return; // plans not loaded yet — button re-renders once they are

    const customer = { name, email, phone, business, website, notes };
    const parts = name.trim().split(/\s+/);
    const givenName = parts[0] || name;
    const surname = parts.slice(1).join(" ") || parts[0] || name;

    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "blue", shape: "rect", label: "subscribe", height: 48 },
        createSubscription: async (_data, actions) => {
          setError(null);
          setPaying(true);
          return actions.subscription.create({
            plan_id: planId,
            subscriber: { name: { given_name: givenName, surname }, email_address: email },
          });
        },
        onApprove: async (data) => {
          try {
            const res = await fetch("/api/paypal/record-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionID: data.subscriptionID, pkg: pkg.key, customer }),
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err?.error || "Couldn't record subscription");
            }
            router.push(`/checkout/success?pkg=${pkg.key}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Subscription failed");
          } finally {
            setPaying(false);
          }
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : "PayPal error — please try again");
          setPaying(false);
        },
        onCancel: () => setPaying(false),
      })
      .render(el);
  }, [sdkReady, formValid, plans, pkg.key, name, email, phone, business, website, notes, router]);

  return (
    <>
      <Nav />
      <section style={{ paddingTop: 140, paddingBottom: 100, paddingInline: 24, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7c89a3", marginBottom: 12 }}>
            {t.checkout.secureCheckout}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 700, letterSpacing: "-1px", marginBottom: 40, color: "#0b1b3b" }}>
            {t.checkout.title}
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }} className="kb-checkout-grid">
            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <p style={labelHead}>{t.checkout.yourDetails}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="kb-fields">
                  <Field label={t.checkout.fullName} value={name} onChange={setName} required />
                  <Field label={t.checkout.email} type="email" value={email} onChange={setEmail} required />
                  <Field label={t.checkout.phone} value={phone} onChange={setPhone} placeholder="07…" />
                  <Field label={t.checkout.businessName} value={business} onChange={setBusiness} />
                  <Field label={t.checkout.currentWebsite} value={website} onChange={setWebsite} placeholder="https://…" wide />
                </div>
              </div>

              <div>
                <p style={labelHead}>{t.checkout.notesLabel}</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t.checkout.notesPlaceholder}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* T&Cs — mandatory */}
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", fontSize: 13, lineHeight: 1.6, color: "#44516b", background: "#f4f7fe", border: "1px solid #e4ebf5", borderRadius: 12, padding: 16 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: ACCENT, flexShrink: 0 }}
                />
                <span>
                  {t.checkout.agreePrefix}
                  <Link href="/terms" target="_blank" style={{ color: ACCENT, textDecoration: "underline" }}>
                    {t.checkout.termsLink}
                  </Link>
                  {t.checkout.agreeSuffix}
                </span>
              </label>
            </div>

            {/* Summary */}
            <aside className="kb-card" style={{ padding: 28, height: "fit-content" }}>
              <p style={labelHead}>{t.checkout.orderSummary}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: "#0b1b3b" }}>{tp.name}</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0b1b3b" }}>£{pkg.price}<span style={{ fontSize: 12, fontWeight: 500, color: "#7c89a3" }}>/yr</span></span>
              </div>
              <p style={{ fontSize: 13, color: "#7c89a3", marginBottom: 20 }}>{tp.tagline}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                {tp.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: "#44516b", display: "flex", gap: 8 }}>
                    <span style={{ color: ACCENT }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {/* Switch package */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {PACKAGES.map((p) => (
                  <Link
                    key={p.key}
                    href={`/checkout?pkg=${p.key}`}
                    style={{
                      fontSize: 11, padding: "6px 10px", borderRadius: 8, textDecoration: "none",
                      border: `1px solid ${p.key === pkg.key ? ACCENT : "#d6e0f0"}`,
                      background: p.key === pkg.key ? "#eff4ff" : "#ffffff",
                      color: p.key === pkg.key ? ACCENT : "#7c89a3",
                    }}
                  >
                    {t.packages[p.key].name} · £{p.price}/yr
                  </Link>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #e4ebf5", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                <span style={labelHead}>{t.checkout.total}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#0b1b3b" }}>£{pkg.price}<span style={{ fontSize: 14, fontWeight: 500, color: "#7c89a3" }}>/yr</span></span>
              </div>

              {error && <p style={{ fontSize: 13, color: "#f87171", marginBottom: 14 }}>{error}</p>}

              {!PAYPAL_CLIENT_ID && (
                <p style={{ fontSize: 12, color: "#fbbf24", marginBottom: 12 }}>
                  {t.checkout.paypalNotConfigured}
                </p>
              )}

              {!formValid && (
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#7c89a3", textAlign: "center", marginBottom: 12 }}>
                  {t.checkout.fillAndAgree}
                </p>
              )}

              <div ref={paypalRef} style={{ opacity: formValid ? 1 : 0.4, pointerEvents: formValid ? "auto" : "none" }} />

              {paying && (
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#7c89a3", textAlign: "center", marginTop: 12 }}>
                  {t.checkout.processing}
                </p>
              )}

              <p style={{ fontSize: 11, color: "#7c89a3", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                {t.checkout.secureNote1}<br />
                {t.checkout.secureNote2}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        .kb-checkout-grid input::placeholder,
        .kb-checkout-grid textarea::placeholder { color: #aab6cc; }
        .kb-checkout-grid input:focus,
        .kb-checkout-grid textarea:focus { border-color: #2563eb; }
        @media (min-width: 900px) {
          .kb-checkout-grid { grid-template-columns: 1fr 360px !important; }
        }
        @media (max-width: 520px) {
          .kb-fields { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

const labelHead: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  color: "#7c89a3",
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#f4f7fe",
  border: "1px solid #d6e0f0",
  borderRadius: 10,
  color: "#0b1b3b",
  fontSize: 14,
  outline: "none",
};

function Field({
  label, value, onChange, type = "text", required = false, placeholder, wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <label style={{ display: "block", gridColumn: wide ? "1 / -1" : undefined }}>
      <span style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.22em", color: "#7c89a3", marginBottom: 6 }}>
        {label} {required && <span style={{ color: ACCENT }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
