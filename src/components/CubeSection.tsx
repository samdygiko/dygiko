"use client";

import dynamic from "next/dynamic";
import Reveal from "./Reveal";

const PixelCube = dynamic(() => import("./PixelCube"), {
  ssr: false,
  loading: () => null,
});

export default function CubeSection() {
  return (
    <section
      className="border-b relative overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="cube"
    >
      <div className="max-w-7xl mx-auto px-8 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <p
              className="text-xs uppercase tracking-[0.2em] mb-4"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              How we build
            </p>
            <h2
              className="font-heading font-black tracking-tight"
              style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05 }}
            >
              Pixel-by-pixel,
              <br />
              by hand.
            </h2>
            <p
              className="mt-6 max-w-md text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              No two systems we ship look the same. Every layout, animation and
              detail is built from scratch — so your business stops looking like
              everyone else's template.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex items-center justify-center">
              <PixelCube />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
