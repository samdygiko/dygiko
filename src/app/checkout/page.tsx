"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getPackage, type PackageKey } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { useCart, type LineItem } from "@/lib/cart";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const ACCENT = "#b0ff00";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonConfig) => { render: (el: HTMLElement) => void };
    };
  }
}

interface SubscriptionActions {
  subscription: { create: (opts: { plan_id: string }) => Promise<string> };
}

interface PayPalButtonConfig {
  style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number };
  createOrder?: (data: unknown, actions: unknown) => Promise<string>;
  createSubscription?: (data: unknown, actions: SubscriptionActions) => Promise<string>;
  onApprove?: (data: { orderID?: string; subscriptionID?: string }) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const cart = useCart();

  // Three checkout modes:
  //   ?deposit=25    → Consultation deposit → single capture payment
  //   ?oneoff=250    → Admin one-off link    → single capture payment
  //   ?price=400     → Admin custom-annual   → annual subscription
  //   ?quarterly=390 → Admin custom-quarterly→ subscription billed every 3 months
  //   ?monthly=150   → Admin custom-monthly  → subscription billed every month
  //   (no params)    → normal CART           → annual subscription for the combined total
  const parseAmt = (raw: string | null, min: number, max: number) => {
    if (!raw) return null;
    const n = Math.round(Number(raw));
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  const oneoff = parseAmt(params.get("oneoff"), 10, 100000);
  // Booking deposit, sent to a prospect from the call tracker. Capped low —
  // this link goes out over SMS, so a typo shouldn't be able to bill someone
  // hundreds of pounds.
  const deposit = parseAmt(params.get("deposit"), 5, 500);
  const priceOverride = parseAmt(params.get("price"), 10, 100000);
  const quarterly = parseAmt(params.get("quarterly"), 10, 100000);
  const monthly = parseAmt(params.get("monthly"), 10, 100000);
  const pkgParam = params.get("pkg");
  const singlePkg = pkgParam ? getPackage(pkgParam) : undefined;

  const mode: "oneoff" | "deposit" | "custom" | "quarterly" | "monthly" | "cart" =
    deposit !== null
      ? "deposit"
      : oneoff !== null
      ? "oneoff"
      : quarterly !== null
        ? "quarterly"
        : monthly !== null
          ? "monthly"
          : priceOverride !== null
            ? "custom"
            : "cart";
  const isDeposit = mode === "deposit";
  const isOneOff = mode === "oneoff" || mode === "deposit";
  const isQuarterly = mode === "quarterly";
  const isMonthly = mode === "monthly";
  const isCart = mode === "cart";
  // What PayPal bills each cycle. Quarterly/monthly links mint shorter plans.
  const billingPeriod: "year" | "quarter" | "month" = isQuarterly
    ? "quarter"
    : isMonthly
      ? "month"
      : "year";

  // Seed the cart from ?pkg= when arriving in cart mode with an empty cart
  // (e.g. an old direct "buy now" link) — wait for hydration so we don't
  // double-add on top of a saved cart.
  const seeded = useRef(false);
  useEffect(() => {
    if (!cart.hydrated || seeded.current) return;
    seeded.current = true;
    if (isCart && cart.items.length === 0 && singlePkg) {
      cart.addItem(singlePkg.key, false);
    }
  }, [cart.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Line items + total for the summary and payment.
  const singleName = isDeposit
    ? "Consultation deposit"
    : singlePkg ? t.packages[singlePkg.key].name : "Custom order";
  const singleAmt = isDeposit
    ? deposit!
    : mode === "oneoff"
    ? oneoff!
    : isQuarterly
      ? quarterly!
      : isMonthly
        ? monthly!
        : priceOverride ?? 0;
  const lineItems: LineItem[] = isCart
    ? cart.lineItems
    : [{
        pkg: (singlePkg?.key ?? "site") as PackageKey,
        name: singleName, qty: 1, unitPrice: singleAmt, lineTotal: singleAmt,
        isSlider: false, unitLabel: "", min: 1, max: 1,
      }];
  const total = isCart ? cart.total : singleAmt;
  const primaryPkg: PackageKey = lineItems[0]?.pkg ?? "site";
  const perLabel = isOneOff
    ? ""
    : isQuarterly
      ? t.pricing.perQuarter
      : isMonthly
        ? t.pricing.perMonth
        : t.pricing.perYear;
  const lineKey = lineItems.map((li) => `${li.pkg}:${li.qty}`).join(",");

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

  // Lazy-load the PayPal SDK once. Monthly custom links use subscription mode;
  // everything else (standard packages + one-off custom links) is capture.
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || sdkReady) return;
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    // One-off links capture a single payment; everything else is a subscription.
    script.src = isOneOff
      ? `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=GBP&intent=capture&enable-funding=card`
      : `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=GBP&vault=true&intent=subscription&enable-funding=card`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError("Couldn't load PayPal — refresh and try again");
    document.head.appendChild(script);
  }, [sdkReady]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = !!name && emailValid && agreed;
  const canPay = formValid && total >= 10 && lineItems.length > 0;

  // Re-mount the PayPal buttons whenever the form changes so the order
  // closure always sees the latest customer info. The price is set
  // server-side from products.ts — never trusted from the client.
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current) return;
    const el = paypalRef.current;
    el.innerHTML = "";
    if (!canPay) return;

    const customer = { name, email, phone, business, website, notes };
    const headers = { "Content-Type": "application/json" };
    const items = lineItems.map((li) => ({
      pkg: li.pkg, name: li.name, qty: li.qty, unitPrice: li.unitPrice, lineTotal: li.lineTotal,
    }));
    const successUrl = isCart ? "/checkout/success" : `/checkout/success?pkg=${primaryPkg}`;
    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : "PayPal error — please try again");
      setPaying(false);
    };

    const config: PayPalButtonConfig = isOneOff
      ? {
          // One-off custom link → single payment (capture).
          style: { layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 48 },
          createOrder: async () => {
            setError(null);
            setPaying(true);
            const res = await fetch("/api/paypal/create-order", {
              method: "POST", headers,
              body: JSON.stringify(
                isDeposit
                  ? { amount: total, customer, label: "Consultation deposit" }
                  : { pkg: primaryPkg, amount: total, customer }
              ),
            });
            const d = await res.json();
            if (!res.ok || !d.id) throw new Error(d?.error || "Couldn't start checkout");
            return d.id;
          },
          onApprove: async (data) => {
            try {
              const res = await fetch("/api/paypal/capture", {
                method: "POST", headers,
                body: JSON.stringify({ orderId: data.orderID, pkg: primaryPkg, amount: total, customer }),
              });
              if (!res.ok) { const err = await res.json(); throw new Error(err?.error || "Couldn't take payment"); }
              router.push(successUrl);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Payment failed");
            } finally { setPaying(false); }
          },
          onError,
          onCancel: () => setPaying(false),
        }
      : {
          // Cart, annual, quarterly or monthly link → one subscription for the total.
          style: { layout: "vertical", color: "blue", shape: "rect", label: "subscribe", height: 48 },
          createSubscription: async (_d, actions) => {
            setError(null);
            setPaying(true);
            const r = await fetch("/api/paypal/custom-plan", {
              method: "POST", headers,
              body: JSON.stringify({ amount: total, period: billingPeriod }),
            });
            const d = await r.json();
            if (!r.ok || !d.planId) throw new Error(d?.error || "Couldn't set up the plan");
            return actions.subscription.create({ plan_id: d.planId });
          },
          onApprove: async (data) => {
            try {
              const res = await fetch("/api/paypal/record-subscription", {
                method: "POST", headers,
                body: JSON.stringify({ subscriptionID: data.subscriptionID, pkg: primaryPkg, items, amount: total, customer, period: billingPeriod }),
              });
              if (!res.ok) { const e = await res.json(); throw new Error(e?.error || "Couldn't start your subscription"); }
              if (isCart) cart.clear();
              router.push(successUrl);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Subscription failed");
            } finally { setPaying(false); }
          },
          onError,
          onCancel: () => setPaying(false),
        };

    window.paypal.Buttons(config).render(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, canPay, isOneOff, isDeposit, isCart, billingPeriod, primaryPkg, total, lineKey, name, email, phone, business, website, notes, router]);

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={labelHead}>{t.checkout.orderSummary}</span>
                {isCart && (
                  <button
                    onClick={() => cart.setOpen(true)}
                    style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                  >
                    Edit cart
                  </button>
                )}
              </div>

              {lineItems.length === 0 ? (
                <p style={{ fontSize: 14, color: "#7c89a3", marginBottom: 20 }}>
                  Your cart is empty. <Link href="/#services" style={{ color: ACCENT }}>Browse packages →</Link>
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {lineItems.map((li) => (
                    <div key={li.pkg} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontSize: 14, color: "#0b1b3b", lineHeight: 1.35 }}>
                        {li.name}
                        {li.isSlider ? (
                          <span style={{ color: "#7c89a3" }}> — {li.qty} {li.unitLabel}</span>
                        ) : li.qty > 1 ? (
                          <span style={{ color: "#7c89a3" }}> × {li.qty}</span>
                        ) : null}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0b1b3b", whiteSpace: "nowrap" }}>£{li.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {isDeposit ? (
                <div style={{ background: "rgba(176,255,0,0.07)", border: "1px solid rgba(176,255,0,0.25)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#7aa800", fontWeight: 700, marginBottom: 6 }}>
                    Holds your consultation slot
                  </p>
                  <p style={{ fontSize: 12, color: "#44516b", lineHeight: 1.6, margin: 0 }}>
                    A one-off £{deposit} to book the appointment. It comes straight off your
                    first invoice, so if you go ahead it costs you nothing extra.
                  </p>
                </div>
              ) : isOneOff ? (
                <p style={{ fontSize: 12, color: "#b0ff00", fontWeight: 600, marginBottom: 16 }}>One-off payment</p>
              ) : lineItems.length > 0 ? (
                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 16 }}>{t.pricing.billedAnnually} · hosting, updates & support included</p>
              ) : null}

              <div style={{ borderTop: "1px solid #e4ebf5", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                <span style={labelHead}>{t.checkout.total}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: "#0b1b3b" }}>£{total.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 500, color: "#7c89a3" }}>{perLabel}</span></span>
              </div>

              {error && <p style={{ fontSize: 13, color: "#f87171", marginBottom: 14 }}>{error}</p>}

              {!PAYPAL_CLIENT_ID && (
                <p style={{ fontSize: 12, color: "#fbbf24", marginBottom: 12 }}>
                  {t.checkout.paypalNotConfigured}
                </p>
              )}

              {lineItems.length > 0 && !formValid && (
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#7c89a3", textAlign: "center", marginBottom: 12 }}>
                  {t.checkout.fillAndAgree}
                </p>
              )}

              <div ref={paypalRef} style={{ opacity: canPay ? 1 : 0.4, pointerEvents: canPay ? "auto" : "none" }} />

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
        .kb-checkout-grid textarea:focus { border-color: #b0ff00; }
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
