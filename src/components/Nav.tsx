"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DygikoLogo from "@/components/DygikoLogo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const p = (hash: string) => (isHome ? hash : `/${hash}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks: [string, string][] = [
    ["Work", p("#work")],
    ["Services", p("#services")],
    ["About", p("#about")],
    ["Blog", "/blog"],
    ["Contact", p("#contact")],
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080808]/90 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <DygikoLogo iconSize={22} />
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm text-white/60">
          {navLinks.map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                className="hover:text-white transition-colors duration-200"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/company/dygiko/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dygiko on LinkedIn"
            className="hidden md:inline-flex items-center transition-opacity duration-200 hover:opacity-60"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a
            href={p("#contact")}
            className="hidden md:inline-flex items-center px-5 py-2 text-sm font-medium rounded-sm text-black transition-opacity duration-200 hover:opacity-80"
            style={{ background: "#b0ff00" }}
          >
            Get a site
          </a>

          <button
            className="md:hidden flex flex-col gap-1.5 w-6"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-72 border-b border-white/[0.06]" : "max-h-0"
        } bg-[#080808]/95 backdrop-blur-md`}
      >
        <ul className="px-6 py-4 flex flex-col gap-4 text-sm text-white/60">
          {navLinks.map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                onClick={() => setMenuOpen(false)}
                className="hover:text-white transition-colors duration-200 block"
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={p("#contact")}
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-sm text-black"
              style={{ background: "#b0ff00" }}
            >
              Get a site
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
