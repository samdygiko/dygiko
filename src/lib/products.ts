// Kojo Builds package catalog — annual subscription pricing (billed yearly).
// This is the single source of truth for prices: the public pricing section,
// the /checkout page, the PayPal subscription plans, and the CRM payment-link
// generator all read from here. Change a price once, here (then re-run
// /api/paypal/setup-plans to regenerate the PayPal billing plans).

export type PackageKey = "site" | "crm" | "bundle";

export interface Package {
  key: PackageKey;
  /** Short name shown on cards + checkout */
  name: string;
  /** One-line positioning */
  tagline: string;
  /** One-off price in GBP */
  price: number;
  /** Optional "was" price to show a saving (bundle) */
  compareAt?: number;
  /** Bullet points shown on the pricing card */
  features: string[];
  /** Highlight as the recommended card */
  featured?: boolean;
}

export const PACKAGES: Package[] = [
  {
    key: "site",
    name: "Website",
    tagline: "A fast, professional site — built to order, live in days.",
    price: 500,
    features: [
      "Custom multi-page website design",
      "Mobile-first, lightning fast",
      "Contact form + business email setup",
      "Basic SEO + Google indexing",
      "Next day delivery",
    ],
  },
  {
    key: "crm",
    name: "Custom OMS (Operations Management System)",
    tagline: "Your own lead + customer system, tailored to how you work.",
    price: 1000,
    features: [
      "Tailored customer & lead database",
      "Pipeline, notes, follow-up tracking",
      "Built-in dialler + email tools",
      "Secure login for your team",
      "Hosting, support & updates included",
    ],
  },
  {
    key: "bundle",
    name: "Website + Custom OMS",
    tagline: "The full stack — your site and system, built together.",
    price: 1250,
    compareAt: 1500,
    featured: true,
    features: [
      "Everything in Website",
      "Everything in Custom OMS",
      "Site and system wired together",
      "Leads flow straight from site to system",
      "Save £250 every year vs separately",
    ],
  },
];

export function getPackage(key: string): Package | undefined {
  return PACKAGES.find((p) => p.key === key);
}

export const PACKAGE_KEYS: PackageKey[] = ["site", "crm", "bundle"];
