// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.2.0?target=deno'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isTestMode = (Deno.env.get('STRIPE_SECRET_KEY') || '').startsWith('sk_test')

const TIERS = {
  pro: isTestMode ? 'prod_UGTiwPARiKg9eJ' : 'prod_UGSa63cBVrF1Ro',
  agency: isTestMode ? 'prod_UGTiL1xq0h7T4g' : 'prod_UGSfHkV8NfkgSt',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Create Supabase client with the user's Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user via native Supabase Auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Invalid JWT: User not confirmed')

    console.log(`[create-checkout] User identified: ${user.email} (${user.id})`)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey)

    const { tier, interval = 'month' } = await req.json()
    const productId = TIERS[tier as keyof typeof TIERS]
    if (!productId) throw new Error(`Invalid tier: ${tier}`)
    
    console.log(`[create-checkout] Selected tier: ${tier}, productId: ${productId}`)

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      recurring: { interval },
      limit: 1,
    })

    if (prices.data.length === 0) {
      throw new Error(`No active ${interval} price found for tier: ${tier}`)
    }

    // Stripe Accounts V2 requirement: explicitly retrieve or create a customer in test mode
    let customerId: string
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      console.log(`[create-checkout] Found existing customer: ${customerId}`)
      
      // Check for active subscriptions to prevent double-billing
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })
      
      if (subscriptions.data.length > 0) {
        console.log(`[create-checkout] Active subscription found. Redirecting to Portal instead of Checkout.`)
        // Create a portal session for proration-friendly updates
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get('origin') || 'http://localhost:5173'}/`,
        })
        
        return new Response(JSON.stringify({ url: portalSession.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUUID: user.id,
        },
      })
      customerId = customer.id
      console.log(`[create-checkout] Created new customer: ${customerId}`)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/`,
      metadata: {
        user_id: user.id,
        tier: tier,
        annual: interval === 'year' ? 'true' : 'false',
      },
    })

    console.log(`[create-checkout] Session created: ${session.id}`)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(`[create-checkout] CRITICAL FAILURE: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
