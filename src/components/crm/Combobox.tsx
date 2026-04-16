"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  allowFreeText?: boolean;
};

export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  allowFreeText = false,
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [close]);

  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.querySelector(`[data-idx="${highlighted}"]`) as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
      if (!open) setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) {
        select(filtered[highlighted]);
      } else if (allowFreeText) {
        onChange(query);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlighted(0);
          setOpen(true);
          if (allowFreeText) onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!allowFreeText && !options.includes(query)) {
            setQuery(value);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            zIndex: 200,
            background: "#111",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "2px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filtered.map((opt, i) => (
            <div
              key={opt}
              data-idx={i}
              onMouseDown={() => select(opt)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: "7px 12px",
                fontSize: "13px",
                cursor: "pointer",
                background:
                  i === highlighted ? "rgba(176,255,0,0.1)" : "transparent",
                color:
                  i === highlighted
                    ? "#b0ff00"
                    : "rgba(255,255,255,0.7)",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
