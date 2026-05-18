"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const TRUSTPILOT_URL = "https://au.trustpilot.com/review/dygiko.com";

type Project = {
  name: string;
  url: string;
  domain: string;
  label: string;
  testimonial?: {
    quote: string;
    quoteTranslation?: string;
    author: string;
    title: string;
    source?: "trustpilot";
    rating?: number;
  };
};

const projects: Project[] = [
  {
    name: "Hayford Group",
    url: "https://hayfordgroup.com",
    domain: "hayfordgroup.com",
    label: "Hayford Group — Corporate Finance",
    testimonial: {
      quote:
        "Amazing experience with Sam he was able to make all the changes and do everything I asked for, price is also fantastic for what you get, would definitely recommend!",
      author: "Eden",
      title: "Director, Hayford Group",
    },
  },
  {
    name: "Akwaba Etnicas",
    url: "https://www.akwabaetnicas.com",
    domain: "akwabaetnicas.com",
    label: "Akwaba Etnicas — African Fashion & Art",
    testimonial: {
      quote: "Me gustó su trabajo, fue muy rápido en realizar el sitio web!",
      quoteTranslation:
        "I loved their work — they were very quick at building the website!",
      author: "Akwaba Etnicas",
      title: "Verified Trustpilot review",
      source: "trustpilot",
      rating: 5,
    },
  },
  {
    name: "Dzigna Windows",
    url: "https://www.dzignawindows.co.uk",
    domain: "dzignawindows.co.uk",
    label: "Dzigna Windows — Window & Door Installation",
  },
];

const SLIDE_MS = 5000;

/* ─── Testimonial card ───────────────────────────────────────────────────── */
function TestimonialCard({ testimonial }: { testimonial: NonNullable<Project["testimonial"]> }) {
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
        {testimonial.rating && (
          <div className="flex items-center gap-0.5 mb-3" aria-label={`${testimonial.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{
                  color: i < testimonial.rating! ? "#00b67a" : "rgba(255,255,255,0.15)",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >★</span>
            ))}
          </div>
        )}
        <svg width="24" height="18" viewBox="0 0 24 18" fill="#b0ff00" opacity="0.5" style={{ marginBottom: 16 }}>
          <path d="M0 18V10.8C0 7.8 .8 5.3 2.4 3.3 4 1.1 6.4 0 9.6 0L10.8 2.4C8.8 2.8 7.2 3.7 6 5.1 5 6.3 4.5 7.7 4.6 9H9.6V18H0ZM14.4 18V10.8C14.4 7.8 15.2 5.3 16.8 3.3 18.4 1.1 20.8 0 24 0L25.2 2.4C23.2 2.8 21.6 3.7 20.4 5.1 19.4 6.3 18.9 7.7 19 9H24V18H14.4Z" />
        </svg>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        {testimonial.quoteTranslation && (
          <p className="text-xs mt-2 italic leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            &ldquo;{testimonial.quoteTranslation}&rdquo;
          </p>
        )}
      </div>
      <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-sm font-semibold text-white">{testimonial.author}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {testimonial.title}
          </p>
          {testimonial.source === "trustpilot" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#00b67a", fontWeight: 600 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, background: "#00b67a", borderRadius: 1 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white" style={{ display: "block" }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
              Trustpilot
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pending review placeholder ─────────────────────────────────────────── */
function PendingCard() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        border: "1px dashed rgba(255,255,255,0.12)",
        borderRadius: 8,
        padding: "32px 24px",
        background: "rgba(255,255,255,0.015)",
        maxWidth: 320,
        width: "100%",
        minHeight: 200,
      }}
    >
      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.4)" }}>
        Recent launch
      </p>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
export default function TemplatesSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % projects.length), SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  const active = projects[index];

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

        {/* Slideshow + testimonial */}
        <motion.div
          className="flex flex-col lg:flex-row items-start gap-8"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {/* Browser chrome + iframe stack */}
          <div style={{ flex: "1 1 auto", maxWidth: 680, width: "100%" }}>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col group"
              style={{ textDecoration: "none" }}
              key={active.url}
            >
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#0e0e0e",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              >
                {/* Chrome bar */}
                <div
                  style={{
                    background: "#1a1a1a",
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    gap: 10,
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />
                    ))}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: 4,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 10,
                      overflow: "hidden",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={active.domain}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: 11,
                          fontFamily: "monospace",
                          display: "inline-block",
                        }}
                      >
                        {active.domain}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Iframe stack — cross-fade + Ken Burns drift */}
                <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative", background: "#0a0a0a" }}>
                  {projects.map((p, i) => {
                    const isActive = i === index;
                    return (
                      <motion.div
                        key={p.url}
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          willChange: "opacity",
                        }}
                      >
                        <motion.div
                          key={`kb-${p.url}-${index}`}
                          initial={{ scale: 1, x: 0 }}
                          animate={isActive ? { scale: 1.045, x: -6 } : { scale: 1, x: 0 }}
                          transition={{ duration: SLIDE_MS / 1000 + 1.6, ease: "linear" }}
                          style={{ position: "absolute", inset: 0, transformOrigin: "center center" }}
                        >
                          <iframe
                            src={p.url}
                            title={`${p.name} website`}
                            loading="lazy"
                            scrolling="no"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "200%",
                              height: "200%",
                              border: "none",
                              transform: "scale(0.5)",
                              transformOrigin: "top left",
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    );
                  })}

                  {/* Subtle vignette to anchor the iframe edges during the zoom */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      boxShadow: "inset 0 0 80px rgba(0,0,0,0.35)",
                    }}
                  />
                </div>
              </div>

              {/* Caption — animated label */}
              <div className="mt-4 px-1 flex items-baseline justify-between gap-4 min-h-[24px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active.label}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="text-sm font-medium group-hover:text-[#b0ff00] transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.75)", display: "inline-block" }}
                  >
                    {active.label} ↗
                  </motion.span>
                </AnimatePresence>
                <span
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
                </span>
              </div>
            </a>

            {/* Progress bar indicator — fills over the slide duration */}
            <div className="mt-4 px-1 flex items-center gap-3">
              {projects.map((p, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={p.url}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${p.name}`}
                    style={{
                      flex: 1,
                      height: 2,
                      borderRadius: 1,
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isActive ? (
                      <motion.span
                        key={`bar-${index}-${p.url}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "#b0ff00",
                          transformOrigin: "left center",
                          display: "block",
                        }}
                      />
                    ) : i < index ? (
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(176,255,0,0.35)",
                          display: "block",
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Testimonial / pending card */}
          <div className="lg:pt-0 lg:self-center flex flex-col gap-3" style={{ flexShrink: 0, minWidth: 280 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.url}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {active.testimonial ? (
                  <TestimonialCard testimonial={active.testimonial} />
                ) : (
                  <PendingCard />
                )}
              </motion.div>
            </AnimatePresence>

            <a
              href={TRUSTPILOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-sm transition-colors duration-200"
              style={{
                color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.1)",
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#00b67a"; e.currentTarget.style.borderColor = "rgba(0,182,122,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <span style={{ color: "#00b67a", fontSize: 11 }}>★</span>
              Leave us a review on Trustpilot →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
