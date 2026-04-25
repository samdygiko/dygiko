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
      className="border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="craft"
    >
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div
            className="px-8 py-16 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
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

        <motion.div
          className="relative mx-3 md:mx-6 my-3 md:my-6 overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "2px",
            aspectRatio: "16 / 9",
            background: "rgba(255,255,255,0.02)",
          }}
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
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
            style={{ filter: "grayscale(0.25) contrast(1.05) brightness(0.85)" }}
            aria-label="A designer working on a laptop"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0) 30%, rgba(8,8,8,0) 60%, rgba(8,8,8,0.55) 100%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 p-5 md:p-8 flex items-center gap-3 text-xs md:text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
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
            Designed and shipped by hand — never templated.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
