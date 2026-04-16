"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function FooterCTA() {
  const year = new Date().getFullYear();
  const isHome = usePathname() === "/";
  const p = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <footer id="footer">
      {/* CTA Block */}
      <div
        className="py-32 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          <motion.p
            className="text-xs uppercase tracking-[0.2em] mb-8"
            style={{ color: "rgba(255,255,255,0.3)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
          >
            Get started
          </motion.p>

          <motion.h2
            className="font-heading font-black tracking-tight leading-[1.0] mb-12"
            style={{ fontSize: "clamp(2.8rem, 8vw, 7rem)" }}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Ready to get
            <br />
            found online?
          </motion.h2>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <a
              href={p("#contact")}
              className="inline-flex items-center px-8 py-4 text-sm font-semibold text-black rounded-sm transition-opacity duration-200 hover:opacity-80"
              style={{ background: "#b0ff00" }}
            >
              Start your project →
            </a>
            <a
              href={p("#work")}
              className="inline-flex items-center px-8 py-4 text-sm font-medium rounded-sm transition-colors duration-200"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              View our work
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          © {year} dygi<span style={{ color: "#b0ff00" }}>ko</span>. All rights reserved.
        </span>

        {/* Trustpilot */}
        <a
          href="https://au.trustpilot.com/review/dygiko.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm transition-opacity duration-200 hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#00b67a">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          Review us on Trustpilot
        </a>

        <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          <a
            href="https://www.linkedin.com/company/dygiko/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dygiko on LinkedIn"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors duration-200"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
          <a href="/privacy" className="hover:text-white transition-colors duration-200">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white transition-colors duration-200">
            Terms
          </a>
          <a href={p("#contact")} className="hover:text-white transition-colors duration-200">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
