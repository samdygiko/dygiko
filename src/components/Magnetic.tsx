"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  strength?: number;
  className?: string;
};

export default function Magnetic({ children, strength = 0.28, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setPos({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength });
    };
    const onLeave = () => setPos({ x: 0, y: 0 });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  const isResting = pos.x === 0 && pos.y === 0;

  return (
    <span
      ref={ref}
      className={`inline-block ${className}`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: isResting
          ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 0.18s ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </span>
  );
}
