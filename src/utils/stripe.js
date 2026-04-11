import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

let stripePromise;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

function getSupabaseEdgeConfig() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  }
  return { url, anon };
}

/**
 * Call Edge Functions with explicit headers. Avoids supabase.functions.invoke quirks
 * (e.g. custom fetch / header merge) that can yield 401 on verify_jwt.
 */
async function invokeEdgeFunction(name, body, accessToken) {
  const { url, anon } = getSupabaseEdgeConfig();
  const res = await fetch(`${url}/functions/v1/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const errBody = data && typeof data.error === 'string' ? data.error : data?.error;
    const msg =
      (typeof errBody === 'string' && errBody) ||
      (errBody && JSON.stringify(errBody)) ||
      text ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function getValidSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  let session = data?.session ?? null;
  if (!session?.access_token) return null;
  const exp = session.expires_at;
  if (exp && exp * 1000 < Date.now() + 60_000) {
    const { data: ref, error: refErr } = await supabase.auth.refreshSession();
    if (!refErr && ref?.session?.access_token) session = ref.session;
  }
  return session;
}

export async function redirectToCheckout(tier, interval = 'month') {
  try {
    const session = await getValidSession();
    if (!session?.access_token) {
      throw new Error('You must be logged in to subscribe.');
    }

    const data = await invokeEdgeFunction('create-checkout', { tier, interval }, session.access_token);

    const { url } = data || {};
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned from server.');
    }
  } catch (err) {
    console.error('Error redirecting to checkout:', err);
    const msg = err.message || 'Payment setup failed. Please try again later.';
    const hint =
      /401|403|non-2xx|Unauthorized|Not authenticated/i.test(String(msg)) || err.status === 401
        ? '\n\nTip: disable ad blockers for Stripe. If this persists, open:\n' +
          `${window.location.origin}${window.location.pathname}?reset_auth=1\n` +
          'then sign in again. Also confirm .env.local URL + anon key are for the SAME Supabase project (check console for [Supabase] warning).'
        : '';
    alert(msg + hint);
  }
}

export async function redirectToBillingPortal() {
  try {
    const session = await getValidSession();
    if (!session?.access_token) {
      throw new Error('You must be logged in to manage your subscription.');
    }

    const data = await invokeEdgeFunction('create-portal-session', {}, session.access_token);

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No portal URL returned from server.');
    }
  } catch (err) {
    console.error('Error redirecting to portal:', err);
    const msg = err.message || 'Billing portal failed. Please try again later.';
    alert(msg);
  }
}
