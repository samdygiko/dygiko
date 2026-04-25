"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Magnetic from "./Magnetic";

/* ─── Hero section ───────────────────────────────────────────────────────── */
const HERO_VIDEOS = [
  "https://videos.pexels.com/video-files/10375458/10375458-hd_1920_1080_30fps.mp4", // woman smiling at desk
  "https://videos.pexels.com/video-files/9033088/9033088-uhd_2560_1440_25fps.mp4",  // woman on video call
  "https://videos.pexels.com/video-files/5197241/5197241-uhd_2560_1440_25fps.mp4",  // man typing on laptop keyboard
  "https://videos.pexels.com/video-files/6786265/6786265-uhd_2560_1440_25fps.mp4",  // woman busy using laptop
];

const PLAYBACK_RATE = 0.55; // slowed for cinematic feel
const SLIDE_MS = 9000;      // per-clip on-screen time
const FADE_MS = 1400;       // crossfade duration

const VIDEO_FILTER =
  "grayscale(0.18) contrast(1.05) brightness(0.85) saturate(1.0)";

/**
 * Crossfading slideshow of distinct clips. Each <video> renders continuously,
 * but loop is disabled and playback is slowed — combined with the per-clip
 * window being shorter than the slowed clip duration, we never hit the end.
 */
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % HERO_VIDEOS.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {HERO_VIDEOS.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            if (el) el.playbackRate = PLAYBACK_RATE;
          }}
          src={src}
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: VIDEO_FILTER,
            opacity: i === current ? 1 : 0,
            transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      id="hero"
    >
      <HeroSlideshow />

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
        {/* Eyebrow */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span
            className="eyebrow-dot w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: "#b0ff00" }}
          />
          <span
            className="text-xs uppercase tracking-[0.2em] font-sans"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Web Design Studio
          </span>
        </motion.div>

        {/* Headline — split-text reveal, char-by-char with blur+y */}
        <h1
          className="font-heading font-black tracking-tight leading-[1.0] mb-8"
          style={{ fontSize: "clamp(3rem, 8vw, 7.5rem)" }}
          aria-label="Your business, finally online."
        >
          {(["Your business,", "finally online."] as const).map((line, lineIdx) => (
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

        {/* Subtext */}
        <motion.p
          className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-12"
          style={{ color: "rgba(255,255,255,0.45)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          We build professional websites for businesses globally — fast, affordable,
          and built to be found. Go live in 2 days.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          {/* Primary CTA → pricing section */}
          <Magnetic>
            <a
              href="#services"
              className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-black rounded-sm transition-opacity duration-200 hover:opacity-80"
              style={{ background: "#b0ff00" }}
            >
              Get started →
            </a>
          </Magnetic>
          <Magnetic strength={0.22}>
            <a
              href="#work"
              className="inline-flex items-center px-7 py-3.5 text-sm font-medium rounded-sm transition-colors duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              View our work
            </a>
          </Magnetic>
        </motion.div>
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
