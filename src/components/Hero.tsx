"use client";

import { motion } from "framer-motion";
import Magnetic from "./Magnetic";

/* ─── Hero section ───────────────────────────────────────────────────────── */
const HERO_MEDIA = "/hero.mp4";

const HERO_FILTER =
  "grayscale(0.18) contrast(1.05) brightness(0.9) saturate(1.0)";

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      id="hero"
    >
      <video
        src={HERO_MEDIA}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: HERO_FILTER, zIndex: 0 }}
      />

      {/* Light scrim — just enough to keep the headline crisp */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse at center, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.55) 80%, #080808 100%)",
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #080808)",
          zIndex: 3,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Headline — split-text reveal, char-by-char with blur+y */}
        <h1
          className="font-heading font-black tracking-tight leading-[0.95] mb-10"
          style={{ fontSize: "clamp(4rem, 13vw, 12rem)" }}
          aria-label="Simple is better."
        >
          {(["Simple is", "better."] as const).map((line, lineIdx) => (
            <span key={lineIdx} className="block" aria-hidden="true">
              {line.split("").map((ch, i) => {
                const delay = 0.2 + lineIdx * 0.12 + i * 0.022;
                return (
                  <motion.span
                    key={`${lineIdx}-${i}`}
                    className="inline-block"
                    initial={{ opacity: 0, y: "0.6em", filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.85,
                      delay,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    style={{ whiteSpace: ch === " " ? "pre" : undefined }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          scroll
        </span>
        <motion.div
          className="w-px h-8"
          style={{ background: "rgba(255,255,255,0.15)" }}
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
