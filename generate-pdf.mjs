import puppeteer from "puppeteer-core";
import { writeFileSync } from "fs";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0D0D0D;
    color: #D0D0D0;
    font-size: 10.5pt;
    line-height: 1.7;
  }

  .top-bar {
    background: #CCFF00;
    height: 5px;
    width: 100%;
  }

  .header {
    padding: 36px 56px 28px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: #CCFF00;
    letter-spacing: -0.02em;
  }

  .header-right {
    text-align: right;
    font-size: 9pt;
    color: rgba(255,255,255,0.4);
  }

  .title-section {
    padding: 40px 56px 36px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .doc-title {
    font-size: 26pt;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .doc-subtitle {
    font-size: 10pt;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .content {
    padding: 0 56px 56px;
  }

  .section {
    padding-top: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 24px;
  }

  .section:last-child {
    border-bottom: none;
  }

  .section-number {
    font-size: 8pt;
    font-weight: 600;
    color: #CCFF00;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .section-title {
    font-size: 13pt;
    font-weight: 700;
    color: #CCFF00;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }

  p {
    color: #B8B8B8;
    margin-bottom: 10px;
    font-size: 10.5pt;
  }

  ul {
    margin: 8px 0 10px 0;
    padding-left: 18px;
  }

  li {
    color: #B8B8B8;
    margin-bottom: 5px;
    font-size: 10.5pt;
  }

  .package-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin: 16px 0;
  }

  .package-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    padding: 14px 16px;
  }

  .package-name {
    font-size: 9pt;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .package-price {
    font-size: 16pt;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.02em;
    margin-bottom: 2px;
  }

  .package-recur {
    font-size: 9pt;
    color: #CCFF00;
    font-weight: 500;
  }

  .highlight {
    color: #CCFF00;
    font-weight: 600;
  }

  .footer {
    background: #080808;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 20px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  .footer-left {
    font-size: 9pt;
    color: rgba(255,255,255,0.3);
  }

  .footer-right {
    font-size: 9pt;
    color: rgba(255,255,255,0.3);
    text-align: right;
  }

  .footer-brand {
    font-size: 10pt;
    font-weight: 700;
    color: #CCFF00;
    margin-bottom: 2px;
  }

  strong {
    color: #FFFFFF;
    font-weight: 600;
  }
</style>
</head>
<body>

<div class="top-bar"></div>

<div class="header">
  <div class="logo">
    <svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1.5" fill="#CCFF00"/>
      <rect x="18" y="2" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/>
      <rect x="2" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/>
      <rect x="18" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.3"/>
    </svg>
    <span class="logo-text">dygiko</span>
  </div>
  <div class="header-right">
    dygiko.com<br/>
    sam@dygiko.com
  </div>
</div>

<div class="title-section">
  <h1 class="doc-title">Terms &amp; Conditions<br/>of Service</h1>
  <p class="doc-subtitle">Last updated: April 2026</p>
</div>

<div class="content">

  <div class="section">
    <div class="section-number">01</div>
    <div class="section-title">Overview</div>
    <p>These Terms and Conditions govern the provision of web design, development, hosting, and related digital services by <strong>Dygiko</strong> ("we", "us", "our") to the client ("you", "your"). By engaging our services, placing an order, or making a payment, you agree to be bound by these terms in full.</p>
    <p>Dygiko is a professional web design and digital services agency operating in the United Kingdom. All services are delivered remotely unless otherwise agreed in writing.</p>
  </div>

  <div class="section">
    <div class="section-number">02</div>
    <div class="section-title">Services &amp; Packages</div>
    <p>We offer three service packages. All packages include a custom website build delivered within 2 business days of payment, with domain registration, hosting setup, and monthly support included in the monthly retainer.</p>

    <div class="package-grid">
      <div class="package-card">
        <div class="package-name">Basic</div>
        <div class="package-price">£500</div>
        <div class="package-recur">+ £29/month</div>
      </div>
      <div class="package-card">
        <div class="package-name">Growth</div>
        <div class="package-price">£750</div>
        <div class="package-recur">+ £29/month</div>
      </div>
      <div class="package-card">
        <div class="package-name">Full Business</div>
        <div class="package-price">£1,500</div>
        <div class="package-recur">+ £29/month</div>
      </div>
    </div>

    <p><strong>Basic Website (£500 + £29/month):</strong> Custom website design, domain registration, hosting setup, mobile-responsive build, basic on-page SEO. Live within 2 business days.</p>
    <p><strong>Growth Website (£750 + £29/month):</strong> Everything in Basic, plus advanced SEO configuration, blog setup with 3 starter posts, contact form integration, and a professional company email address.</p>
    <p><strong>Full Business Package (£1,500 + £29/month):</strong> Everything in Growth, plus Google Business Profile setup and optimisation, custom CRM system, WhatsApp and click-to-call button integration.</p>
    <p>The monthly retainer of <strong>£29/month</strong> covers continued hosting, security monitoring, software updates, and ongoing technical support for all packages.</p>
  </div>

  <div class="section">
    <div class="section-number">03</div>
    <div class="section-title">Payment Terms</div>
    <p>The one-time setup fee is due in full prior to commencement of work. Payment is processed securely via Stripe. Work will not begin until payment has been received and confirmed.</p>
    <p>The monthly retainer (£29/month) begins on the date your website goes live and is billed monthly in advance. Payments are processed automatically via the payment method on file.</p>
    <p>All prices are quoted in GBP and are inclusive of any applicable VAT unless otherwise stated. Dygiko reserves the right to update pricing with 30 days' notice to existing clients.</p>
    <p>In the event of a failed or disputed payment, services may be suspended until the outstanding balance is settled.</p>
  </div>

  <div class="section">
    <div class="section-number">04</div>
    <div class="section-title">Hosting &amp; Ownership</div>
    <p>Upon receipt of full payment, you own the website content, design, and code produced for your project. Dygiko retains no ownership over client-commissioned work once payment is complete.</p>
    <p>Hosting is provided by Dygiko through our infrastructure partners as part of the monthly retainer. Should you wish to transfer hosting to a third party, we will provide all necessary files and assistance within 7 business days of a written request. Hosting charges cease from the date of transfer.</p>
    <p>Your domain is registered in your name or your business's name. Dygiko manages the domain on your behalf as part of the retainer. You retain full ownership of the domain at all times.</p>
  </div>

  <div class="section">
    <div class="section-number">05</div>
    <div class="section-title">Cancellation Policy</div>
    <p>You may cancel the monthly retainer at any time with <strong>30 days' written notice</strong> sent to sam@dygiko.com. Your website will remain live for the duration of the notice period. After cancellation takes effect, hosting will be discontinued and files will be made available for you to download.</p>
    <p>The one-time setup fee is non-refundable once work has commenced. If you wish to cancel before work begins, a full refund will be issued within 5 business days.</p>
    <p>Dygiko reserves the right to terminate the agreement with immediate effect in cases of non-payment, abusive conduct, or use of the website for unlawful purposes.</p>
  </div>

  <div class="section">
    <div class="section-number">06</div>
    <div class="section-title">Client Responsibilities</div>
    <p>To ensure timely delivery, you agree to:</p>
    <ul>
      <li>Provide all required content (text, images, logos, brand assets) within 3 business days of payment</li>
      <li>Respond to review requests and approval requests within 5 business days</li>
      <li>Ensure all content provided is legally owned by you or that you have the right to use it</li>
      <li>Keep your payment details up to date to avoid service interruption</li>
      <li>Not use the website or services for any unlawful, harmful, or fraudulent purpose</li>
    </ul>
    <p>Delays caused by late content submission may affect the 2-day delivery guarantee. We will communicate any revised timelines promptly.</p>
  </div>

  <div class="section">
    <div class="section-number">07</div>
    <div class="section-title">Data &amp; Privacy</div>
    <p>Dygiko collects and processes personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. We collect only the data necessary to provide our services.</p>
    <p>Client data is never sold to third parties. We use trusted third-party processors including Stripe (payment processing), Resend (email delivery), and Firebase (data storage and hosting), all of which operate under appropriate data protection frameworks.</p>
    <p>You have the right to access, correct, or request deletion of your personal data at any time by contacting sam@dygiko.com. Full details are set out in our Privacy Policy at <span class="highlight">dygiko.com/privacy</span>.</p>
  </div>

  <div class="section">
    <div class="section-number">08</div>
    <div class="section-title">Liability</div>
    <p>Dygiko will use reasonable skill and care in delivering all services. However, we do not guarantee specific outcomes such as search engine rankings, revenue increases, or lead volumes.</p>
    <p>Our total liability to you in connection with any services shall not exceed the total fees paid by you to Dygiko in the 12 months preceding the claim. We are not liable for any indirect, consequential, or loss of profit claims.</p>
    <p>Dygiko is not liable for service interruptions caused by third-party infrastructure providers, force majeure events, or client-caused issues.</p>
  </div>

  <div class="section">
    <div class="section-number">09</div>
    <div class="section-title">Governing Law</div>
    <p>These Terms and Conditions are governed by and construed in accordance with the laws of <strong>England and Wales</strong>. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
    <p>If any provision of these terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
  </div>

  <div class="section">
    <div class="section-number">10</div>
    <div class="section-title">Contact</div>
    <p>If you have any questions about these Terms and Conditions or wish to discuss your agreement with us, please contact:</p>
    <ul>
      <li><strong>Email:</strong> sam@dygiko.com</li>
      <li><strong>Website:</strong> dygiko.com</li>
      <li><strong>Business hours:</strong> Monday – Friday, 9am – 6pm GMT</li>
    </ul>
    <p>We aim to respond to all enquiries within 1 business day.</p>
  </div>

</div>

<div class="footer">
  <div class="footer-left">
    <div class="footer-brand">dygiko</div>
    © 2026 Dygiko. All rights reserved.
  </div>
  <div class="footer-right">
    dygiko.com<br/>
    sam@dygiko.com
  </div>
</div>

</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });

const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

await browser.close();

writeFileSync("./public/terms-and-conditions.pdf", pdf);
console.log("✓ PDF saved to public/terms-and-conditions.pdf");
console.log("  Public URL: https://dygiko-hosting-a733a.web.app/terms-and-conditions.pdf");
