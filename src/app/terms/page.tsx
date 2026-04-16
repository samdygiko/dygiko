import type { Metadata } from "next";
import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";

export const metadata: Metadata = {
  title: "Terms & Conditions — Dygiko",
  description: "Dygiko terms and conditions of service. Read our full terms before purchasing a website package.",
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className="text-xs font-mono mb-1" style={{ color: "#b0ff00" }}>{num}</p>
      <h2
        className="font-heading font-bold tracking-tight mb-4"
        style={{ fontSize: "1.5rem" }}
      >
        {title}
      </h2>
      <div className="space-y-4" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-6"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Legal
          </p>
          <h1
            className="font-heading font-black tracking-tight mb-4"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.05 }}
          >
            Terms &amp; Conditions
          </h1>
          <p className="mb-16 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Last updated: April 2026
          </p>

          <Section num="01" title="Overview">
            <p>
              These Terms and Conditions govern the provision of web design, development, hosting,
              and related digital services by <strong className="text-white">Dygiko</strong> (&ldquo;we&rdquo;,
              &ldquo;us&rdquo;, &ldquo;our&rdquo;) to the client (&ldquo;you&rdquo;, &ldquo;your&rdquo;).
              By engaging our services, placing an order, or making a payment, you agree to be bound
              by these terms in full.
            </p>
            <p>
              Dygiko is a professional web design and digital services agency operating in the United
              Kingdom. All services are delivered remotely unless otherwise agreed in writing.
            </p>
          </Section>

          <Section num="02" title="Services &amp; Packages">
            <p>
              We offer three service packages. All packages include a custom website build delivered
              within 2 business days of payment, with domain registration, hosting setup, and monthly
              support included in the monthly retainer.
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6"
            >
              {[
                { name: "Basic", price: "£500", recur: "+ £29/month" },
                { name: "Growth", price: "£750", recur: "+ £29/month" },
                { name: "Full Business", price: "£1,500", recur: "+ £29/month" },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className="rounded-sm px-5 py-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{pkg.name}</p>
                  <p className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{pkg.price}</p>
                  <p className="text-xs" style={{ color: "#b0ff00" }}>{pkg.recur}</p>
                </div>
              ))}
            </div>
            <p>
              <strong className="text-white">Basic Website (£500 + £29/month):</strong> Custom website
              design, domain registration, hosting setup, mobile-responsive build, basic on-page SEO.
              Live within 2 business days.
            </p>
            <p>
              <strong className="text-white">Growth Website (£750 + £29/month):</strong> Everything
              in Basic, plus advanced SEO configuration, blog setup with 3 starter posts, contact form
              integration, and a professional company email address.
            </p>
            <p>
              <strong className="text-white">Full Business Package (£1,500 + £29/month):</strong>{" "}
              Everything in Growth, plus Google Business Profile setup and optimisation, custom CRM
              system, WhatsApp and click-to-call button integration.
            </p>
            <p>
              The monthly retainer of <strong className="text-white">£29/month</strong> covers
              continued hosting, security monitoring, software updates, and ongoing technical support
              for all packages.
            </p>
          </Section>

          <Section num="03" title="Payment Terms">
            <p>
              The one-time setup fee is due in full prior to commencement of work. Payment is
              processed securely via Stripe. Work will not begin until payment has been received
              and confirmed.
            </p>
            <p>
              The monthly retainer (£29/month) begins on the date your website goes live and is billed
              monthly in advance. Payments are processed automatically via the payment method on file.
            </p>
            <p>
              All prices are quoted in GBP and are inclusive of any applicable VAT unless otherwise
              stated. Dygiko reserves the right to update pricing with 30 days&apos; notice to existing
              clients.
            </p>
            <p>
              In the event of a failed or disputed payment, services may be suspended until the
              outstanding balance is settled.
            </p>
          </Section>

          <Section num="04" title="Hosting &amp; Ownership">
            <p>
              Your website is built and hosted exclusively on Dygiko&apos;s infrastructure. The website
              code, files, and hosting environment remain the property of Dygiko. Clients cannot
              transfer the website to another hosting provider. If you cancel your subscription, your
              website will be taken offline within 30 days of cancellation.
            </p>
            <p>
              You retain full ownership of your business content including your logo, images, text,
              and branding.
            </p>
          </Section>

          <Section num="05" title="Cancellation Policy">
            <p>
              You may cancel the monthly retainer at any time with{" "}
              <strong className="text-white">30 days&apos; written notice</strong> sent to
              sam@dygiko.com. Your website will remain live for the duration of the notice period,
              after which it will be permanently taken offline.
            </p>
            <p>
              The one-time design fee is strictly non-refundable under any circumstances, including
              cancellation before work begins.
            </p>
            <p>
              Dygiko reserves the right to terminate the agreement with immediate effect in cases
              of non-payment, abusive conduct, or use of the website for unlawful purposes.
            </p>
          </Section>

          <Section num="06" title="Client Responsibilities">
            <p>To ensure timely delivery, you agree to:</p>
            <ul className="list-none space-y-2 mt-2">
              {[
                "Provide all required content (text, images, logos, brand assets) within 3 business days of payment",
                "Respond to review requests and approval requests within 5 business days",
                "Ensure all content provided is legally owned by you or that you have the right to use it",
                "Keep your payment details up to date to avoid service interruption",
                "Not use the website or services for any unlawful, harmful, or fraudulent purpose",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span style={{ color: "#b0ff00", flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Delays caused by late content submission may affect the 2-day delivery guarantee.
              We will communicate any revised timelines promptly.
            </p>
          </Section>

          <Section num="07" title="Data &amp; Privacy">
            <p>
              Dygiko collects and processes personal data in accordance with the UK General Data
              Protection Regulation (UK GDPR) and the Data Protection Act 2018. We collect only
              the data necessary to provide our services.
            </p>
            <p>
              Client data is never sold to third parties. We use trusted third-party processors
              including Stripe (payment processing), Resend (email delivery), and Firebase (data
              storage and hosting), all of which operate under appropriate data protection frameworks.
            </p>
            <p>
              You have the right to access, correct, or request deletion of your personal data at
              any time by contacting sam@dygiko.com. Full details are set out in our{" "}
              <a href="/privacy" style={{ color: "#b0ff00" }}>Privacy Policy</a>.
            </p>
          </Section>

          <Section num="08" title="Liability">
            <p>
              Dygiko will use reasonable skill and care in delivering all services. However, we do
              not guarantee specific outcomes such as search engine rankings, revenue increases,
              or lead volumes.
            </p>
            <p>
              Our total liability to you in connection with any services shall not exceed the total
              fees paid by you to Dygiko in the 12 months preceding the claim. We are not liable
              for any indirect, consequential, or loss of profit claims.
            </p>
            <p>
              Dygiko is not liable for service interruptions caused by third-party infrastructure
              providers, force majeure events, or client-caused issues.
            </p>
          </Section>

          <Section num="09" title="Governing Law">
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws
              of <strong className="text-white">England and Wales</strong>. Any disputes arising
              under these terms shall be subject to the exclusive jurisdiction of the courts of
              England and Wales.
            </p>
            <p>
              If any provision of these terms is found to be unenforceable, the remaining provisions
              shall continue in full force and effect.
            </p>
          </Section>

          <Section num="10" title="Contact">
            <p>
              If you have any questions about these Terms and Conditions or wish to discuss your
              agreement with us, please contact:
            </p>
            <ul className="list-none space-y-1.5 mt-2">
              <li><strong className="text-white">Email:</strong> sam@dygiko.com</li>
              <li><strong className="text-white">Website:</strong> dygiko.com</li>
              <li><strong className="text-white">Business hours:</strong> Monday – Friday, 9am – 6pm GMT</li>
            </ul>
            <p>We aim to respond to all enquiries within 1 business day.</p>
          </Section>

          <div
            className="mt-16 pt-8 flex items-center justify-between flex-wrap gap-4 text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}
          >
            <span>© 2026 Dygiko. All rights reserved.</span>
            <a
              href="/terms-and-conditions.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#b0ff00" }}
            >
              Download PDF ↗
            </a>
          </div>
        </div>
      </main>
      <FooterCTA />
    </>
  );
}
