"use client";

import { motion } from "framer-motion";
import Reveal from "./Reveal";

const VIDEO_SRC =
  "https://videos.pexels.com/video-files/7278614/7278614-uhd_2732_1440_24fps.mp4";
const POSTER =
  "https://images.pexels.com/videos/7278614/pexels-photo-7278614.jpeg?auto=compress&cs=tinysrgb&w=1600";

export default function CraftSection() {
  return (
    <section
      className="border-b relative"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="craft"
    >
      {/* Headline (constrained to grid) */}
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="px-8 pt-16 pb-12">
            <p
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              The craft
            </p>
            <h2
              className="font-heading font-black tracking-tight max-w-4xl"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
            >
              Every site is built by hand.
            </h2>
            <p
              className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              No drag-and-drop builders. No off-the-shelf themes. Every line of
              code, every layout, every animation — designed and shipped by us.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Full-bleed video that bleeds into the page bg via top + bottom fades */}
      <motion.div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "21 / 9" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <video
          src={VIDEO_SRC}
          poster={POSTER}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "grayscale(0.3) contrast(1.05) brightness(0.78)" }}
          aria-label="A designer working on a laptop"
        />
        {/* Top fade — blends from page bg into video */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "30%",
            background:
              "linear-gradient(180deg, #080808 0%, rgba(8,8,8,0.7) 35%, rgba(8,8,8,0) 100%)",
          }}
        />
        {/* Bottom fade — blends video into page bg / next section */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "45%",
            background:
              "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.65) 55%, #080808 100%)",
          }}
        />
        {/* Side vignettes — subtle, to make the video feel atmospheric not framed */}
        <div
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: "12%",
            background:
              "linear-gradient(90deg, rgba(8,8,8,0.65) 0%, rgba(8,8,8,0) 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{
            width: "12%",
            background:
              "linear-gradient(270deg, rgba(8,8,8,0.65) 0%, rgba(8,8,8,0) 100%)",
          }}
        />

        {/* Floating caption — no card, just text on the video */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="max-w-7xl mx-auto px-8 pb-10 md:pb-14 flex items-center gap-3">
            <span
              className="inline-block"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#b0ff00",
                boxShadow: "0 0 12px rgba(176,255,0,0.55)",
              }}
            />
            <span
              className="text-xs md:text-sm font-medium tracking-wide"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Designed and shipped by hand — never templated.
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
