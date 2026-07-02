import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import DemoMarquee from "@/components/DemoMarquee";
import TemplatesSection from "@/components/TemplatesSection";
import ContactSection from "@/components/ContactSection";
import FloatingButtons from "@/components/FloatingButtons";
import ScrollProgress from "@/components/ScrollProgress";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import CubeSection from "@/components/CubeSection";

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
  email: "hello@dygiko.com",
  description:
    "Dygiko builds fast, professional websites for businesses globally. Web design, SEO, Google Business Profile, custom CRM and mobile apps. Live in 2 days from £49/month, no upfront cost.",
  areaServed: "Worldwide",
  priceRange: "£49 - £99 per month",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Web Design Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Basic Website", description: "Custom website design, live in 2 days. £49/month, no upfront cost, cancel anytime." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Growth Website", description: "Advanced SEO, blog, contact form and company email. £69/month, no upfront cost, cancel anytime." } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Full Business Package", description: "Google Business Profile, CRM, WhatsApp integration. £99/month, no upfront cost, cancel anytime." } },
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
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <ServicesSection />
        <DemoMarquee />
        <TemplatesSection />
        <CubeSection />
        <ContactSection />
      </main>
      <FloatingButtons />
    </>
  );
}
