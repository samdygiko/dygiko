// Dygiko package catalog — ANNUAL SUBSCRIPTION pricing (billed once a year,
// Dygiko builds + hosts + maintains it, client licenses it while subscribed).
// This is the single source of truth for prices: the public pricing section,
// the /checkout page, the PayPal billing plans, and the CRM payment-link
// generator all read from here. `price` is the ANNUAL amount in GBP.

export type PackageKey = "site" | "crm" | "bundle" | "social" | "reels";

export interface Package {
  key: PackageKey;
  /** Short name shown on cards + checkout */
  name: string;
  /** One-line positioning */
  tagline: string;
  /** Annual price in GBP */
  price: number;
  /** Optional "was" price to show a saving (bundle) */
  compareAt?: number;
  /** Bullet points shown on the pricing card */
  features: string[];
  /** Highlight as the recommended card */
  featured?: boolean;
  /** For slider-priced packages (social): annual £ per unit, and the unit label */
  perUnit?: number;
  unitLabel?: string;
  unitMin?: number;
  unitMax?: number;
  unitDefault?: number;
}

export const PACKAGES: Package[] = [
  {
    key: "site",
    name: "Website",
    tagline: "A fast, professional site — built, hosted and kept live for you.",
    price: 360,
    features: [
      "Custom multi-page website design",
      "Mobile-first, lightning fast",
      "Contact form + business email setup",
      "Basic SEO + Google indexing",
      "Hosting, updates & support included",
    ],
  },
  {
    key: "crm",
    name: "Custom OMS (Operations Management System)",
    tagline: "Your own lead + customer system, tailored to how you work.",
    price: 600,
    features: [
      "Tailored customer & lead database",
      "Pipeline, notes, follow-up tracking",
      "Built-in dialler + email tools",
      "Secure login for your team",
      "Hosting, updates & support included",
    ],
  },
  {
    key: "bundle",
    name: "Website + Custom OMS",
    tagline: "The full stack — your site and system, built together.",
    price: 840,
    compareAt: 960,
    featured: true,
    features: [
      "Everything in Website",
      "Everything in Custom OMS",
      "Site and system wired together",
      "Leads flow straight from site to system",
      "Save £120/yr vs buying separately",
    ],
  },
  {
    key: "social",
    name: "Static posts",
    tagline: "We plan, write and post — so you stay top of mind without lifting a finger.",
    price: 156, // 2 posts/month baseline (£78/yr per post-per-month = £6.50 a post)
    perUnit: 78,
    unitLabel: "posts / month",
    unitMin: 1,
    unitMax: 30,
    unitDefault: 2,
    features: [
      "Content planned around your business",
      "Written, designed and scheduled for you",
      "£78/year for each post per month — just £6.50 a post",
      "Scale up or down anytime",
    ],
  },
  {
    key: "reels",
    name: "Reels & video editing",
    tagline: "Send us your clips — we cut them into proper reels, captions and all.",
    price: 216, // 1 reel/month baseline (£216/yr per reel-per-month = £18 a reel)
    perUnit: 216,
    unitLabel: "reels / month",
    unitMin: 1,
    unitMax: 30,
    unitDefault: 1,
    features: [
      "You send the clips, we do the rest",
      "Cuts, captions, music and transitions",
      "£216/year for each reel per month — just £18 a reel",
      "Scale up or down anytime",
    ],
  },
];

export function getPackage(key: string): Package | undefined {
  return PACKAGES.find((p) => p.key === key);
}

export const PACKAGE_KEYS: PackageKey[] = ["site", "crm", "bundle", "social", "reels"];
