"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Tell us about your business",
    desc: "Fill in a short form about your business, your customers, and what you need. No lengthy briefs, no jargon — just the basics.",
  },
  {
    num: "02",
    title: "We design your website",
    desc: "Our designers get to work building a custom, mobile-first site tailored to your industry. You'll see the design before anything goes live.",
  },
  {
    num: "03",
    title: "Review and approve",
    desc: "You get a live preview to review at your own pace. We make revisions until you're completely happy with every detail.",
  },
  {
    num: "04",
    title: "Go live in 2 days",
    desc: "Once you approve, we launch your site, set up your domain, configure SEO, and make sure everything runs perfectly.",
  },
];

/* ─── Interactive particle canvas ────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let mouseX = -9999, mouseY = -9999;
    const N = 80;
    const CONNECT_DIST = 130;
    const MOUSE_DIST = 160;
    const MOUSE_FORCE = 0.55;
    const MAX_SPEED = 2.2;

    type Particle = { x: number; y: number; vx: number; vy: number; size: number };
    let particles: Particle[] = [];

    const init = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1.2 + Math.random() * 1.4,
      }));
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouseX = -9999; mouseY = -9999; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST && dist > 0) {
          const force = ((MOUSE_DIST - dist) / MOUSE_DIST) * MOUSE_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        // Damping
        p.vx *= 0.97;
        p.vy *= 0.97;
        // Cap speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) { p.vx = (p.vx / speed) * MAX_SPEED; p.vy = (p.vy / speed) * MAX_SPEED; }
        p.x += p.vx;
        p.y += p.vy;
        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fill();
      }

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${((1 - d / CONNECT_DIST) * 0.18).toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => init());
    ro.observe(canvas);
    init();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

export default function HowItWorksSection() {
  return (
    <section
      className="relative overflow-hidden py-32"
      style={{ background: "#0a0a0a" }}
      id="process"
    >
      <ParticleCanvas />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75 }}
        >
          <p
            className="text-xs uppercase tracking-[0.2em] mb-5"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Process
          </p>
          <h2
            className="font-heading font-black tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
          >
            Simple from start to live
          </h2>
        </motion.div>

        <div>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="flex items-start gap-8 md:gap-16 py-10 border-b last:border-b-0"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <span
                className="text-sm font-mono w-8 shrink-0 pt-1"
                style={{ color: "#b0ff00" }}
              >
                {step.num}
              </span>
              <div className="flex flex-col md:flex-row md:items-start md:gap-16 flex-1 min-w-0">
                <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-tight mb-3 md:mb-0 md:w-80 shrink-0">
                  {step.title}
                </h3>
                <p
                  className="text-sm md:text-base leading-relaxed max-w-lg"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
