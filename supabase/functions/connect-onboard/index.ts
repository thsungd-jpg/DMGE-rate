// Starts (or resumes) Stripe Connect onboarding for the signed-in Agency user.
// Accounts v2, SaaS pattern: the freelancer is the merchant of record and uses the full Stripe Dashboard.
// Secrets: STRIPE_SECRET_KEY (use a restricted rk_ key), SUPABASE_SERVICE_ROLE_KEY, APP_URL (optional).
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const STRIPE_VERSION = '2026-09-30.endive'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function stripeV2(path: string, body: unknown) {
  const res = await fetch(`https://api.stripe.com/v2${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      'Stripe-Version': STRIPE_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`)
  return data
}

// Card payments active on the connected account (v2 capability path, not the deprecated charges_enabled).
export async function isReady(accountId: string): Promise<boolean> {
  const res = await fetch(`https://api.stripe.com/v2/core/accounts/${accountId}?include[]=configuration.merchant`, {
    headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`, 'Stripe-Version': STRIPE_VERSION },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`)
  return data?.configuration?.merchant?.capabilities?.card_payments?.status === 'active'
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Invalid JWT: Access denied')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Online payments are an Agency feature (jobs must live in Supabase for the webhook to mark them paid).
    const { data: sub } = await admin.from('subscriptions').select('tier').eq('user_id', user.id).single()
    if (sub?.tier !== 'agency') throw new Error('Online payments are part of the Agency plan.')

    const body = await req.json().catch(() => ({}))
    if (body?.action === 'status') {
      const { data: existing } = await admin.from('connect_accounts').select('stripe_account_id').eq('user_id', user.id).maybeSingle()
      if (!existing) return json({ connected: false, ready: false })
      return json({ connected: true, ready: await isReady(existing.stripe_account_id) })
    }

    const appUrl = (Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://dmge.world').replace(/\/$/, '')

    let { data: row } = await admin.from('connect_accounts').select('stripe_account_id').eq('user_id', user.id).maybeSingle()
    if (!row) {
      const account = await stripeV2('/core/accounts', {
        contact_email: user.email,
        dashboard: 'full',
        identity: { country: 'us', entity_type: 'individual' },
        configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
        defaults: {
          currency: 'usd',
          responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' },
          locales: ['en-US'],
        },
      })
      const { error } = await admin.from('connect_accounts').insert({ user_id: user.id, stripe_account_id: account.id })
      if (error) throw new Error(error.message)
      row = { stripe_account_id: account.id }
    }

    const link = await stripeV2('/core/account_links', {
      account: row.stripe_account_id,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['merchant'],
          return_url: `${appUrl}/?connect=return`,
          refresh_url: `${appUrl}/?connect=refresh`,
        },
      },
    })
    return json({ url: link.url })
  } catch (error: any) {
    console.error('[connect-onboard]', error.message)
    return json({ error: error.message }, 400)
  }
})
