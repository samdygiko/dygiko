"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Magnetic from "./Magnetic";
import { useCart } from "@/lib/cart";
import { getPackage } from "@/lib/products";

type Package = {
  name: string;
  price: number;
  checkoutPkg: "site" | "crm" | "bundle" | "social";
  includes: string[];
  featured?: boolean;
  /** Social card has a Posts/Reels toggle. Prices below are per-year "from" figures. */
  isSocial?: boolean;
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
    name: "Custom OMS (Operations Management System)",
    price: 600,
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
    price: 360,
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
    price: 840,
    checkoutPkg: "bundle",
    featured: true,
    includes: [
      "Everything in Website",
      "Everything in Custom OMS",
      "Best value — save £120/yr vs separate",
      "Single login, unified setup",
      "Unlimited revisions to site & OMS",
    ],
  },
  {
    // Priced as "from" — clicking Add to cart adds the default number of
    // posts (or reels) per month, editable in the cart / checkout slider.
    name: "Social media management",
    price: 156,
    checkoutPkg: "social",
    isSocial: true,
    includes: [
      "Content planned around your business",
      "Written, designed & scheduled for you",
      "Posts from £6.50 each · reels from £18 each",
      "Scale posts or reels per month anytime",
    ],
  },
];

export default function ServicesSection() {
  const { addItem } = useCart();
  // The social card sells two things at different rates — static posts and
  // edited reels. One card, a toggle inside, and the chosen kind decides
  // which package key is added to the cart.
  const [socialKind, setSocialKind] = useState<"social" | "reels">("social");
  const socialPkg = getPackage(socialKind);
  const socialFromPrice = socialPkg?.price ?? 156;
  const socialTitle =
    socialKind === "social" ? "Static posts" : "Reels & video editing";

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
          <h2
            className="font-heading font-black tracking-tight"
            style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)", lineHeight: 1.0 }}
          >
            Pricing
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((pkg, i) => {
            const displayName = pkg.isSocial ? socialTitle : pkg.name;
            const displayPrice = pkg.isSocial ? socialFromPrice : pkg.price;
            const cartKey = pkg.isSocial ? socialKind : pkg.checkoutPkg;
            return (
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
                    {displayName}
                  </h3>
                  <p
                    className="font-heading text-3xl font-black tracking-tight"
                    style={{ color: pkg.featured ? "#b0ff00" : "#ffffff" }}
                  >
                    {pkg.isSocial && (
                      <span className="text-base font-medium mr-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                        from
                      </span>
                    )}
                    £{displayPrice.toLocaleString()}
                    <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {" "}/year
                    </span>
                  </p>
                </div>

                {/* Posts / Reels toggle — only on the social card. */}
                {pkg.isSocial && (
                  <div className="inline-flex gap-1 p-1 rounded-sm self-start" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {([["social", "Posts"], ["reels", "Reels"]] as const).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSocialKind(k)}
                        className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
                        style={{
                          background: socialKind === k ? "#b0ff00" : "transparent",
                          color: socialKind === k ? "#080808" : "rgba(255,255,255,0.65)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

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
                    <button
                      onClick={() => addItem(cartKey)}
                      className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-sm transition-opacity duration-200 hover:opacity-80"
                      style={{
                        background: pkg.featured ? "#b0ff00" : "transparent",
                        color: pkg.featured ? "#080808" : "rgba(255,255,255,0.65)",
                        border: pkg.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      Add to cart →
                    </button>
                  </Magnetic>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
