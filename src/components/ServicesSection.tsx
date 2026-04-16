"use client";

import { motion } from "framer-motion";

type Package = {
  num: string;
  icon: React.ReactNode;
  name: string;
  price: string;
  stripeUrl: string;
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

const PACKAGES: Package[] = [
  {
    num: "01",
    icon: <IconMonitor />,
    name: "Basic Website",
    price: "£500",
    stripeUrl: "https://buy.stripe.com/4gMcN5aQg1wXdJq20SfjG00",
    includes: [
      "Custom website design",
      "Domain & hosting setup",
      "Mobile responsive",
      "Basic SEO",
      "Live in 2 days",
    ],
  },
  {
    num: "02",
    icon: <IconSearch />,
    name: "Growth Website",
    price: "£750",
    stripeUrl: "https://buy.stripe.com/fZueVdbUk2B16gYaxofjG01",
    includes: [
      "Everything in Basic",
      "Advanced SEO",
      "Blog setup + 3 starter posts",
      "Contact form integration",
      "Company email address",
    ],
  },
  {
    num: "03",
    icon: <IconRocket />,
    name: "Full Business Package",
    price: "£1,500",
    stripeUrl: "https://buy.stripe.com/bJebJ19McdfFdJq0WOfjG02",
    featured: true,
    includes: [
      "Everything in Growth",
      "Google Business Profile setup",
      "Custom CRM system",
      "WhatsApp & call button integration",
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
              key={pkg.num}
              className="service-card group flex flex-col gap-7 p-8 py-12"
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
                  {pkg.price}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  + £29/month
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

              {/* Buy now → Stripe */}
              <a
                href={pkg.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-sm transition-opacity duration-200 hover:opacity-80"
                style={{
                  background: pkg.featured ? "#b0ff00" : "transparent",
                  color: pkg.featured ? "#080808" : "rgba(255,255,255,0.65)",
                  border: pkg.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Buy now →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
