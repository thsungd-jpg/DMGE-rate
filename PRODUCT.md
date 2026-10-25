# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Solo creative freelancers (photo, video, film, design, illustration, music and tech crafts) who price jobs themselves and invoice clients directly, plus small studios and agencies who need client lists, branded invoices and shared analytics (the Agency plan). They work between jobs on a phone or laptop, often mid-conversation with a client, and need a defensible number fast.

## Product Purpose
DMGE (dmge.world) turns a job description into a fair price and a professional invoice. The user picks craft, role and pricing model, says who the work is for and how it will be used, and gets three prices (Budget, Fair, Premium). They save the one they quote as a job, edit the invoice and email it as a PDF. Success is a freelancer who stops undercharging and sends a polished invoice in minutes.

## Positioning
A craft-aware quote that flows straight into a branded invoice: pricing responds to role, complexity, usage rights (term, scope, exclusivity for photo/video crafts), client type, rush and materials, then becomes the invoice. Generic rate calculators stop at an hourly rate; invoicing suites do not price creative work; licensing tools are photography-only.

## Operating Context
Installable PWA on React and Vite, with Supabase auth and storage and Stripe subscriptions (Free, Pro, Agency). Works offline for the calculator; Agency adds cloud sync, analytics, CSV export and white-label branding. Invoices export to PDF and send by email through a Supabase edge function. Hosted on Netlify. Live site is `main`; redesign work lives on `redesign/liquid-ledger` and feature branches.

## Capabilities and Constraints
- Tabs: Quote (calculator), Jobs (quotes and invoices with status), Templates, Clients (with rate multipliers, CSV import/export), Insights (Agency), Profile, Plans, Tutorial.
- Tier limits and gating live in `src/utils/subscription.js`; handlers for Supabase and Stripe must not be altered by visual work.
- Planned (see `docs/competitive-features-plan.md`): licensing split (done for photo/video), margin and buffer line, Stripe pay-online link on invoices (Agency, test mode only until live keys are approved), market-range band, tax and fee helpers.
- Open: whether the Pro "Basic export" bullet is accurate; whether the invoice sheet total should use the quoted price (it currently uses base rate x units).

## Brand Commitments
Name stays DMGE. The identity chosen in the redesign is "Sorbet Ink": a candy-marbled pastel liquid on warm cream by day and a black starfield by night, Instrument Serif headings with italic accent words, DM Sans for UI, DM Mono for figures, the "jelly pillow" logo mark. No retro or pixel styling.

## Evidence on Hand
Real: the working app and its mock-data test mode (`?mock=1`), generated brand art in `src/assets`, web research notes in `docs/competitive-features-plan.md`. Absent, so never fabricate: customer testimonials, user counts, case studies, press, market-rate datasets.

## Product Principles
- Show the working, not just the number: every price explains what moved it.
- Defensible by default: usage rights and complexity are visible line items a client can understand.
- Quote to invoice in one flow, with no retyping.
- Free tier is genuinely useful; paid tiers add studio features, not basic dignity.
- Calm and fast on a phone: one clear next step per screen.

## Accessibility & Inclusion
Target WCAG 2.2 AA. Respect reduced motion; the ambient liquid is decorative and must never block reading or input. Keyboard operable throughout, including modals and menus.
