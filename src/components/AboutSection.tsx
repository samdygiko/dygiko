"use client";

import { motion } from "framer-motion";

const VALUES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Fast delivery",
    desc: "From first call to live site in 2 days. No waiting weeks for a basic website.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    title: "Honest pricing",
    desc: "Fixed prices, no hidden fees, no surprise invoices. You always know what you're paying.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: "Built to grow",
    desc: "Every site is built with SEO and scale in mind. Your site grows as your business does.",
  },
];

export default function AboutSection() {
  return (
    <section
      className="py-24 md:py-32 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="about"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left: heading + body */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.75 }}
          >
            <p
              className="text-xs uppercase tracking-[0.2em] mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              About
            </p>
            <h2
              className="font-heading font-black tracking-tight mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
            >
              We are Dygiko
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)", maxWidth: "42ch" }}
            >
              We&apos;re a UK-based web design studio helping businesses of all sizes
              get online and grow. From a local plumber needing their first website
              to a global brand needing a custom app — we build it all. Fast,
              affordable, and built to last.
            </p>
          </motion.div>

          {/* Right: value props */}
          <div className="flex flex-col gap-0">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                className="flex items-start gap-5 py-8 border-b last:border-b-0"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <span
                  className="shrink-0 mt-0.5 p-2.5 rounded-sm"
                  style={{ background: "rgba(176,255,0,0.1)", color: "#b0ff00" }}
                >
                  {v.icon}
                </span>
                <div>
                  <h3 className="font-heading font-bold text-lg tracking-tight mb-1">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {v.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
