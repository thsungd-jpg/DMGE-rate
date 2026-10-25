# Pay-online link for invoices (Agency): architecture and open decisions

Status: designed, not built. Blocked on the decisions at the bottom, because it moves other people's money.

## Why this is not a "payment link on our Stripe account"
Invoice payments belong to the freelancer, not to DMGE. Routing them through DMGE's own Stripe account would make DMGE a
money transmitter (payouts, tax reporting, disputes). Stripe's guidance for software that lets sellers run their own
business is **Connect, SaaS pattern**:

- Accounts v2 (`POST /v2/core/accounts`), `configuration.merchant` with `card_payments`, `dashboard: "full"`,
  `fees_collector: "stripe"`, `losses_collector: "stripe"` (the connected freelancer is merchant of record).
- **Direct charges** on the connected account, optional `application_fee_amount` if DMGE wants a cut.
- Embedded onboarding (`account_onboarding`) plus `notification_banner` in Profile.
- Never `type: express|standard|custom`, never `payment_method_types`; use a restricted key (`rk_`), a `StripeClient`,
  and a separate Stripe sandbox for development.
- Capability check before charging: `configuration.merchant.capabilities.card_payments.status === 'active'`.

## Flow
1. Profile > Payments (Agency): "Connect Stripe" starts embedded onboarding for a v2 connected account; store
   `stripe_account_id` on the user's row (Supabase, RLS: owner only).
2. Jobs / invoice editor: "Get pay link" calls a new edge function `create-invoice-payment`:
   verifies the JWT, loads the job from Supabase (cloud-synced on Agency), creates a Checkout Session on the connected
   account for `job.price` (+ optional fee line), `metadata.job_id`, success/cancel URLs back to the app, and returns the URL.
3. The link is added to the emailed invoice (`send-invoice`) and the PDF as a "Pay online" line.
4. `stripe-webhook` (Connect endpoint) handles `checkout.session.completed` and `checkout.session.async_payment_succeeded`
   (gated on `payment_status === 'paid'`), idempotent on event id, then sets the job to Paid with `paidAt`.
5. Refunds and disputes stay in the freelancer's own Stripe Dashboard.

## Why Agency only
Webhook updates need the job in Supabase; Free/Pro jobs live only in the browser. Agency already syncs to the cloud.

## Decisions needed from the owner
1. **Go ahead with Connect?** It adds KYC onboarding for every freelancer and a Stripe platform profile for DMGE.
2. **Platform fee:** none, or a percentage via `application_fee_amount`? (Stripe's own fee, about 2.9% + $0.30, is paid by
   the freelancer under this pattern.)
3. **Environment:** create a Stripe sandbox with Connect enabled (`stripe sandbox create`) and provide a restricted test
   key for the Supabase edge function secrets. Nothing goes live without explicit approval.
4. The existing edge functions pin `stripe@12.2.0` / API 2022-11-15; Connect v2 needs a current SDK, so the new function
   should use the latest (`StripeClient`) without touching the subscription functions.
