"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Stat = {
  target: number;
  label: string;
  formatted: (n: number) => string;
};

const STATS: Stat[] = [
  {
    target: 40,
    label: "of UK trades have no website — missing customers every day",
    formatted: (n) => `${n}%`,
  },
  {
    target: 2,
    label: "days average site delivery — from payment to live",
    formatted: (n) => `${n} days`,
  },
];

function CountUp({ stat, shouldStart }: { stat: Stat; shouldStart: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    const duration = 1800;
    const start = performance.now();
    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * stat.target));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [stat.target, shouldStart]);

  return (
    <span
      className="font-heading font-black tracking-tight"
      style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1 }}
    >
      {stat.formatted(count)}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="stats"
      ref={ref}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              className="flex flex-col gap-4 px-8 py-16"
              style={{
                borderRight:
                  i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                borderBottom:
                  i < STATS.length - 1 && typeof window !== "undefined" && window.innerWidth < 768
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <CountUp stat={stat} shouldStart={inView} />
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.35)", maxWidth: "18ch" }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
