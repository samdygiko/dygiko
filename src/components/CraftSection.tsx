"use client";

import { motion } from "framer-motion";
import Reveal from "./Reveal";

type Photo = {
  src: string;
  alt: string;
  caption: string;
  span?: "tall" | "wide" | "default";
};

const PHOTOS: Photo[] = [
  {
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1400&q=80",
    alt: "Code on a developer's screen",
    caption: "Hand-built — no template stitching",
    span: "tall",
  },
  {
    src: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1400&q=80",
    alt: "Design system in progress",
    caption: "Design system before pixel one",
    span: "wide",
  },
  {
    src: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1400&q=80",
    alt: "Designer at desk with laptop",
    caption: "Editorial layouts, not corporate templates",
  },
  {
    src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1400&q=80",
    alt: "Design tablet showing UI mockup",
    caption: "Pixel-perfect on every screen",
  },
  {
    src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1400&q=80",
    alt: "Laptop with web work on desk",
    caption: "Performance & SEO baked in from day one",
    span: "wide",
  },
  {
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80",
    alt: "Analytics dashboard on screen",
    caption: "Built to be measured — and to convert",
    span: "tall",
  },
];

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

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3 p-3">
          {PHOTOS.map((p, i) => {
            const span =
              p.span === "tall"
                ? "row-span-2"
                : p.span === "wide"
                ? "col-span-2"
                : "";
            return (
              <motion.figure
                key={p.src}
                className={`group relative overflow-hidden ${span}`}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                }}
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.85,
                  delay: i * 0.06,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
                data-cursor="hover"
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
                  style={{
                    filter: "grayscale(0.3) contrast(1.05) brightness(0.85)",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(8,8,8,0) 40%, rgba(8,8,8,0.85) 100%)",
                  }}
                />
                <figcaption
                  className="absolute bottom-0 left-0 right-0 p-4 md:p-5 text-xs md:text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  <span
                    className="inline-block mr-2 align-middle"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#b0ff00",
                    }}
                  />
                  {p.caption}
                </figcaption>
              </motion.figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
