import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const BASE_URL = "https://www.dygiko.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dygiko — Professional Web Design for Businesses Globally",
    template: "%s — Dygiko",
  },
  description:
    "Dygiko builds fast, professional websites for businesses globally. Web design, SEO, Google Business Profile, custom CRM and mobile apps. Live in 2 days from £500.",
  keywords: [
    "web design UK",
    "affordable websites",
    "business website",
    "SEO setup",
    "Google Business Profile",
    "custom CRM",
    "Dygiko",
  ],
  authors: [{ name: "Dygiko", url: BASE_URL }],
  creator: "Dygiko",
  icons: {
    icon: [{ url: "/dygiko-logo-400.png", type: "image/png" }],
    apple: [{ url: "/dygiko-logo-400.png" }],
    shortcut: "/dygiko-logo-400.png",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: BASE_URL,
    siteName: "Dygiko",
    title: "Dygiko — Professional Web Design for Businesses Globally",
    description:
      "Fast, professional websites for businesses globally. Web design, SEO, CRM and apps — live in 2 days from £500.",
    images: [{ url: "/dygiko-logo-400.png", width: 400, height: 400, alt: "Dygiko" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dygiko — Professional Web Design for Businesses Globally",
    description:
      "Custom websites for businesses globally. From £500. Live in 2 days.",
    images: ["/dygiko-logo-400.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: BASE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable}`}>
      <head>
      </head>
      <body>{children}</body>
    </html>
  );
}
