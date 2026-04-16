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
              <a
                href="https://wa.me/447723396306"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp: 07723 396 306
              </a>
              {/* Trustpilot */}
              <a
                href="https://au.trustpilot.com/review/dygiko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm transition-opacity duration-200 hover:opacity-80 mt-2"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#00b67a"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                Review us on Trustpilot
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
