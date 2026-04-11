import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Stripe Workbench → Webhooks → + Add destination:
 *   https://losocdmndydgmqdrcoyc.supabase.co/functions/v1/stripe-webhook
 * Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.
 * supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... (Dashboard signing secret; do not mix with `stripe listen` whsec_ unless listen targets this URL and you use that same secret).
 */
const isTestMode = (Deno.env.get('STRIPE_SECRET_KEY') || '').startsWith('sk_test')

const PRODUCT_TO_TIER: Record<string, 'pro' | 'agency'> = {
  [isTestMode ? 'prod_UGTiwPARiKg9eJ' : 'prod_UGSa63cBVrF1Ro']: 'pro',
  [isTestMode ? 'prod_UGTiL1xq0h7T4g' : 'prod_UGSfHkV8NfkgSt']: 'agency',
}

interface StripeSubscription {
  id: string
  status: string
  customer: string | { id: string }
  current_period_end: number | null
  items: { data: Array<{ price?: { product?: string | { id: string } } }> }
}

interface StripeCheckoutSession {
  mode: string | null
  subscription: string | StripeSubscription | null
  client_reference_id?: string | null
  metadata?: { user_id?: string; tier?: string } | null
  customer?: string | { id?: string } | null
}

interface StripeCustomer {
  deleted?: boolean
  metadata?: { user_id?: string } | null
}

interface StripeEvent {
  type: string
  data: { object: StripeCheckoutSession | StripeSubscription }
}

// Function removed: Stripe signing secrets are used as raw strings for HMAC.

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

async function verifyStripeWebhook(
  rawBody: string,
  stripeSignature: string,
  webhookSecret: string,
): Promise<StripeEvent> {
  const timestamp = new Map<string, string>()
  const v1s: string[] = []
  for (const part of stripeSignature.split(',')) {
    const p = part.trim()
    const eq = p.indexOf('=')
    if (eq === -1) continue
    const k = p.slice(0, eq)
    const v = p.slice(eq + 1)
    if (k === 't') timestamp.set('t', v)
    if (k === 'v1' && v) v1s.push(v)
  }
  const t = timestamp.get('t')
  if (!t || v1s.length === 0) throw new Error('Invalid stripe-signature header')

  const ageSec = Math.abs(Date.now() / 1000 - Number(t))
  if (!Number.isFinite(ageSec) || ageSec > 300) throw new Error('Webhook timestamp outside tolerance')

  const signedPayload = `${t}.${rawBody}`
  const keyBytes = new TextEncoder().encode(webhookSecret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signedPayload),
  )
  const expectedHex = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('')

  const ok = v1s.some((s) => timingSafeEqualHex(s.toLowerCase(), expectedHex))
  if (!ok) throw new Error('Webhook signature verification failed')

  return JSON.parse(rawBody) as StripeEvent
}

async function stripeGet<T>(pathWithQuery: string): Promise<T> {
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  const res = await fetch(`https://api.stripe.com/v1${pathWithQuery}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Stripe API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

function tierFromSubscription(sub: StripeSubscription): 'pro' | 'agency' | 'free' {
  const status = sub.status
  if (status !== 'active' && status !== 'trialing') return 'free'
  const item = sub.items.data[0]
  if (!item?.price?.product) return 'free'
  const pid = typeof item.price.product === 'string' ? item.price.product : item.price.product.id
  return PRODUCT_TO_TIER[pid] ?? 'free'
}

serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const url = Deno.env.get('SUPABASE_URL')

  if (!sig || !whSecret || !serviceKey || !url) {
    console.error('[webhook] Missing configuration')
    return new Response(JSON.stringify({ error: 'Missing webhook configuration' }), { status: 500 })
  }

  const body = await req.text()

  let event: StripeEvent
  try {
    event = await verifyStripeWebhook(body, sig, whSecret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[webhook] Verification failed:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 400 })
  }

  console.log(`[webhook] Received event: ${event.type}`)
  const supabaseAdmin = createClient(url, serviceKey)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeCheckoutSession
      console.log(`[webhook] Processing checkout session: ${session.mode}`)
      
      if (session.mode !== 'subscription' || !session.subscription) {
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }
      
      const userId = session.client_reference_id || session.metadata?.user_id
      if (!userId) {
        console.error('[webhook] No user ID found on checkout session')
        return new Response(JSON.stringify({ error: 'No user id on session' }), { status: 400 })
      }

      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      const sub = await stripeGet<StripeSubscription>(
        `/subscriptions/${encodeURIComponent(subId)}?expand[]=items.data.price.product`,
      )
      
      let tier: 'pro' | 'agency' | 'free' = tierFromSubscription(sub)
      const mt = session.metadata?.tier
      if (mt === 'pro' || mt === 'agency') tier = mt

      console.log(`[webhook] Upserting subscription for user ${userId}: tier=${tier}`)

      const end = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null

      const { error } = await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        tier,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripe_subscription_id: sub.id,
        current_period_end: end,
      }, { onConflict: 'user_id' })

      if (error) {
        console.error('[webhook] Database upsert failed:', error)
        throw error
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as StripeSubscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      console.log(`[webhook] Processing ${event.type} for customer ${customerId}`)

      const customers = await stripeGet<StripeCustomer>(`/customers/${encodeURIComponent(customerId)}`)
      if (customers.deleted) {
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }
      
      const userId = customers.metadata?.user_id
      if (!userId) {
        console.warn(`[webhook] No user_id in customer metadata for ${customerId}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      const tier = event.type === 'customer.subscription.deleted' ? 'free' : tierFromSubscription(sub)
      const end = sub.current_period_end && tier !== 'free'
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null

      console.log(`[webhook] Updating subscription for user ${userId}: tier=${tier}`)

      const { error } = await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: tier === 'free' ? null : sub.id,
        current_period_end: end,
      }, { onConflict: 'user_id' })

      if (error) {
        console.error('[webhook] Database update failed:', error)
        throw error
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[webhook] Internal error:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
})
