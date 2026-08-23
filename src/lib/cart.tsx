"use client";

// Shopping cart for kojobuilds.com. Customers can add several packages and
// change quantities; at checkout everything is summed into ONE annual
// subscription total (PayPal only approves one plan per flow, so we bill the
// combined yearly amount as a single subscription). State is persisted to
// localStorage and a slide-out drawer (rendered here) lets them edit quantities.
//
// For the social-media package "quantity" means posts-per-month (£75/yr each);
// for every other package it's just how many of that package (usually 1).

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PACKAGES, getPackage, type Package, type PackageKey } from "./products";

export type CartItem = { pkg: PackageKey; qty: number };

export type LineItem = {
  pkg: PackageKey;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  isSlider: boolean;
  unitLabel: string;
  min: number;
  max: number;
};

const STORAGE_KEY = "kojoCart";
const VALID_KEYS = new Set(PACKAGES.map((p) => p.key));

// A slider package (social) is priced per unit; others use their flat price.
const unitPriceOf = (p: Package) => p.perUnit ?? p.price;
const isSlider = (p: Package) => p.perUnit != null;
const minOf = (p: Package) => p.unitMin ?? 1;
const maxOf = (p: Package) => p.unitMax ?? 20;
const defaultQtyOf = (p: Package) => p.unitDefault ?? 1;

export function buildLineItems(items: CartItem[]): LineItem[] {
  return items
    .map((it) => {
      const p = getPackage(it.pkg);
      if (!p) return null;
      const unitPrice = unitPriceOf(p);
      return {
        pkg: p.key,
        name: p.name,
        qty: it.qty,
        unitPrice,
        lineTotal: unitPrice * it.qty,
        isSlider: isSlider(p),
        unitLabel: p.unitLabel ?? "",
        min: minOf(p),
        max: maxOf(p),
      } as LineItem;
    })
    .filter(Boolean) as LineItem[];
}

type CartValue = {
  items: CartItem[];
  lineItems: LineItem[];
  total: number;
  count: number;
  hydrated: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  addItem: (pkg: PackageKey, openDrawer?: boolean) => void;
  setQty: (pkg: PackageKey, qty: number) => void;
  removeItem: (pkg: PackageKey) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (SSR renders an empty cart to avoid hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((it) => it && VALID_KEYS.has(it.pkg) && Number(it.qty) > 0)
              .map((it) => ({ pkg: it.pkg, qty: Math.round(Number(it.qty)) }))
          );
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const clampQty = (pkg: PackageKey, qty: number) => {
    const p = getPackage(pkg);
    const min = p ? minOf(p) : 1;
    const max = p ? maxOf(p) : 20;
    return Math.max(min, Math.min(max, Math.round(qty)));
  };

  const addItem = (pkg: PackageKey, openDrawer = true) => {
    const p = getPackage(pkg);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((it) => it.pkg === pkg);
      if (existing) {
        return prev.map((it) =>
          it.pkg === pkg ? { ...it, qty: clampQty(pkg, it.qty + 1) } : it
        );
      }
      return [...prev, { pkg, qty: defaultQtyOf(p) }];
    });
    if (openDrawer) setOpen(true);
  };

  const setQty = (pkg: PackageKey, qty: number) =>
    setItems((prev) => prev.map((it) => (it.pkg === pkg ? { ...it, qty: clampQty(pkg, qty) } : it)));

  const removeItem = (pkg: PackageKey) => setItems((prev) => prev.filter((it) => it.pkg !== pkg));

  const clear = () => setItems([]);

  const lineItems = useMemo(() => buildLineItems(items), [items]);
  const total = useMemo(() => lineItems.reduce((s, li) => s + li.lineTotal, 0), [lineItems]);
  const count = lineItems.length;

  const value: CartValue = {
    items, lineItems, total, count, hydrated, open, setOpen, addItem, setQty, removeItem, clear,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Safe no-op fallback if used outside the provider.
    return {
      items: [], lineItems: [], total: 0, count: 0, hydrated: false, open: false,
      setOpen: () => {}, addItem: () => {}, setQty: () => {}, removeItem: () => {}, clear: () => {},
    };
  }
  return ctx;
}

const ACCENT = "#b0ff00";

function CartDrawer() {
  const { open, setOpen, lineItems, total, setQty, removeItem, clear } = useCart();
  const router = useRouter();

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const goCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(11,27,59,0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <aside
        aria-hidden={!open}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 61,
          width: "min(420px, 100vw)",
          background: "#ffffff",
          boxShadow: "-20px 0 60px rgba(11,27,59,0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e4ebf5" }}>
          <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#0b1b3b", fontWeight: 700 }}>Your cart</span>
          <button onClick={() => setOpen(false)} aria-label="Close cart" style={{ fontSize: 22, lineHeight: 1, color: "#7c89a3", background: "none", border: "none", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {lineItems.length === 0 ? (
            <p style={{ fontSize: 14, color: "#7c89a3", textAlign: "center", marginTop: 40 }}>
              Your cart is empty.
            </p>
          ) : (
            lineItems.map((li) => (
              <div key={li.pkg} style={{ border: "1px solid #e4ebf5", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0b1b3b", lineHeight: 1.3 }}>{li.name}</span>
                  <button onClick={() => removeItem(li.pkg)} aria-label={`Remove ${li.name}`} style={{ fontSize: 12, color: "#aab6cc", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Remove</button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  {/* Qty stepper */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #d6e0f0", borderRadius: 8, overflow: "hidden" }}>
                      <button onClick={() => setQty(li.pkg, li.qty - 1)} disabled={li.qty <= li.min} aria-label="Decrease" style={stepBtn(li.qty <= li.min)}>−</button>
                      <span style={{ minWidth: 34, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#0b1b3b", fontVariantNumeric: "tabular-nums" }}>{li.qty}</span>
                      <button onClick={() => setQty(li.pkg, li.qty + 1)} disabled={li.qty >= li.max} aria-label="Increase" style={stepBtn(li.qty >= li.max)}>+</button>
                    </div>
                    {li.isSlider && <span style={{ fontSize: 11, color: "#7c89a3" }}>{li.unitLabel}</span>}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0b1b3b" }}>£{li.lineTotal.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500, color: "#7c89a3" }}>/yr</span></div>
                    {li.isSlider && <div style={{ fontSize: 10, color: "#7c89a3" }}>£{li.unitPrice}/yr each</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {lineItems.length > 0 && (
          <div style={{ borderTop: "1px solid #e4ebf5", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", color: "#7c89a3" }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#0b1b3b" }}>£{total.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 500, color: "#7c89a3" }}>/yr</span></span>
            </div>
            <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: -6 }}>Billed once a year</p>
            <button onClick={goCheckout} style={{ background: ACCENT, color: "#080808", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Checkout →
            </button>
            <button onClick={clear} style={{ background: "none", border: "none", color: "#aab6cc", fontSize: 12, cursor: "pointer" }}>Clear cart</button>
          </div>
        )}
      </aside>
    </>
  );
}

function stepBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 32, height: 32, border: "none", background: "#f4f7fe", color: disabled ? "#c3cee0" : "#5c8a00",
    fontSize: 18, lineHeight: 1, cursor: disabled ? "default" : "pointer",
  };
}
