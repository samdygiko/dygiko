"use client";

const items = [
  "Live in 2 days",
  "Built to be found",
  "From £500",
  "Honest pricing",
  "Custom CRM",
  "Built to last",
  "iOS & Android Apps",
  "Fully managed",
  "Google Business Profile",
  "UK-based",
];

export default function ClientMarquee() {
  // triple for a seamless loop (track translates by exactly 1/3 of its width)
  const tripled = [...items, ...items, ...items];

  return (
    <section
      className="overflow-hidden border-y"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      aria-label="Recent client sites"
    >
      <div className="marquee-track flex items-center py-8 md:py-10" style={{ width: "max-content" }}>
        {tripled.map((item, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span
              className="font-heading font-black tracking-tight px-8 md:px-12 whitespace-nowrap"
              style={{
                fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "-0.02em",
              }}
            >
              {item}
            </span>
            <span
              className="shrink-0"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(176,255,0,0.35)",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
