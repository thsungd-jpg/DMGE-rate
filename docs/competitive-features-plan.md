# Competitive features plan (branch: redesign/liquid-ledger, follow-up branches)

Research summary (web research 2026-10-24; vendor pages and blogs, prices unverified, re-check before quoting them).

## Where DMGE sits
- **Rate calculators** (freelancerates.net, freelancehourlyrate.com, RateForge, WhatShouldICharge, XO3D): work backward from income goal, tax, expenses, billable hours. Generic, no usage rights, no invoice.
- **Licensing tools** (fotoQuote about $170 one-time, BlinkBid from about $38/mo): deep usage/licence pricing, photography only, desktop-era UX, heavy.
- **All-in-one** (Bonsai, HoneyBook, Harvest, Wave, Invoice Ninja): proposals, e-sign, online payment link. No creative pricing logic.
- **DMGE's lane:** the only one pairing a craft-aware quote (role, complexity, usage rights, client type, rush, materials) with three tiers and a branded invoice, in a pleasant mobile-first app. Nobody does it across film, music, tech and visual crafts.

## Features, in build order
1. **Base-rate finder** (Profile + Calculator top bar). Inputs: income goal, billable hours/week, weeks off, expenses, tax set-aside. Output: base rate, with "Use as my base rate". Pure client-side math; no backend. Effort: small.
2. **Licensing split** on quote and invoice. Replace the single usage multiplier with an explicit line: labor (base x units x complexity) and usage licence (term: 30 days / 1 yr / 3 yr / perpetual; scope: personal / commercial / merch / exclusive; exclusivity toggle). Research ranges to seed (treat as defaults, user-editable): 1-yr about 2-3x a 30-day baseline, perpetual 10-25x, exclusivity 1.5-3x. Show as two line items on the invoice sheet and PDF. Must keep `calcPrice` outputs stable for existing saved jobs (add new fields, default to current multipliers). Effort: medium.
3. **Margin and buffer check** on the quote panel: "contingency 10-25%" toggle and a plain "you keep about $X after tax and expenses" line using the base-rate finder inputs. Effort: small.
4. **Pay-online link on invoices** (largest gap vs HoneyBook/Bonsai/Wave). New edge function `create-invoice-payment` creating a Stripe Payment Link or Checkout Session for the invoice total; link goes into the emailed PDF and the invoice sheet; webhook marks the job Paid. Agency tier first. Needs the stripe-best-practices skill review, webhook idempotency, test-mode first. Effort: medium-large; needs the user's go-ahead for any live-mode keys.
5. **Market-range band** on the three tiers: small per-craft low/high range from public sources (Graphic Artists Guild style data, BLS), shown as a muted band. Needs a vetted data set and attribution, so do last; skip if no reliable source. Effort: medium plus research. **Done differently (2026-11-06):** as the *Quick check* on the Rate step of the Quote page, from BLS wages only, only where an occupation honestly matches, with source and year (see `docs/landing-build-plan.md`). There is no free freelance-rate data set to cite, so there is no band on the tiers.
6. **Tax and fee helpers**: Stripe/PayPal fee line on the invoice ("pass the fee on"), self-employment tax estimate in the base-rate finder. Effort: small.

## Cross-cutting
- Accessibility pass with the `accessibility` skill before each release (keyboard order in the dock/More sheet, modal focus trap, chart table fallbacks).
- Playwright end-to-end suite (`playwright-best-practices`) driven by the dev mock session: calc to save, jobs filters, invoice editor, client CRUD, theme toggle, locked Insights. Add before feature 4.
- Supabase: any new profile fields (income goal, hours) go through the existing `saveProfile`; check RLS with the `supabase` skill.
- Each feature on its own branch off `redesign/liquid-ledger` (or off `main` after the redesign merges); nothing pushed or deployed without explicit approval.

## Status
- Done: base-rate finder, licensing split (photo/video), margin and buffer line, the sourced Quick check (item 5, in a different form).
- Designed, waiting on decisions: pay-online link, see `docs/pay-link-architecture.md`.

## Decisions (2026-10-24)
- Licensing defaults start with photo/video crafts; music and design follow.
- Stripe test mode only for the pay link until the user approves live keys.
- Base-rate finder is available on every tier (acquisition); the pay-online link stays Agency.
