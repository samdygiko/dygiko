const TC_URL = "https://dygiko-hosting-a733a.web.app/terms-and-conditions.pdf";

const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0D0D0D; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #0D0D0D; }
    .top-bar { background: #CCFF00; height: 4px; }
    .header { padding: 32px 40px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo-text { font-size: 18px; font-weight: 700; color: #CCFF00; letter-spacing: -0.02em; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 15px; color: rgba(255,255,255,0.55); margin-bottom: 20px; }
    .intro { font-size: 15px; color: #D0D0D0; line-height: 1.7; margin-bottom: 24px; }
    .package-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09); border-radius: 6px; padding: 24px 28px; margin-bottom: 28px; }
    .package-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; }
    .package-name { font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em; margin-bottom: 4px; }
    .package-price { font-size: 28px; font-weight: 700; color: #CCFF00; letter-spacing: -0.02em; margin-bottom: 2px; }
    .package-recur { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 20px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 16px 0; }
    .includes-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; }
    .includes-list { list-style: none; padding: 0; }
    .includes-list li { font-size: 14px; color: #C0C0C0; padding: 4px 0; padding-left: 20px; position: relative; line-height: 1.5; }
    .includes-list li::before { content: "✓"; position: absolute; left: 0; color: #CCFF00; font-weight: 700; font-size: 13px; }
    .cta-section { text-align: center; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: #CCFF00; color: #080808; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 4px; text-decoration: none; letter-spacing: -0.01em; }
    .cta-note { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 10px; }
    .tc-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
    .tc-text { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
    .tc-link { color: #CCFF00; text-decoration: none; }
    .signoff { font-size: 14px; color: #D0D0D0; line-height: 1.8; margin-bottom: 8px; }
    .signoff-name { font-size: 14px; font-weight: 600; color: #FFFFFF; }
    .signoff-role { font-size: 13px; color: rgba(255,255,255,0.4); }
    .footer { padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 13px; font-weight: 700; color: #CCFF00; }
    .footer-links { font-size: 11px; color: rgba(255,255,255,0.3); }
  </style>
`;

function logoSvg() {
  return `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="12" rx="1.5" fill="#CCFF00"/>
    <rect x="18" y="2" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/>
    <rect x="2" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.6"/>
    <rect x="18" y="18" width="12" height="12" rx="1.5" fill="#CCFF00" opacity="0.3"/>
  </svg>`;
}

function buildEmail({
  firstName,
  businessName,
  packageLabel,
  packageName,
  price,
  recur,
  includes,
  stripeUrl,
}: {
  firstName: string;
  businessName: string;
  packageLabel: string;
  packageName: string;
  price: string;
  recur: string;
  includes: string[];
  stripeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>${baseStyle}</head>
<body>
<div class="wrapper">
  <div class="top-bar"></div>

  <div class="header">
    <div class="logo">
      ${logoSvg()}
      <span class="logo-text">dygiko</span>
    </div>
  </div>

  <div class="body">
    <p class="greeting">Hi ${firstName},</p>
    <p class="intro">
      It was great speaking with you! As discussed, here's your personalised quote for
      ${businessName}. Everything you need to get your business online — live within 2 days of payment.
    </p>

    <div class="package-card">
      <div class="package-label">${packageLabel}</div>
      <div class="package-name">${packageName}</div>
      <div class="package-price">${price}</div>
      <div class="package-recur">${recur}</div>
      <hr class="divider"/>
      <div class="includes-title">What's included</div>
      <ul class="includes-list">
        ${includes.map((item) => `<li>${item}</li>`).join("\n        ")}
      </ul>
    </div>

    <div class="cta-section">
      <a href="${stripeUrl}" class="cta-btn">Pay securely →</a>
      <p class="cta-note">Secure payment via Stripe · Work starts immediately on receipt</p>
    </div>

    <div class="tc-section">
      <p class="tc-text">
        By proceeding with payment you agree to our
        <a href="${TC_URL}" class="tc-link">Terms &amp; Conditions of Service</a>.
        You can download and review the full document before paying.
        Monthly retainer of ${recur.split(" ")[0]} covers hosting, security updates, and ongoing support — cancel anytime with 30 days' notice.
      </p>
    </div>

    <p class="signoff">
      Any questions at all, just reply to this email or give me a call.<br/>
      Looking forward to building something great for ${businessName}!
    </p>
    <br/>
    <p class="signoff-name">Sam</p>
    <p class="signoff-role">Dygiko · sam@dygiko.com · 07723396306</p>
  </div>

  <div class="footer">
    <span class="footer-brand">dygiko</span>
    <span class="footer-links">dygiko.com · sam@dygiko.com</span>
  </div>
</div>
</body>
</html>`;
}

export const PACKAGE_EMAILS = {
  basic: {
    subject: (businessName: string) =>
      `Your Dygiko quote — Basic Website for ${businessName}`,
    html: (firstName: string, businessName: string) =>
      buildEmail({
        firstName,
        businessName,
        packageLabel: "Package 01 — Basic",
        packageName: "Basic Website",
        price: "£500",
        recur: "£29/month ongoing",
        stripeUrl: "https://buy.stripe.com/4gMcN5aQg1wXdJq20SfjG00",
        includes: [
          "Custom website design",
          "Domain registration & hosting setup",
          "Mobile-responsive build",
          "Basic on-page SEO",
          "Live within 2 business days",
          "Monthly hosting & support (£29/mo)",
        ],
      }),
  },

  growth: {
    subject: (businessName: string) =>
      `Your Dygiko quote — Growth Website for ${businessName}`,
    html: (firstName: string, businessName: string) =>
      buildEmail({
        firstName,
        businessName,
        packageLabel: "Package 02 — Growth",
        packageName: "Growth Website",
        price: "£750",
        recur: "£29/month ongoing",
        stripeUrl: "https://buy.stripe.com/fZueVdbUk2B16gYaxofjG01",
        includes: [
          "Everything in Basic",
          "Advanced SEO configuration",
          "Blog setup with 3 starter posts",
          "Contact form integration",
          "Professional company email address",
          "Live within 2 business days",
          "Monthly hosting & support (£29/mo)",
        ],
      }),
  },

  fullBusiness: {
    subject: (businessName: string) =>
      `Your Dygiko quote — Full Business Package for ${businessName}`,
    html: (firstName: string, businessName: string) =>
      buildEmail({
        firstName,
        businessName,
        packageLabel: "Package 03 — Full Business",
        packageName: "Full Business Package",
        price: "£1,500",
        recur: "£29/month ongoing",
        stripeUrl: "https://buy.stripe.com/bJebJ19McdfFdJq0WOfjG02",
        includes: [
          "Everything in Growth",
          "Google Business Profile setup & optimisation",
          "Custom CRM system",
          "WhatsApp & click-to-call button integration",
          "Live within 2 business days",
          "Monthly hosting & support (£29/mo)",
        ],
      }),
  },
};
