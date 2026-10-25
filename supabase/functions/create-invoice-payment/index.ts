// Creates a Stripe Checkout Session for one invoice as a DIRECT CHARGE on the freelancer's connected account.
// Secrets: STRIPE_SECRET_KEY (restricted rk_ key), SUPABASE_SERVICE_ROLE_KEY, APP_URL (optional),
//          PLATFORM_FEE_PERCENT (optional, default 0).
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
    const { data: sub } = await admin.from('subscriptions').select('tier').eq('user_id', user.id).single()
    if (sub?.tier !== 'agency') throw new Error('Online payments are part of the Agency plan.')

    const { jobId } = await req.json()
    if (!jobId) throw new Error('Missing jobId')

    // The job must belong to the caller; never trust an amount from the client.
    const { data: jobRow } = await admin.from('jobs').select('data').eq('id', jobId).eq('user_id', user.id).maybeSingle()
    if (!jobRow) throw new Error('Job not found')
    const job = jobRow.data || {}
    const total = Number(job.invoiceTotal ?? job.price)
    const cents = Math.round(total * 100)
    if (!Number.isFinite(cents) || cents < 50) throw new Error('This invoice total is below the minimum online payment ($0.50).')
    if (job.status === 'paid' || job.invoiceStatus === 'paid') throw new Error('This invoice is already marked paid.')

    const { data: acct } = await admin.from('connect_accounts').select('stripe_account_id').eq('user_id', user.id).maybeSingle()
    if (!acct) throw new Error('Connect your Stripe account first (Profile > Get paid online).')

    const feePct = Math.max(0, Math.min(20, Number(Deno.env.get('PLATFORM_FEE_PERCENT') || 0)))
    const feeCents = Math.floor(cents * feePct / 100)

    const appUrl = (Deno.env.get('APP_URL') || req.headers.get('origin') || 'https://dmge.world').replace(/\/$/, '')
    const label = `Invoice ${job.invoiceNumber || ''} ${job.role ? '- ' + job.role : ''}`.trim()

    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('line_items[0][quantity]', '1')
    form.set('line_items[0][price_data][currency]', 'usd')
    form.set('line_items[0][price_data][unit_amount]', String(cents))
    form.set('line_items[0][price_data][product_data][name]', label || 'Invoice')
    if (feeCents > 0) form.set('payment_intent_data[application_fee_amount]', String(feeCents))
    form.set('metadata[job_id]', String(jobId))
    form.set('metadata[user_id]', user.id)
    form.set('payment_intent_data[metadata][job_id]', String(jobId))
    form.set('success_url', `${appUrl}/?paid=1`)
    form.set('cancel_url', `${appUrl}/?paid=0`)
    // Tag sessions for the Dashboard (API 2026-03-25+); suffix is 8 random letters.
    form.set('integration_identifier', 'dmge-invoice-' + Array.from({ length: 8 }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]).join(''))

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': STRIPE_VERSION,
        'Stripe-Account': acct.stripe_account_id, // direct charge: the freelancer is merchant of record
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    const session = await res.json()
    if (!res.ok) throw new Error(session?.error?.message || `Stripe ${res.status}`)
    return json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('[create-invoice-payment]', error.message)
    return json({ error: error.message }, 400)
  }
})
