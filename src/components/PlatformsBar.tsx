"use client";

import { motion } from "framer-motion";

const PLATFORMS = [
  "Web",
  "iOS",
  "Android",
  "macOS",
  "Windows",
  "SEO",
  "Google Business",
  "CRM",
  "Booking Systems",
  "Contact Forms",
];

export default function PlatformsBar() {
  return (
    <section
      className="py-16 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="platforms"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.p
          className="text-xs uppercase tracking-[0.2em] text-center mb-8"
          style={{ color: "rgba(255,255,255,0.25)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          Platforms &amp; capabilities
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-2.5"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {PLATFORMS.map((platform) => (
            <span
              key={platform}
              className="platform-tag px-4 py-1.5 text-sm rounded-sm"
            >
              {platform}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
