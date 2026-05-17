ATS Resume Builder (Static MVP)

How to run:
- Open index.html in your browser.
- Or serve the folder with any static server.

Pages:
- index.html (landing)
- builder.html (resume builder with autosave + print-to-PDF)
- ats.html (keyword match checker)
- guides/ (SEO content pages)
- privacy.html, terms.html (AdSense compliance)
- sitemap.xml, robots.txt (SEO)

AdSense:
- Replace the placeholder ad slots with your AdSense code after approval.
- Avoid placing ads near the Export PDF button.

Notes:
- User data is stored locally in the browser (localStorage).

New additions (May 2026):
- Added a free "ATS Optimization Checklist" lead magnet at `lead-magnet.html` (printable PDF via browser print)
- Added client-side premium gating and trial UI (`pricing.html` placeholder and `premium.js`) for demo purposes
- Added `ui-enhancements.css` for modal and badge styles

Integrations & next steps:
- Connect `lead-magnet` subscription to Mailchimp/Form backend: replace front-end placeholder with your subscription endpoint.
- Integrate Stripe or Paddle for real payments; server-side components required for secure checkout.
- Consider adding server-side save/backup and user accounts for production.
