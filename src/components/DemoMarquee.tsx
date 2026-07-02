"use client";

// Auto-scrolling marquee of live CRM systems, shown on the homepage. Each card
// is a scaled-down live iframe of the real demo, and the whole strip scrolls
// slowly + loops seamlessly (cards are duplicated once).

const DEMOS: { label: string; url: string }[] = [
  { label: "Electrician CRM", url: "https://electrician-crm.vercel.app" },
  { label: "Construction CRM", url: "https://construction-crm.vercel.app" },
  { label: "Dental CRM", url: "https://dental-crm.vercel.app" },
];

function DemoCard({ label, url }: { label: string; url: string }) {
  const domain = url.replace("https://", "");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        width: 360,
        flex: "0 0 auto",
        borderRadius: 14,
        overflow: "hidden",
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.1)",
        textDecoration: "none",
      }}
    >
      {/* Browser chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ display: "flex", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Arial, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{domain}</span>
      </div>
      {/* Scaled live preview */}
      <div style={{ position: "relative", width: 360, height: 225, overflow: "hidden", background: "#080808" }}>
        <iframe
          src={url}
          title={label + " demo"}
          width={1280}
          height={800}
          loading="lazy"
          scrolling="no"
          style={{ border: 0, transform: "scale(0.281)", transformOrigin: "top left", pointerEvents: "none" }}
        />
      </div>
      {/* Label bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", fontFamily: "Arial, sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#b0ff00", fontFamily: "Arial, sans-serif" }}>View live →</span>
      </div>
    </a>
  );
}

export default function DemoMarquee() {
  const cards = [...DEMOS, ...DEMOS]; // duplicate for seamless loop
  return (
    <section
      id="demos"
      className="border-b"
      style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)", padding: "80px 0", overflow: "hidden" }}
    >
      <div style={{ textAlign: "center", marginBottom: 44, padding: "0 24px" }}>
        <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Live systems
        </p>
        <h2
          className="font-heading font-black tracking-tight"
          style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, color: "#ffffff" }}
        >
          Systems we&apos;ve built
        </h2>
      </div>
      <div className="dyg-marquee-wrap" style={{ width: "100%", overflow: "hidden" }}>
        <div className="dyg-marquee-track">
          {cards.map((d, i) => (
            <DemoCard key={i} label={d.label} url={d.url} />
          ))}
        </div>
      </div>
      <p className="text-center mt-12 px-6 mx-auto" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 640, fontSize: "1rem", lineHeight: 1.6 }}>
        Every system is custom — designed and built to run your business, not just look good.
      </p>
    </section>
  );
}
