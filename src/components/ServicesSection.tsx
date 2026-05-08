"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Magnetic from "./Magnetic";

type Package = {
  num: string;
  icon: React.ReactNode;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  stripeUrlMonthly: string;
  stripeUrlAnnual: string;
  includes: string[];
  featured?: boolean;
};

const IconMonitor = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="9" y1="11" x2="13" y2="11" />
    <line x1="11" y1="9" x2="11" y2="13" />
  </svg>
);

const IconRocket = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" />
    <path d="M7 13c0 0-3 1.5-3 5h16c0-3.5-3-5-3-5" />
    <line x1="12" y1="13" x2="12" y2="19" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#b0ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,8 6,12 14,4" />
  </svg>
);

// Used everywhere consultations are booked. Single source of truth.
export const CALENDLY_URL = "https://calendly.com/samuelsako-dygiko379/30min";

const PACKAGES: Package[] = [
  {
    num: "01",
    icon: <IconMonitor />,
    name: "Website",
    monthlyPrice: 69,
    annualPrice: 690,
    stripeUrlMonthly: "https://buy.stripe.com/fZueVdbUk2B16gYaxofjG01",
    stripeUrlAnnual: "https://buy.stripe.com/4gM28r7E4ejJgVCeNEfjG0a",
    includes: [
      "Custom website design",
      "Domain & hosting setup",
      "Mobile responsive",
      "Advanced SEO",
      "Contact form integration",
      "Business email address setup",
      "WhatsApp & call button integration",
      "Unlimited revisions",
    ],
  },
  {
    num: "02",
    icon: <IconSearch />,
    name: "CRM",
    monthlyPrice: 129,
    annualPrice: 1290,
    stripeUrlMonthly: "https://buy.stripe.com/00wbJ1f6wdfFfRy8pgfjG0e",
    stripeUrlAnnual: "https://buy.stripe.com/28E28raQgfnNdJqfRIfjG0f",
    includes: [
      "Custom CRM tailored to your business",
      "Leads, customers & pipeline tracking",
      "Calls, notes, follow-ups in one place",
      "Built around your workflow",
      "Unlimited revisions",
    ],
  },
  {
    num: "03",
    icon: <IconRocket />,
    name: "Website + CRM",
    monthlyPrice: 149,
    annualPrice: 1490,
    stripeUrlMonthly: "https://buy.stripe.com/bJe3cv8I8cbB48QeNEfjG0c",
    stripeUrlAnnual: "https://buy.stripe.com/00wbJ1cYodfF8p6dJAfjG0d",
    featured: true,
    includes: [
      "Everything in Website",
      "Everything in CRM",
      "Best value — save £29/mo vs separate",
      "Single login, unified setup",
      "Unlimited revisions to site & CRM",
    ],
  },
];

export default function ServicesSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section
      className="border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="services"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="px-8 py-16 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75 }}
        >
          <p
            className="text-xs uppercase tracking-[0.2em] mb-4"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Pricing
          </p>
          <h2
            className="font-heading font-black tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
          >
            Simple, transparent pricing
          </h2>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center mt-8 p-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            role="tablist"
            aria-label="Billing period"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className="px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200"
              style={{
                background: billing === "monthly" ? "#b0ff00" : "transparent",
                color: billing === "monthly" ? "#080808" : "rgba(255,255,255,0.6)",
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "annual"}
              onClick={() => setBilling("annual")}
              className="px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200 flex items-center gap-2"
              style={{
                background: billing === "annual" ? "#b0ff00" : "transparent",
                color: billing === "annual" ? "#080808" : "rgba(255,255,255,0.6)",
              }}
            >
              Annual
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: billing === "annual" ? "rgba(8,8,8,0.12)" : "rgba(176,255,0,0.15)",
                  color: billing === "annual" ? "#080808" : "#b0ff00",
                }}
              >
                2 months free
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.num}
              className={`service-card group flex flex-col gap-7 p-8 py-12 ${pkg.featured ? "service-card-featured" : ""}`}
              style={{
                borderRight:
                  i < PACKAGES.length - 1
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
                background: pkg.featured ? "rgba(176,255,0,0.03)" : "transparent",
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
            >
              {/* Number + icon */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{ color: "#b0ff00" }}>
                  {pkg.num}
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{pkg.icon}</span>
              </div>

              {/* Name + price */}
              <div>
                <h3 className="font-heading text-xl font-bold tracking-tight mb-1">
                  {pkg.name}
                </h3>
                <p
                  className="font-heading text-3xl font-black tracking-tight"
                  style={{ color: pkg.featured ? "#b0ff00" : "#ffffff" }}
                >
                  £{billing === "monthly" ? pkg.monthlyPrice : pkg.annualPrice}
                  <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {billing === "monthly" ? " /month" : " /year"}
                  </span>
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {billing === "monthly"
                    ? "No upfront cost · cancel anytime"
                    : `2 months free · save £${pkg.monthlyPrice * 12 - pkg.annualPrice}`}
                </p>
              </div>

              {/* Includes */}
              <ul className="flex flex-col gap-3 flex-1">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5"><CheckIcon /></span>
                    <span className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Primary: Book consultation → Calendly. Secondary: Buy directly via Stripe. */}
              <div className="flex flex-col gap-2 self-start">
                <Magnetic strength={pkg.featured ? 0.28 : 0.18} className="self-start">
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-sm transition-opacity duration-200 hover:opacity-80"
                    style={{
                      background: pkg.featured ? "#b0ff00" : "transparent",
                      color: pkg.featured ? "#080808" : "rgba(255,255,255,0.65)",
                      border: pkg.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Book free 15-min call →
                  </a>
                </Magnetic>
                <a
                  href={billing === "monthly" ? pkg.stripeUrlMonthly : pkg.stripeUrlAnnual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs transition-opacity duration-200 hover:opacity-100"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Or sign up directly →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
