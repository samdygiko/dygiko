"use client";

import { motion } from "framer-motion";
import Magnetic from "./Magnetic";

type Package = {
  name: string;
  price: number;
  checkoutPkg: "site" | "crm" | "bundle";
  includes: string[];
  featured?: boolean;
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#b0ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,8 6,12 14,4" />
  </svg>
);

// Used everywhere consultations are booked. Single source of truth.
export const CALENDLY_URL = "https://calendly.com/samuelsako-dygiko379/30min";

const PACKAGES: Package[] = [
  {
    name: "Custom OMS",
    price: 1000,
    checkoutPkg: "crm",
    includes: [
      "Custom OMS tailored to your business",
      "Leads, customers & pipeline tracking",
      "Calls, notes, follow-ups in one place",
      "Built around your workflow",
      "Unlimited revisions",
    ],
  },
  {
    name: "Website",
    price: 500,
    checkoutPkg: "site",
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
    name: "Website + Custom OMS",
    price: 1250,
    checkoutPkg: "bundle",
    featured: true,
    includes: [
      "Everything in Website",
      "Everything in Custom OMS",
      "Best value — save £250/yr vs separate",
      "Single login, unified setup",
      "Unlimited revisions to site & OMS",
    ],
  },
];

export default function ServicesSection() {
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
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.checkoutPkg}
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
              {/* Name + price */}
              <div>
                <h3 className="font-heading text-xl font-bold tracking-tight mb-1">
                  {pkg.name}
                </h3>
                <p
                  className="font-heading text-3xl font-black tracking-tight"
                  style={{ color: pkg.featured ? "#b0ff00" : "#ffffff" }}
                >
                  £{pkg.price.toLocaleString()}
                  <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {" "}/year
                  </span>
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

              {/* Add to cart → PayPal checkout for this package. */}
              <div className="flex flex-col gap-2 self-start">
                <Magnetic strength={pkg.featured ? 0.28 : 0.18} className="self-start">
                  <a
                    href={`/checkout?pkg=${pkg.checkoutPkg}`}
                    className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-sm transition-opacity duration-200 hover:opacity-80"
                    style={{
                      background: pkg.featured ? "#b0ff00" : "transparent",
                      color: pkg.featured ? "#080808" : "rgba(255,255,255,0.65)",
                      border: pkg.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Add to cart →
                  </a>
                </Magnetic>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
