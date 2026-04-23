"use client";

import { useState } from "react";

const AESTHETICS = [
  "brutalist editorial — raw grid, heavy borders, no softness",
  "Scandinavian minimal — extreme whitespace, one accent colour, serif headline",
  "dark cinematic — near-black background, dramatic lighting metaphors in layout",
  "art deco geometric — structured symmetry, gold accents, decorative rules",
  "Swiss modernist — tight grid, strong hierarchy, no decoration",
  "luxury fashion — oversized type, black and cream, slow reveal",
  "industrial utilitarian — monospace type, technical feel, muted palette",
  "editorial magazine — asymmetric columns, pull quotes, strong section numbers",
  "organic natural — earthy tones, soft curves in layout, handcrafted feel",
  "retro British — warm nostalgic palette, serif type, timeless not trendy",
  "Japanese minimalist — extreme restraint, negative space as a design element",
  "brutalist web — raw HTML energy, visible structure, intentionally stark",
  "Memphis design — bold shapes, clashing colours, playful geometry",
  "gothic editorial — dark romance, blackletter influences, dramatic contrast",
  "coastal luxury — bleached tones, nautical geometry, understated wealth",
  "tech startup — clean data-driven layout, monospace accents, precision",
  "maximalist pattern — rich texture, layered elements, controlled chaos",
  "1970s retrofuturism — warm browns, rounded type, optimistic retro",
  "hyper-minimal — one font, one colour, nothing else, pure function",
  "architectural — structural grid exposed, blueprint-like precision",
  "Bauhaus — geometric shapes, primary colours, function over form",
  "Victorian gothic — ornate details, deep jewel tones, dramatic type",
  "cyberpunk — neon on dark, glitch effects, tech dystopia energy",
  "preppy classic — navy and white, clean lines, old money confidence",
  "wabi-sabi — imperfect textures, muted nature tones, quiet beauty",
  "haute couture — ultra thin type, vast white space, fashion week energy",
  "Soviet constructivist — bold diagonals, red and black, propaganda poster energy",
  "Californian organic — warm sand tones, laid back spacing, wellness feel",
  "dark academia — leather tones, serif type, candlelit atmosphere",
  "Y2K revival — chrome, gradients done intentionally, early internet nostalgia",
  "Mediterranean — terracotta, whitewash, sun-bleached warmth",
  "brutalist Swiss — extreme grid discipline, red accents, Helvetica energy",
  "neon noir — dark background, electric colour pops, moody atmosphere",
  "Japandi — Japanese meets Scandinavian, ultra calm, natural materials feel",
  "archival — aged paper tones, stamp motifs, document-like precision",
  "kinetic typography — type is the hero, layout built entirely around words",
  "deconstructed — elements intentionally misaligned, rules deliberately broken",
  "corporate luxe — dark navy suits energy, gold details, serious wealth",
  "raw concrete — brutalist material palette, grey dominance, industrial strength",
  "maximalist botanical — rich greens, illustrated details, lush abundance",
];

const FONT_PAIRS = [
  "Playfair Display + DM Sans",
  "Cormorant Garamond + Inter",
  "Bebas Neue + Barlow",
  "Syne + Manrope",
  "Unbounded + DM Sans",
  "DM Serif Display + DM Sans",
  "Rajdhani + Inter",
  "Fraunces + Epilogue",
  "Oswald + Source Sans Pro",
  "Libre Baskerville + Nunito Sans",
  "Bodoni Moda + Jost",
  "Anton + Roboto",
  "Instrument Serif + Instrument Sans",
  "Array + Space Mono",
  "Abril Fatface + Lato",
  "Rufina + Sintony",
  "Tenor Sans + Raleway",
  "Yeseva One + Josefin Sans",
  "Rozha One + Karla",
  "Cardo + Cabin",
  "Fjalla One + Cantarell",
  "Raleway + Merriweather",
  "Arvo + Lato",
  "Josefin Slab + Josefin Sans",
  "Teko + Hind",
  "Exo 2 + Roboto Condensed",
  "Righteous + Raleway",
  "Alfa Slab One + Gentium Book Basic",
  "Titillium Web + Source Sans Pro",
  "Cinzel + Fauna One",
  "Sorts Mill Goudy + Raleway",
  "Philosopher + Muli",
  "Pacifico + Arimo",
  "Lobster + Cabin",
  "Rokkitt + Sintony",
  "Questrial + Crimson Text",
  "Glegoo + Ubuntu",
  "Hammersmith One + Averia Serif Libre",
  "Vidaloka + Roboto",
  "Patua One + Merriweather Sans",
];

type Palette = { name: string; bg: string; accent: string };

const PALETTES: Palette[] = [
  { name: "Forest & Cream", bg: "#F7F5F0", accent: "#2D4A35" },
  { name: "Navy & Stone", bg: "#FAFAF8", accent: "#1C3A5E" },
  { name: "Onyx & Gold", bg: "#0D0D0D", accent: "#C8A96E" },
  { name: "Rust & Chalk", bg: "#FAF8F4", accent: "#8B3A2A" },
  { name: "Graphite & Lime", bg: "#111111", accent: "#B5E834" },
  { name: "Bone & Burgundy", bg: "#F5F0E8", accent: "#6B1E2F" },
  { name: "Carbon & Electric Blue", bg: "#0A0A0A", accent: "#1565C0" },
  { name: "Sand & Charcoal", bg: "#F2EDE4", accent: "#2C2C2C" },
  { name: "Sage & Linen", bg: "#F8F6F1", accent: "#4A6741" },
  { name: "Pitch Black & Red", bg: "#080808", accent: "#CC2200" },
  { name: "Ivory & Cobalt", bg: "#FDFBF5", accent: "#1A3BCC" },
  { name: "Warm Grey & Terracotta", bg: "#F0EBE3", accent: "#C4622D" },
  { name: "Deep Teal & Cream", bg: "#0D2B2B", accent: "#F5F0E4" },
  { name: "Midnight & Copper", bg: "#0A0A12", accent: "#B87333" },
  { name: "Bleached & Black", bg: "#FAFAFA", accent: "#0A0A0A" },
  { name: "Parchment & Forest", bg: "#EDE8DC", accent: "#1E3A2A" },
  { name: "Steel & Orange", bg: "#1A1A22", accent: "#E8621A" },
  { name: "Rose & Slate", bg: "#FDF4F0", accent: "#3A4A58" },
  { name: "Concrete & Yellow", bg: "#E8E6E0", accent: "#D4A017" },
  { name: "Chalk & Violet", bg: "#F8F7FF", accent: "#5C2D91" },
  { name: "Obsidian & Emerald", bg: "#090909", accent: "#1A6B3C" },
  { name: "Warm White & Ink", bg: "#FEFCF8", accent: "#1A1A2E" },
  { name: "Dusk & Blush", bg: "#1C1018", accent: "#E8A0A0" },
  { name: "Arctic & Pine", bg: "#F4F8F6", accent: "#1D4030" },
  { name: "Caramel & Black", bg: "#F5E6CC", accent: "#111111" },
  { name: "Pewter & Cream", bg: "#3A3A3A", accent: "#F5F0E4" },
  { name: "Electric & Dark", bg: "#0D0D0D", accent: "#00E5FF" },
  { name: "Ochre & White", bg: "#FAF6EE", accent: "#C68B2A" },
  { name: "Plum & Gold", bg: "#1A0A1E", accent: "#D4AF37" },
  { name: "Fog & Rust", bg: "#EEEAE4", accent: "#8B4513" },
  { name: "Charcoal & Mint", bg: "#1E1E1E", accent: "#3EB489" },
  { name: "Ash & Scarlet", bg: "#F2F0EE", accent: "#B22222" },
  { name: "Deep Blue & Sand", bg: "#0A1628", accent: "#E8D5A3" },
  { name: "Warm Black & Peach", bg: "#111008", accent: "#FFAA80" },
  { name: "Stone & Teal", bg: "#EAE6DF", accent: "#00695C" },
  { name: "Cream & Chocolate", bg: "#FBF8F2", accent: "#3E1C00" },
  { name: "Silver & Navy", bg: "#F0F2F5", accent: "#0A1F44" },
  { name: "Khaki & Black", bg: "#EDE8DC", accent: "#1A1A1A" },
  { name: "Dusty Rose & Charcoal", bg: "#F9F0EE", accent: "#2C2C2C" },
  { name: "Bone & Electric Green", bg: "#F5F2EC", accent: "#00CC44" },
];

const LAYOUTS = [
  "asymmetric split hero — large left headline, tall right image, no centering",
  "full-bleed typographic hero — oversized headline fills the screen, image behind",
  "diagonal slash motif — sections divided by angled cuts not horizontal rules",
  "editorial column layout — narrow text column left, wide image right throughout",
  "horizontal scroll sections — services scroll sideways not vertically",
  "large section numbers — 01, 02, 03 anchoring every section visually",
  "sticky side navigation — section titles fixed on left as you scroll",
  "full viewport sections — each section is exactly 100vh, no overflow",
  "grid-breaking overlap — images and text overlap section boundaries",
  "magazine spread — two-column editorial with pull quotes and ruled lines",
  "hero with oversized single word — one massive word behind smaller headline",
  "bento grid layout — unequal boxes of varying sizes like a dashboard",
  "stacked fullscreen slides — sections snap into place as you scroll",
  "sidebar layout — persistent left column, scrolling right content",
  "centered typographic — pure type-led, no images in hero, bold statement only",
  "timeline layout — content flows along a visible vertical or horizontal axis",
  "immersive dark hero — full screen dark image, text floats over it",
  "split screen alternating — image and text swap sides every section",
  "newspaper broadsheet — dense columns, rules, old print energy",
  "oversized margins — content sits in a narrow central column with vast margins",
  "full bleed image sections — every section has an edge to edge background image",
  "modular grid — strict equal modules, content snaps to the grid",
  "staggered cards — content blocks offset diagonally down the page",
  "hero with video loop — muted background video behind headline",
  "floating elements — text and images positioned freely, not in rows",
  "Z-pattern layout — content alternates to follow natural eye movement",
  "long-form editorial — single column long read format, like an article",
  "hero with stats bar — headline then immediate row of 3-4 key numbers",
  "overlapping layers — elements sit on top of each other with depth",
  "full screen menu — navigation takes over full screen when opened",
  "pin and scroll — element stays fixed while content scrolls past it",
  "split hero 50/50 — screen divided exactly in half, text one side image other",
  "radial layout — elements arranged around a central focal point",
  "ticker tape hero — scrolling text replaces static headline",
  "one page sections — everything on one page, no sub pages",
  "card wall — masonry grid of content blocks as the main layout",
  "text as texture — large type used as background pattern",
  "asymmetric footer — footer breaks out of standard 4-column pattern",
  "hero with marquee — headline above a continuously scrolling text strip",
  "brutalist stack — content just stacked with no padding, wall to wall",
];

const SPECIAL_FEATURES = [
  "continuous marquee strip of keywords or stats",
  "cursor that changes colour or shape on CTA hover",
  "staggered text reveal on page load word by word",
  "parallax image that follows mouse cursor subtly",
  "counter animation — stats count up from zero on scroll",
  "sticky CTA bar that appears after scrolling past hero",
  "before/after image slider",
  "testimonial ticker that auto-scrolls horizontally",
  "section background that shifts colour as you scroll",
  "smooth inertia scroll effect",
  "magnetic buttons that pull toward cursor",
  "text that scrambles then resolves on hover",
  "image zoom on scroll within a fixed container",
  "horizontal pinned scroll section",
  "split text animation — headline splits apart on load",
  "noise/grain texture overlay on all backgrounds",
  "spotlight effect that follows cursor in dark sections",
  "progress bar at top of page showing scroll position",
  "accordion sections that expand with smooth animation",
  "video background on mute in hero section",
  "typewriter effect on hero headline",
  "parallax depth on hero — foreground and background move at different speeds",
  "image reveal on scroll — image wipes in as you scroll down",
  "floating nav that appears only on scroll up",
  "number ticker — phone number or stat animates in digit by digit",
  "tilt effect on cards — elements tilt subtly toward mouse",
  "section transition wipe — colour wipes across screen between sections",
  "blurred background that sharpens on scroll",
  "text outline style — headlines are stroke only, no fill",
  "scroll progress indicator along side of page",
  "hover image preview — hovering a service name shows an image",
  "sticky section headers — each section title sticks to top while in view",
  "elastic scroll — page has a spring bounce at top and bottom",
  "diagonal scrolling — page scrolls at a slight angle",
  "word by word highlight — as you scroll, words light up one at a time",
  "full page preloader — branded loading screen before site appears",
  "cursor trail effect — cursor leaves a fading trail",
  "image distortion on hover — images warp or ripple on mouse over",
  "parallax text layers — multiple text layers move at different scroll speeds",
  "3D card flip — service cards flip to reveal detail on hover",
];

const ANTI_PATTERNS = [
  "No rounded corners on anything",
  "No box shadows",
  "No gradient backgrounds",
  "No icon + heading + paragraph card grids",
  "No scroll-triggered fade-in on every element",
  "No glassmorphism",
  "No Tailwind default spacing or card styles",
  "No centered hero text",
  "No generic stock photo placeholders",
  "No purple or blue gradients",
  "No hero with subheading starting with Welcome to",
  "No three-column feature grids",
  "No floating chat bubble widgets",
  "No hero CTA with two buttons side by side",
  "No footer with 4 equal columns",
  "No section that is just a logo parade on white",
  "No testimonial cards in a 3-column grid",
  "No full-width coloured banner with white centered text",
  "No navbar with dropdown mega menus",
  "No cookie banner taking up half the screen",
  "No stock illustration of people shaking hands",
  "No animated counting numbers in a grey section",
  "No blue hyperlinks that look like default browser styling",
  "No section with a zigzag divider between colours",
  "No hero with a background image that has a dark overlay and white text",
  "No use of the words innovative, cutting-edge or solutions",
  "No auto-playing carousel or slider in the hero",
  "No sticky header that changes size on scroll",
  "No contact form with a grey background section",
  "No social media icon strip in the footer",
  "No timeline with alternating left-right boxes",
  "No pricing table with a highlighted middle column",
  "No FAQ section with plus/minus accordion icons",
  "No team section with circular profile photos",
  "No before/after using a generic split line",
  "No parallax hero that just moves a stock photo slowly",
  "No section titles that are centered with a coloured underline",
  "No bullet point lists styled as green tick checkmarks",
  "No about section that starts with the word We",
  "No map embed in the contact section",
];

const IMAGES_BLOCK = `IMAGES: Source high quality real images from the best available free image source (Unsplash, Pexels, Picsum, or any reliable CDN) using search terms that are highly specific to this business type and aesthetic. Every image must look intentional and relevant — not generic. Use different search terms for each image so they don't all look the same. Place images generously throughout: hero, full-bleed section, gallery/masonry grid, and any other natural locations. Never use placeholder divs, grey boxes, or lorem ipsum images. If real photos of the business are later provided, the image tags should be easy to swap out.`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

type GeneratedParts = {
  aesthetic: string;
  fontPair: string;
  palette: Palette;
  layout: string;
  features: string[];
  antiPatterns: string[];
};

function buildPrompt(businessName: string, phone: string, extras: string, p: GeneratedParts): string {
  const biz = businessName.trim() || "[Business name]";
  const phoneLine = phone.trim() ? `\nPhone: ${phone.trim()}` : "";
  const extrasBlock = extras.trim() ? `\n\nEXTRA DETAILS:\n${extras.trim()}` : "";
  return `Build a website for ${biz}.${phoneLine}${extrasBlock}

DESIGN DIRECTION:
- Aesthetic: ${p.aesthetic}
- Font pair: ${p.fontPair}
- Colour palette: ${p.palette.name} — ${p.palette.bg} background / ${p.palette.accent} accent
- Layout: ${p.layout}

SPECIAL FEATURES (include both):
- ${p.features[0]}
- ${p.features[1]}

DO NOT (anti-patterns):
${p.antiPatterns.map((a) => `- ${a}`).join("\n")}

${IMAGES_BLOCK}`;
}

const inputSt: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
};

const labelSt: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "rgba(255,255,255,0.45)",
  marginBottom: "6px",
  display: "block",
};

export default function PromptGeneratorTab() {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [extras, setExtras] = useState("");
  const [parts, setParts] = useState<GeneratedParts | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setParts({
      aesthetic: pick(AESTHETICS),
      fontPair: pick(FONT_PAIRS),
      palette: pick(PALETTES),
      layout: pick(LAYOUTS),
      features: pickN(SPECIAL_FEATURES, 2),
      antiPatterns: pickN(ANTI_PATTERNS, 6),
    });
    setCopied(false);
  }

  const promptText = parts ? buildPrompt(businessName, phone, extras, parts) : "";

  async function copyPrompt() {
    if (!promptText) return;
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const swatches = parts
    ? (() => {
        const { bg, accent } = parts.palette;
        const text = isLightHex(bg) ? "#0A0A0A" : "#FAFAFA";
        const muted = isLightHex(bg) ? "#888888" : "#666666";
        return [
          { hex: bg, label: "BG" },
          { hex: accent, label: "Accent" },
          { hex: text, label: "Text" },
          { hex: muted, label: "Muted" },
        ];
      })()
    : [];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-1">Prompt Generator</h2>
      <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
        Generate a Claude Code prompt for a new client website with randomised design direction.
      </p>

      <div className="flex flex-col gap-5 mb-8">
        <div>
          <label style={labelSt}>Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Sunrise Plumbing"
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
            style={inputSt}
          />
        </div>
        <div>
          <label style={labelSt}>Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07723 396306"
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none"
            style={inputSt}
          />
        </div>
        <div>
          <label style={labelSt}>Extra Details</label>
          <textarea
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
            rows={4}
            placeholder="Anything specific — services, location, tone, target customer…"
            className="w-full rounded-sm px-3 py-2.5 text-sm outline-none resize-none"
            style={inputSt}
          />
        </div>
        <button
          onClick={generate}
          className="self-start text-sm font-semibold px-5 py-2.5 rounded-sm transition-opacity hover:opacity-80"
          style={{ background: "#b0ff00", color: "#000" }}
        >
          {parts ? "Generate New Prompt" : "Generate Prompt"}
        </button>
      </div>

      {parts && (
        <div
          className="rounded-sm p-5 flex flex-col gap-5"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
        >
          <div>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "10px",
              }}
            >
              Palette · {parts.palette.name}
            </p>
            <div className="flex gap-2">
              {swatches.map((s) => (
                <div key={s.label} className="flex flex-col flex-1 min-w-0">
                  <div
                    style={{
                      background: s.hex,
                      height: "56px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: "5px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {s.label} · {s.hex.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              ["Aesthetic", parts.aesthetic.split(" — ")[0]],
              ["Layout", parts.layout.split(" — ")[0]],
              ["Fonts", parts.fontPair],
              ["Features", `${parts.features.length} picked`],
            ].map(([k, v]) => (
              <div key={k} style={{ color: "rgba(255,255,255,0.6)" }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{k} · </span>
                {v}
              </div>
            ))}
          </div>

          <pre
            className="rounded-sm p-4 text-xs overflow-auto whitespace-pre-wrap"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6,
              maxHeight: "440px",
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            }}
          >
            {promptText}
          </pre>

          <div className="flex gap-3">
            <button
              onClick={copyPrompt}
              className="text-xs font-semibold px-4 py-2 rounded-sm transition-opacity hover:opacity-80"
              style={{
                background: copied ? "rgba(176,255,0,0.15)" : "#b0ff00",
                color: copied ? "#b0ff00" : "#000",
                border: copied ? "1px solid rgba(176,255,0,0.25)" : "none",
              }}
            >
              {copied ? "✓ Copied!" : "Copy prompt"}
            </button>
            <button
              onClick={generate}
              className="text-xs font-medium px-4 py-2 rounded-sm transition-opacity hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              ↻ Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
