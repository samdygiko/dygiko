"use client";

// Auto-scrolling marquee of live CRM systems, shown on the homepage. Each card
// is a scaled-down live iframe of the real demo, and the whole strip scrolls
// slowly + loops seamlessly (cards are duplicated once).

type Demo = { label: string; url: string };

const SYSTEMS: Demo[] = [
  { label: "Electrician", url: "https://voltix-crm.vercel.app" },
  { label: "Construction", url: "https://marsden-crm.vercel.app" },
  { label: "Dental", url: "https://brightwater-crm.vercel.app" },
  { label: "Barber", url: "https://blendsmith-crm.vercel.app" },
  { label: "Hair salon", url: "https://lumiere-crm-two.vercel.app" },
  { label: "Beauty salon", url: "https://velora-crm-beta.vercel.app" },
  { label: "Tailor", url: "https://ashcroft-crm.vercel.app" },
  { label: "Recording studio", url: "https://basswood-crm.vercel.app" },
  { label: "Architect", url: "https://halden-crm.vercel.app" },
  { label: "Hotel", url: "https://ellison-crm.vercel.app" },
  { label: "Pet store", url: "https://barkwell-crm.vercel.app" },
  { label: "Pub", url: "https://oakwell-crm.vercel.app" },
  { label: "Restaurant", url: "https://sorrel-crm.vercel.app" },
  { label: "Caf\u00e9", url: "https://fernwood-crm.vercel.app" },
  { label: "Internet caf\u00e9", url: "https://pixelpoint-crm.vercel.app" },
  { label: "Phone repair", url: "https://fonefix-crm.vercel.app" },
];

const SITES: Demo[] = [
  { label: "Electrician", url: "https://voltix-web-mocha.vercel.app" },
  { label: "Construction", url: "https://marsden-web.vercel.app" },
  { label: "Dental", url: "https://brightwater-web.vercel.app" },
  { label: "Barber", url: "https://blendsmith-web.vercel.app" },
  { label: "Hair salon", url: "https://lumiere-web-theta.vercel.app" },
  { label: "Beauty salon", url: "https://velora-web-self.vercel.app" },
  { label: "Tailor", url: "https://ashcroft-web.vercel.app" },
  { label: "Recording studio", url: "https://basswood-web.vercel.app" },
  { label: "Architect", url: "https://halden-web.vercel.app" },
  { label: "Hotel", url: "https://ellison-web.vercel.app" },
  { label: "Pet store", url: "https://barkwell-web.vercel.app" },
  { label: "Pub", url: "https://oakwell-web.vercel.app" },
  { label: "Restaurant", url: "https://sorrel-web-lac.vercel.app" },
  { label: "Caf\u00e9", url: "https://fernwood-web.vercel.app" },
  { label: "Internet caf\u00e9", url: "https://pixelpoint-web.vercel.app" },
  { label: "Phone repair", url: "https://fonefix-web.vercel.app" },
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

function Row({ items, label, reverse }: { items: Demo[]; label: string; reverse?: boolean }) {
  const cards = [...items, ...items]; // duplicated for a seamless loop
  return (
    <div style={{ marginBottom: reverse ? 0 : 40 }}>
      <p style={{ textAlign: "center", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
        {label}
      </p>
      <div className="dyg-marquee-wrap" style={{ width: "100%", overflow: "hidden" }}>
        <div className={`dyg-marquee-track${reverse ? " dyg-marquee-reverse" : ""}`}>
          {cards.map((d, i) => (
            <DemoCard key={i} label={d.label} url={d.url} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoMarquee() {
  return (
    <section
      id="demos"
      className="border-b"
      style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)", padding: "80px 0", overflow: "hidden" }}
    >
      <div style={{ textAlign: "center", marginBottom: 44, padding: "0 24px" }}>
        <h2
          className="font-heading font-black tracking-tight"
          style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", lineHeight: 1.05, color: "#ffffff" }}
        >
          Demo systems
        </h2>
      </div>
      <Row items={SYSTEMS} label="Operations systems" />
      <Row items={SITES} label="Websites" reverse />
    </section>
  );
}
