"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

const TAGS = [
  "Plumber",
  "Hair Salon",
  "Takeaway",
  "Dog Groomer",
  "Electrician",
  "Barber",
];

export default function SearchSection() {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fillTag = (tag: string) => {
    setValue(tag);
    inputRef.current?.focus();
  };

  return (
    <section
      className="py-24 md:py-32 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      id="search"
    >
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75 }}
        >
          <p
            className="text-xs uppercase tracking-[0.2em] mb-6"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Find your fit
          </p>

          <label htmlFor="business-search" className="sr-only">
            Search your business type
          </label>
          <input
            ref={inputRef}
            id="business-search"
            type="text"
            className="search-input"
            placeholder="e.g. plumber, hair salon, café..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2.5 mt-6">
            {TAGS.map((tag, i) => (
              <motion.button
                key={tag}
                onClick={() => fillTag(tag)}
                className="px-4 py-1.5 text-sm rounded-sm transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color:
                    value === tag
                      ? "#080808"
                      : "rgba(255,255,255,0.5)",
                  background: value === tag ? "#b0ff00" : "transparent",
                  borderColor:
                    value === tag ? "#b0ff00" : "rgba(255,255,255,0.1)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                {tag}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
