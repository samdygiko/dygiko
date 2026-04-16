import type { Metadata } from "next";
import Nav from "@/components/Nav";
import FooterCTA from "@/components/FooterCTA";

export const metadata: Metadata = {
  title: "Privacy Policy — Dygiko",
  description: "Dygiko privacy policy. How we collect, use, and protect your personal data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mb-16 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Last updated: March 2026
          </p>

          <Section title="1. Who we are">
            <p>
              Dygiko (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a UK-based web design
              studio. Our website is dygiko.com. You can contact us at sam@dygiko.com.
            </p>
            <p>
              We are committed to protecting your personal data and complying with the UK
              General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>We may collect the following personal data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Contact form data:</strong> Name, email address, phone number, business type, and your message when you submit our contact form.</li>
              <li><strong className="text-white">Payment data:</strong> When you purchase a package via Stripe, Stripe processes your payment card data. We do not store card details on our servers.</li>
              <li><strong className="text-white">Usage data:</strong> Basic analytics such as page views and general location (country level), collected anonymously.</li>
              <li><strong className="text-white">Cookies:</strong> We use minimal session cookies required for site functionality. We do not use advertising or tracking cookies.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <p>We use your personal data to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Respond to your enquiries submitted via the contact form</li>
              <li>Process your payment for web design services</li>
              <li>Deliver the services you have purchased</li>
              <li>Send you project updates and communications related to your order</li>
            </ul>
            <p>
              We do not sell your data to third parties. We do not use your data for
              marketing unless you have explicitly opted in.
            </p>
          </Section>

          <Section title="4. Legal basis for processing">
            <p>We process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Contractual necessity:</strong> Processing required to deliver the services you have purchased.</li>
              <li><strong className="text-white">Legitimate interests:</strong> Responding to enquiries and communicating with potential clients.</li>
              <li><strong className="text-white">Consent:</strong> Where you have specifically opted in to receive marketing communications.</li>
            </ul>
          </Section>

          <Section title="5. Third-party services">
            <p>We use the following third-party services which may process your data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Stripe</strong> — Payment processing. Stripe is PCI DSS compliant.
                View their privacy policy at stripe.com/privacy.
              </li>
              <li>
                <strong className="text-white">Resend</strong> — Email delivery service used to send
                contact form submissions. Data is processed in the EU/UK.
              </li>
              <li>
                <strong className="text-white">Trustpilot</strong> — Review platform. If you choose
                to leave a review, Trustpilot&apos;s own privacy policy applies.
              </li>
              <li>
                <strong className="text-white">Google Analytics</strong> — Anonymous website analytics.
                IP addresses are anonymised.
              </li>
            </ul>
          </Section>

          <Section title="6. Data retention">
            <p>
              We retain contact form data for up to 24 months after your last interaction
              with us, unless you request deletion earlier. Payment records are retained for
              7 years as required by UK tax law.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Access</strong> — Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-white">Rectification</strong> — Request correction of inaccurate data.</li>
              <li><strong className="text-white">Erasure</strong> — Request deletion of your personal data where we have no lawful basis to retain it.</li>
              <li><strong className="text-white">Portability</strong> — Request your data in a machine-readable format.</li>
              <li><strong className="text-white">Object</strong> — Object to processing based on legitimate interests.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at sam@dygiko.com. We will
              respond within 30 days.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Our website uses only essential cookies necessary for basic functionality.
              No consent banner is required for essential cookies under UK GDPR.
            </p>
            <p>
              If we introduce analytics or marketing cookies in the future, we will update
              this policy and obtain your consent where required.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We implement appropriate technical and organisational security measures to
              protect your personal data against unauthorised access, alteration, disclosure,
              or destruction. Our website uses HTTPS encryption.
            </p>
          </Section>

          <Section title="10. Contact and complaints">
            <p>
              If you have any questions about this privacy policy or how we handle your
              data, please contact us at sam@dygiko.com.
            </p>
            <p>
              You also have the right to lodge a complaint with the Information
              Commissioner&apos;s Office (ICO) at ico.org.uk if you believe we have not
              handled your data correctly.
            </p>
          </Section>

          <div className="mt-16 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-white"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              ← Back to home
            </a>
          </div>
        </div>
      </main>
      <FooterCTA />
    </>
  );
}
