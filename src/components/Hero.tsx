"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ─── Animated pixel grid canvas ─────────────────────────────────────────── */
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CELL = 18;
    const GAP = 1;
    const STEP = CELL + GAP;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    // Per-cell animation parameters
    type Cell = { base: number; phase: number; speed: number };
    let cells: Cell[] = [];

    const init = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      cols = Math.ceil(width / STEP);
      rows = Math.ceil(height / STEP);
      cells = [];
      for (let i = 0; i < cols * rows; i++) {
        cells.push({
          base: Math.random(),          // base brightness 0–1
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.8, // radians/second
        });
      }
    };

    let rafId: number;
    const draw = (ts: number) => {
      const t = ts / 1000;
      ctx.clearRect(0, 0, width, height);

      for (let r = 0; r < rows; r++) {
        const yFrac = r / rows;
        const yFade = Math.max(0, 1 - yFrac / 0.72);
        if (yFade < 0.005) continue;

        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c];
          // Pulse: oscillates between 30% and 100% of base
          const pulse = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * cell.speed + cell.phase));
          const opacity = cell.base * 0.22 * yFade * pulse;
          if (opacity < 0.004) continue;

          ctx.fillStyle = `rgba(176,255,0,${opacity.toFixed(3)})`;
          ctx.fillRect(c * STEP, r * STEP, CELL, CELL);
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      init();
    });
    ro.observe(canvas);
    init();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="canvas-fade absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

/* ─── Hero section ───────────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      id="hero"
    >
      <HeroCanvas />

      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #080808)" }}
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

        {/* Headline */}
        <motion.h1
          className="font-heading font-black tracking-tight leading-[1.0] mb-8"
          style={{ fontSize: "clamp(3rem, 8vw, 7.5rem)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Your business,
          <br />
          finally online.
        </motion.h1>

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
          <a
            href="#services"
            className="inline-flex items-center px-7 py-3.5 text-sm font-semibold text-black rounded-sm transition-opacity duration-200 hover:opacity-80"
            style={{ background: "#b0ff00" }}
          >
            Get started →
          </a>
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
