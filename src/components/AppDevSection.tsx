"use client";

import { motion } from "framer-motion";

const APPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="17" r="1" />
      </svg>
    ),
    name: "iOS App",
    desc: "Native iOS apps for iPhone and iPad. App Store submission included. Loyalty programmes, booking tools, or branded customer portals.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
        <path d="M9 2h6" />
      </svg>
    ),
    name: "Android App",
    desc: "Full Android applications for phones and tablets. Google Play listing included. Fast, lightweight, and built for your customers.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <line x1="8" y1="22" x2="16" y2="22" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
    ),
    name: "Mac & Windows App",
    desc: "Desktop applications for macOS and Windows. Ideal for internal business tools, dashboards, or customer-facing software.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" />
        <line x1="12" y1="7" x2="19" y2="17" />
        <line x1="7" y1="19" x2="17" y2="19" />
      </svg>
    ),
    name: "Custom CRM",
    desc: "Tailored customer relationship systems built around your workflow. Track leads, automate follow-ups, manage bookings — all in one place.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    name: "Web App",
    desc: "Custom browser-based applications — dashboards, portals, booking systems, and internal tools. No download required, works on any device.",
  },
];

export default function AppDevSection() {
  return (
    <section
      className="py-24 md:py-32 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="apps"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75 }}
        >
          <p
            className="text-xs uppercase tracking-[0.2em] mb-5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Beyond websites
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2
              className="font-heading font-black tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
            >
              Custom apps and CRM
              <br />
              built for your business
            </h2>
            <p
              className="text-sm max-w-xs"
              style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}
            >
              Not every business fits in a website. We build apps and systems for the
              ones that need more.
            </p>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-0">
          {APPS.map((app, i) => (
            <motion.div
              key={app.name}
              className="flex flex-col gap-5 p-8 border-b xl:border-b-0"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                borderRight: i < APPS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: i * 0.1 }}
            >
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{app.icon}</span>
              <div>
                <h3 className="font-heading font-bold text-lg tracking-tight mb-2">
                  {app.name}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {app.desc}
                </p>
              </div>
              <a
                href="#contact"
                className="mt-auto inline-flex items-center text-sm font-medium transition-colors duration-200"
                style={{ color: "#b0ff00" }}
              >
                Get a quote →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
