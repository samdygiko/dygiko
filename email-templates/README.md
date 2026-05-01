# Zoho email templates

Six standalone HTML files — three packages × two billing intervals.

| File | Package | Stripe link |
|---|---|---|
| `basic-monthly.html` | Basic — £49/month | `4gMcN5aQg1wXdJq20SfjG00` |
| `growth-monthly.html` | Growth — £69/month | `fZueVdbUk2B16gYaxofjG01` |
| `full-business-monthly.html` | Full Business — £99/month | `bJebJ19McdfFdJq0WOfjG02` |
| `basic-annual.html` | Basic — £490/year (save £98) | `eVq5kD4rS4J9gVC8pgfjG09` |
| `growth-annual.html` | Growth — £690/year (save £138) | `4gM28r7E4ejJgVCeNEfjG0a` |
| `full-business-annual.html` | Full Business — £990/year (save £198) | `6oU7sL1fG8Zp48Q0WOfjG0b` |

## Theme

All templates ship light by default and auto-flip to dark when the recipient's device is in dark mode (via `prefers-color-scheme` media query).

## Placeholders

Each template contains `[First name]` and `[Business name]` — replace before sending, or swap for Zoho's merge tags if you set up a contact field for them.

## Suggested subject lines

| Template | Subject |
|---|---|
| `basic-monthly.html` | `[Business name] — your Dygiko website quote (Basic, £49/mo)` |
| `growth-monthly.html` | `[Business name] — your Dygiko website quote (Growth, £69/mo)` |
| `full-business-monthly.html` | `[Business name] — your Dygiko website quote (Full Business, £99/mo)` |
| `basic-annual.html` | `[Business name] — Dygiko Basic, £490/yr (save 17%)` |
| `growth-annual.html` | `[Business name] — Dygiko Growth, £690/yr (save 17%)` |
| `full-business-annual.html` | `[Business name] — Dygiko Full Business, £990/yr (save 17%)` |

## Copy a template to clipboard

Run any of these in your terminal (or paste with `! ` prefix in Claude Code):

```bash
pbcopy < ~/Desktop/dygiko/email-templates/basic-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/growth-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/full-business-monthly.html
pbcopy < ~/Desktop/dygiko/email-templates/basic-annual.html
pbcopy < ~/Desktop/dygiko/email-templates/growth-annual.html
pbcopy < ~/Desktop/dygiko/email-templates/full-business-annual.html
```

Then paste into Zoho → New Template → switch to HTML view → **Cmd+V**.
