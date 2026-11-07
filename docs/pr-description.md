# DMGE redesign: Liquid Ledger / Sorbet Ink, plus competitive features

Base: `main`. Head: `feature/tax-fee-helpers` (32 commits, a linear stack that contains every branch below).

## What this is
A full redesign of dmge.world as an animated, scroll-driven site and a rebuilt app, in a new "Sorbet Ink" identity
(pastel marbled liquid on warm cream by day, black starfield at night; Instrument Serif, DM Sans, DM Mono), followed by
features drawn from competitor research.

## Redesign
- Landing: WebGL liquid scene that morphs through craft, usage, Budget/Fair/Premium, invoice, plans and sign-up.
  Floating dock, night mode, sparkles and smoke, tiny floating blobs, reduced-motion and no-WebGL fallbacks.
- App: every screen rebuilt (Quote, Jobs, invoice editor, Templates, Clients, Insights, Profile, Plans, Tutorial, modals)
  on a shared kit and tokens; the liquid flies out and back in between tabs.
- Auth, PDF invoice, logo, icons and manifest restyled. Retro/pixel code, fonts and legacy styles removed.
- Dev-only mock session (`?mock=1`) for testing; dead code in production.

## Features
- Base-rate finder (Profile, all plans) with tax presets and a US self-employment tax estimate.
- Licence term and category exclusivity for film/photo/video/illustration, with a creative-fee / usage-licence split on
  the quote; saved jobs without a term price exactly as before.
- Contingency buffer and a "you keep about $X" line on the quote; one-tap Stripe/PayPal fee picks.
- Pay-online link for Agency (Stripe Connect, Accounts v2, direct charges): three edge functions + migration.
  **Deployed to the live Supabase project but unused by `main`; see Risks.**

## Quality
- Accessibility: modal focus management, listbox keyboard support, labelled selects, reduced motion that keeps feedback,
  AA contrast for tone text, 44px touch targets on phones.
- Performance: main chunk 1.76 MB to about 590 KB (Insights and html2pdf load on demand); adaptive render scale and a 30fps
  cap for the ambient liquid.

## Verification
Production build passes. Every tab checked at 375px and 1440px in light and dark with no console errors and no horizontal
overflow, using the mock session. Not covered: real-device GPU performance, PDF export after lazy-loading, real
Supabase/Stripe flows, the Stripe end-to-end payment test (paused at hosted onboarding).

## Risks and decisions for the reviewer
1. **Edge functions already deployed** to project `losocdmndydgmqdrcoyc` (`connect-onboard`, `create-invoice-payment`,
   `stripe-connect-webhook`) and migration `20261024120000_connect_accounts.sql` applied (two new tables, RLS on).
   Additive only; the subscription functions and secrets are untouched. The Connect functions use their own
   `STRIPE_CONNECT_SECRET_KEY`, currently a sandbox test key (rotate it; it was pasted into a chat).
2. **Pay link is unverified end to end.** Request shapes were verified against a Stripe sandbox; a full payment was not.
   Consider hiding the Agency UI behind a flag until that passes, and switch to a restricted live key before real use.
3. **Existing quirks left as-is:** the invoice sheet total is base rate x units rather than the saved quote price; the
   Pro plan lists "Basic export" while the table says CSV export is Agency-only.
4. Licence multipliers (0.5 / 1.0 / 1.6 / 3.0, exclusivity x1.5) are conservative defaults from web research; validate
   against real rate guides.
5. White-label brand colours now only affect invoices and PDFs, not the in-app look.
6. Large diff (about 230 files). Suggested review order: tokens/kit, shell and landing, screens, then features and functions.
