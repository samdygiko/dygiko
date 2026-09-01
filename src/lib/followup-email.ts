// Shared follow-up email: builds the template + sends it through Zoho SMTP
// (from hello@dygiko.com → lands in Sent). Used by both the single-send route
// (/api/send-followup) and the batch route (/api/send-followup-batch).

import nodemailer from "nodemailer";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SIGNATURE_HTML = `
  <div style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 15px; color: #0b1b3b; margin-top: 20px; margin-bottom: 8px;">Kind regards,</div>
  <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #0b1b3b;">
    <tr>
      <td style="vertical-align: middle; padding-right: 12px; border-right: 2px solid #a3e635;">
        <img src="https://dygiko.com/dygiko-logo-400.png" alt="Dygiko" width="46" height="46" style="display: block; width: 46px; height: 46px;">
      </td>
      <td style="vertical-align: middle; padding-left: 12px;">
        <div style="font-size: 15px; font-weight: bold; color: #0b1b3b;">Sam Sako</div>
        <div style="font-size: 12px; color: #64748b; padding-bottom: 9px;">Partner</div>
        <div style="font-size: 12px; padding-bottom: 5px;">
          <a href="https://dygiko.com" style="color: #4d7c0f; text-decoration: none;">dygiko.com</a>
        </div>
        <div style="font-size: 12px;">
          <a href="tel:+447723396306" style="color: #0b1b3b; text-decoration: none;">+44 7723 396306</a>
        </div>
      </td>
    </tr>
  </table>`;

function bodyHtml(trade: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #0b1b3b; line-height: 1.5;">
    <p>Hi, hope you're well — I'm Sam, I build systems for ${esc(trade)} to manage all their admin and tech in one place. Here's my website so you can see pricing: <a href="https://dygiko.com" style="color:#4d7c0f;">https://dygiko.com</a></p>
    <p>Here are some demo systems so you can have an idea of what it might look like:<br>
      <a href="https://voltix-crm.vercel.app" style="color:#4d7c0f;">Electrician system</a><br>
      <a href="https://marsden-crm.vercel.app" style="color:#4d7c0f;">Construction system</a><br>
      <a href="https://brightwater-crm.vercel.app" style="color:#4d7c0f;">Dental system</a>
    </p>
    <p>If managing all your admin, clients and data is becoming a headache, here's the link to get started: <a href="https://dygiko.com/checkout?pkg=crm" style="color:#4d7c0f;">https://dygiko.com/checkout?pkg=crm</a></p>
    ${SIGNATURE_HTML}
    <p style="font-size: 11px; color: #94a3b8; margin-top: 18px;">Not interested? Just reply "STOP" and I won't message again.</p>
  </div>`;
}

function bodyText(trade: string): string {
  return `Hi, hope you're well — I'm Sam, I build systems for ${trade} to manage all their admin and tech in one place. Here's my website so you can see pricing: https://dygiko.com

Here are some demo systems so you can have an idea of what it might look like:
Electrician system: https://voltix-crm.vercel.app
Construction system: https://marsden-crm.vercel.app
Dental system: https://brightwater-crm.vercel.app

If managing all your admin, clients and data is becoming a headache, here's the link to get started: https://dygiko.com/checkout?pkg=crm

Kind regards,

Sam Sako
Partner
dygiko.com | +44 7723 396306

Not interested? Just reply "STOP" and I won't message again.`;
}

export function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || "").trim());
}

let cachedTransporter: nodemailer.Transporter | null = null;
function transporter() {
  const user = process.env.ZOHO_MAIL_USER;
  const pass = process.env.ZOHO_MAIL_PASS;
  if (!user || !pass) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

/** Send one follow-up email. Returns true on success. Throws if not configured. */
// Straight after a call: a short note with the website, which carries the
// demos itself. Deliberately no price list — that conversation already
// happened on the phone.
function postCallHtml(name: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #0b1b3b; line-height: 1.5;">
    <p>Hi ${esc(name)}, good to speak earlier.</p>
    <p>Here's my website: <a href="https://dygiko.com" style="color:#7aa800;">dygiko.com</a></p>
    <p>On there you can see various demos of the custom apps and websites I offer.</p>
    <p>Would be great to get on a short consultation call with you whenever you're available.</p>
    ${SIGNATURE_HTML}
  </div>`;
}

function postCallText(name: string): string {
  return `Hi ${name}, good to speak earlier.

Here's my website: https://dygiko.com

On there you can see various demos of the custom apps and websites I offer.

Would be great to get on a short consultation call with you whenever you're available.

Kind regards,

Sam Sako
dygiko.com`;
}

/** Post-call note, sent from the call tracker the moment you hang up. */
// SMTP lets you set any From header, but Zoho only relays it if the address is
// the mailbox itself or a verified "Send Mail As" alias — otherwise 553. Ask
// for the preferred address, fall back to the authenticated one rather than
// dropping the email, and report which was used.
const POSTCALL_FROM = process.env.DYGIKO_FROM_EMAIL || "info@dygiko.com";

export async function sendPostCallEmail(to: string, name?: string): Promise<{ from: string }> {
  const t = transporter();
  const user = process.env.ZOHO_MAIL_USER;
  if (!t || !user) throw new Error("Email not configured");
  // No name given: "Hi, good to speak earlier" still reads fine.
  const first = ((name || "").trim().split(/\s+/)[0] || "").slice(0, 40);
  const mail = {
    to: to.trim(),
    subject: "Good to speak earlier",
    html: postCallHtml(first).replace("Hi , ", "Hi, "),
    text: postCallText(first).replace("Hi , ", "Hi, "),
  };
  try {
    await t.sendMail({ ...mail, from: `Sam Sako <${POSTCALL_FROM}>`, replyTo: POSTCALL_FROM });
    return { from: POSTCALL_FROM };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/553|relay|not allowed|sender/i.test(msg) || POSTCALL_FROM === user) throw err;
    console.warn(`Zoho refused From ${POSTCALL_FROM}; falling back to ${user}`);
    await t.sendMail({ ...mail, from: `Sam Sako <${user}>`, replyTo: user });
    return { from: user };
  }
}

export async function sendFollowupEmail(to: string, trade?: string): Promise<void> {
  const t = transporter();
  const user = process.env.ZOHO_MAIL_USER;
  if (!t || !user) throw new Error("Email not configured");
  const tradeWord = ((trade || "").trim() || "electricians").slice(0, 40);
  await t.sendMail({
    from: `Sam Sako <${user}>`,
    replyTo: user,
    to: to.trim(),
    subject: `Systems for ${tradeWord}`,
    html: bodyHtml(tradeWord),
    text: bodyText(tradeWord),
  });
}
