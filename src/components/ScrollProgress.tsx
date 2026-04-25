"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] origin-left"
      style={{
        height: 2,
        background: "linear-gradient(90deg, rgba(176,255,0,0.6), #b0ff00)",
        scaleX,
        boxShadow: "0 0 12px rgba(176,255,0,0.45)",
      }}
    />
  );
}
