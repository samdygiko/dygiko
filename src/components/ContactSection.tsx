"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type FormState = "idle" | "loading" | "success" | "error";

export default function ContactSection() {
  const [state, setState] = useState<FormState>("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessType: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setState("success");
      setForm({ name: "", email: "", phone: "", businessType: "", message: "" });
    } catch {
      setState("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 0,
    color: "#ffffff",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    width: "100%",
    padding: "0.75rem 0",
    fontSize: "0.9375rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "rgba(255,255,255,0.35)",
    marginBottom: "0.25rem",
  };

  return (
    <section
      className="py-24 md:py-32 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="contact"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.75 }}
          >
            <p
              className="text-xs uppercase tracking-[0.2em] mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Get in touch
            </p>
            <h2
              className="font-heading font-black tracking-tight mb-6"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
            >
              Let&apos;s build
              <br />
              something.
            </h2>
            <p
              className="text-base leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.45)", maxWidth: "38ch" }}
            >
              Tell us about your business and what you need. We&apos;ll get back to you
              within a few hours.
            </p>

            {/* Contact details */}
            <div className="flex flex-col gap-4">
              <a
                href="mailto:sam@dygiko.com"
                className="flex items-center gap-3 text-sm transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
                sam@dygiko.com
              </a>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, delay: 0.15 }}
          >
            {state === "success" ? (
              <div
                className="flex flex-col items-start gap-4 p-8 rounded-sm"
                style={{ border: "1px solid rgba(176,255,0,0.3)", background: "rgba(176,255,0,0.04)" }}
              >
                <span style={{ color: "#b0ff00", fontSize: 32 }}>✓</span>
                <h3 className="font-heading font-bold text-2xl tracking-tight">
                  Message sent!
                </h3>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  We&apos;ll get back to you at{" "}
                  <span className="text-white">{form.email || "your email"}</span> within a few hours.
                </p>
                <button
                  onClick={() => setState("idle")}
                  className="text-sm mt-2 transition-colors duration-200"
                  style={{ color: "#b0ff00" }}
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="cf-name" style={labelStyle}>Name</label>
                    <input
                      id="cf-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="cf-email" style={labelStyle}>Email</label>
                    <input
                      id="cf-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="cf-phone" style={labelStyle}>Phone</label>
                    <input
                      id="cf-phone"
                      name="phone"
                      type="tel"
                      placeholder="07700 000 000"
                      value={form.phone}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="cf-business" style={labelStyle}>Business type</label>
                    <input
                      id="cf-business"
                      name="businessType"
                      type="text"
                      placeholder="e.g. Plumber, Hair Salon"
                      value={form.businessType}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cf-message" style={labelStyle}>Message</label>
                  <textarea
                    id="cf-message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us about your business and what you need..."
                    value={form.message}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      resize: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                </div>

                {state === "error" && (
                  <p className="text-sm" style={{ color: "#ff6b6b" }}>
                    Something went wrong. Please email us directly at sam@dygiko.com
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold text-black rounded-sm transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
                  style={{ background: "#b0ff00", alignSelf: "flex-start" }}
                >
                  {state === "loading" ? "Sending..." : "Send message →"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
