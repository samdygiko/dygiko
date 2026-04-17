"use client";

import { motion } from "framer-motion";

/* ─── Testimonial card ───────────────────────────────────────────────────── */
function TestimonialCard() {
  return (
    <div
      className="flex flex-col justify-between"
      style={{
        border: "1px solid rgba(176,255,0,0.2)",
        borderRadius: 8,
        padding: "28px 24px",
        background: "rgba(176,255,0,0.03)",
        maxWidth: 320,
        width: "100%",
      }}
    >
      <div>
        <svg width="24" height="18" viewBox="0 0 24 18" fill="#b0ff00" opacity="0.5" style={{ marginBottom: 16 }}>
          <path d="M0 18V10.8C0 7.8 .8 5.3 2.4 3.3 4 1.1 6.4 0 9.6 0L10.8 2.4C8.8 2.8 7.2 3.7 6 5.1 5 6.3 4.5 7.7 4.6 9H9.6V18H0ZM14.4 18V10.8C14.4 7.8 15.2 5.3 16.8 3.3 18.4 1.1 20.8 0 24 0L25.2 2.4C23.2 2.8 21.6 3.7 20.4 5.1 19.4 6.3 18.9 7.7 19 9H24V18H14.4Z" />
        </svg>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          &ldquo;Amazing experience with Sam he was able to make all the changes and do everything I asked for, price is also fantastic for what you get, would definitely recommend!&rdquo;
        </p>
      </div>
      <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm font-semibold text-white">Eden</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          Director, Hayford Group
        </p>
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
export default function TemplatesSection() {
  return (
    <section
      className="py-24 md:py-32 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="work"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Our work
          </p>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h2
              className="font-heading font-black tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
            >
              Built for real businesses
            </h2>
            <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Every site is custom — designed and built to convert visitors into customers.
            </p>
          </div>
        </motion.div>

        {/* Hayford card + testimonial */}
        <motion.div
          className="flex flex-col lg:flex-row items-start gap-8"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {/* Browser chrome + iframe */}
          <a
            href="https://hayfordgroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col group"
            style={{ textDecoration: "none", flex: "1 1 auto", maxWidth: 680 }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                overflow: "hidden",
                background: "#0e0e0e",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              {/* Chrome bar */}
              <div style={{ background: "#1a1a1a", height: 32, display: "flex", alignItems: "center", padding: "0 12px", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                    <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 20, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "monospace" }}>hayfordgroup.com</span>
                </div>
              </div>
              {/* Live iframe */}
              <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
                <iframe
                  src="https://hayfordgroup.com"
                  title="Hayford Group website"
                  loading="lazy"
                  style={{
                    width: "200%",
                    height: "200%",
                    border: "none",
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    userSelect: "none",
                    display: "block",
                  }}
                  scrolling="no"
                />
              </div>
            </div>
            <div className="mt-3 px-1">
              <span className="text-sm font-medium group-hover:text-[#b0ff00] transition-colors duration-200" style={{ color: "rgba(255,255,255,0.7)" }}>
                Hayford Group — Corporate Finance ↗
              </span>
            </div>
          </a>

          {/* Testimonial */}
          <div className="lg:pt-0 lg:self-center" style={{ flexShrink: 0 }}>
            <TestimonialCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
