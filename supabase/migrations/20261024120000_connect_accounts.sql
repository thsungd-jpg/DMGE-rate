-- Stripe Connect (Accounts v2) connected accounts: one per DMGE user who takes invoice payments online.
-- Written only by edge functions with the service role; users may read their own row.
CREATE TABLE IF NOT EXISTS public.connect_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.connect_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connect_accounts_select_own" ON public.connect_accounts;
CREATE POLICY "connect_accounts_select_own" ON public.connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Stripe event ids already handled by stripe-connect-webhook (idempotency).
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY; -- no policies: service role only
