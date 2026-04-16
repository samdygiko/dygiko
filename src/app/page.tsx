import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import ServicesSection from "@/components/ServicesSection";
import TemplatesSection from "@/components/TemplatesSection";
import AboutSection from "@/components/AboutSection";
import AppDevSection from "@/components/AppDevSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PlatformsBar from "@/components/PlatformsBar";
import ContactSection from "@/components/ContactSection";
import FooterCTA from "@/components/FooterCTA";
import FloatingButtons from "@/components/FloatingButtons";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dygiko",
  url: "https://www.dygiko.com",
  logo: "https://dygiko.com/dygiko-logo-400.png",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Dygiko",
  url: "https://www.dygiko.com",
  logo: "https://dygiko.com/dygiko-logo-400.png",
  email: "sam@dygiko.com",
  description:
    "Dygiko builds fast, professional websites for businesses globally. Web design, SEO, Google Business Profile, custom CRM and mobile apps. Live in 2 days from £500.",
  areaServed: "Worldwide",
  priceRange: "£500 - £1500",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Web Design Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Basic Website", description: "Custom website design from £500, live in 2 days." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Growth Website", description: "Advanced SEO, blog, contact form and company email from £750." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Full Business Package", description: "Google Business Profile, CRM, WhatsApp integration from £1500." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "iOS & Android Apps", description: "Native mobile apps for iPhone, iPad and Android." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom CRM", description: "Tailored customer relationship management systems." } },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main>
        <Hero />
        <StatsSection />
        <ServicesSection />
        <TemplatesSection />
        <AboutSection />
        <AppDevSection />
        <HowItWorksSection />
        <PlatformsBar />
        <ContactSection />
      </main>
      <FooterCTA />
      <FloatingButtons />
    </>
  );
}
