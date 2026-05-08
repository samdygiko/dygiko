# Zoho email templates

Six standalone HTML files — three packages × two billing intervals.

| File | Package | Stripe link |
|---|---|---|
| `website-monthly.html` | Website — £69/month | `fZueVdbUk2B16gYaxofjG01` |
| `crm-monthly.html` | CRM — £129/month | `00wbJ1f6wdfFfRy8pgfjG0e` |
| `websitecrm-monthly.html` | Website + CRM — £149/month | `bJe3cv8I8cbB48QeNEfjG0c` |
| `website-annual.html` | Website — £690/year (2 months free) | `4gM28r7E4ejJgVCeNEfjG0a` |
| `crm-annual.html` | CRM — £1,290/year (2 months free) | `28E28raQgfnNdJqfRIfjG0f` |
| `websitecrm-annual.html` | Website + CRM — £1,490/year (2 months free) | `00wbJ1cYodfF8p6dJAfjG0d` |

## Theme

All templates ship light by default and auto-flip to dark when the recipient's device is in dark mode (via `prefers-color-scheme` media query).

## Placeholders

Each template contains `[First name]` and `[Business name]` — replace before sending, or swap for Zoho's merge tags if you set up a contact field for them.

## Suggested subject lines

| Template | Subject |
|---|---|
| `website-monthly.html` | `[Business name] — your Dygiko Website quote (£69/mo)` |
| `crm-monthly.html` | `[Business name] — your Dygiko CRM quote (£129/mo)` |
| `websitecrm-monthly.html` | `[Business name] — your Dygiko Website + CRM quote (£149/mo)` |
| `website-annual.html` | `[Business name] — Dygiko Website, £690/yr (2 months free)` |
| `crm-annual.html` | `[Business name] — Dygiko CRM, £1,290/yr (2 months free)` |
| `websitecrm-annual.html` | `[Business name] — Dygiko Website + CRM, £1,490/yr (2 months free)` |

## Copy a template to clipboard

Run any of these in your terminal (or paste with `! ` prefix in Claude Code):

```bash
pbcopy < ~/Desktop/dygiko/email-templates/website-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/crm-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/websitecrm-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/website-annual.html
pbcopy < ~/Desktop/dygiko/email-templates/crm-annual.html
pbcopy < ~/Desktop/dygiko/email-templates/websitecrm-annual.html
```

Then paste into Zoho → New Template → switch to HTML view → **Cmd+V**.
