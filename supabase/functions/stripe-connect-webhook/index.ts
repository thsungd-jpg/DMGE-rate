// Connect webhook (events from connected accounts): marks an invoice paid when its Checkout Session is paid.
// Stripe Dashboard > Developers > Webhooks > add endpoint, "Listen to events on Connected accounts":
//   https://<project>.supabase.co/functions/v1/stripe-connect-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed
// Secrets: STRIPE_CONNECT_WEBHOOK_SECRET (this endpoint's own whsec_), SUPABASE_SERVICE_ROLE_KEY.
// Deploy with --no-verify-jwt (Stripe does not send a Supabase JWT; the signature is the authentication).
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

async function verify(rawBody: string, header: string, secret: string) {
  let t = ''
  const v1s: string[] = []
  for (const part of header.split(',')) {
    const p = part.trim()
    const eq = p.indexOf('=')
    if (eq === -1) continue
    const k = p.slice(0, eq)
    const v = p.slice(eq + 1)
    if (k === 't') t = v
    if (k === 'v1' && v) v1s.push(v)
  }
  if (!t || v1s.length === 0) throw new Error('Invalid stripe-signature header')
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) throw new Error('Webhook timestamp outside tolerance')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`))
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (!v1s.some((s) => timingSafeEqualHex(s.toLowerCase(), expected))) throw new Error('Webhook signature verification failed')
  return JSON.parse(rawBody)
}

serve(async (req: any) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const secret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')
  const sigHeader = req.headers.get('stripe-signature')
  if (!secret || !sigHeader) return new Response('Missing signature or secret', { status: 400 })

  let event: any
  try {
    event = await verify(await req.text(), sigHeader, secret)
  } catch (e: any) {
    console.error('[connect-webhook] verify failed:', e.message)
    return new Response('Bad signature', { status: 400 })
  }

  const handled = ['checkout.session.completed', 'checkout.session.async_payment_succeeded']
  if (!handled.includes(event.type)) return new Response('ignored', { status: 200 })

  const session = event.data?.object
  // Fulfil only when money has actually arrived (async methods complete the session while still unpaid).
  if (!session || session.payment_status === 'unpaid') return new Response('not paid yet', { status: 200 })

  const jobId = session.metadata?.job_id
  const userId = session.metadata?.user_id
  if (!jobId || !userId) return new Response('no invoice metadata', { status: 200 })

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  // Idempotency: Stripe retries; handle each event id once.
  const { error: dupe } = await admin.from('processed_stripe_events').insert({ event_id: event.id })
  if (dupe) return new Response('duplicate', { status: 200 })

  // The event must come from the connected account we created for this user (defence against forged metadata).
  const { data: acct } = await admin.from('connect_accounts').select('stripe_account_id').eq('user_id', userId).maybeSingle()
  if (!acct || acct.stripe_account_id !== event.account) {
    console.error('[connect-webhook] account mismatch for job', jobId)
    return new Response('account mismatch', { status: 200 })
  }

  const { data: row } = await admin.from('jobs').select('data').eq('id', jobId).eq('user_id', userId).maybeSingle()
  if (!row) return new Response('job not found', { status: 200 })

  const paidAt = new Date().toISOString()
  const next = { ...row.data, status: 'paid', invoiceStatus: 'paid', paidAt, paidOnline: true, stripeCheckoutSessionId: session.id }
  const { error } = await admin.from('jobs').update({ data: next }).eq('id', jobId).eq('user_id', userId)
  if (error) {
    // Let Stripe retry: release the idempotency marker.
    await admin.from('processed_stripe_events').delete().eq('event_id', event.id)
    console.error('[connect-webhook] update failed', error.message)
    return new Response('update failed', { status: 500 })
  }
  return new Response('ok', { status: 200 })
})
