import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────
// TIER DEFINITIONS
// ─────────────────────────────────────────────
export const TIERS = {
  free: {
    name: 'Free',
    badge: 'FREE',
    color: '#9E9E9E',
    limits: {
      clients: 20,
      templates: 20,
      historyDays: 30,
      pdfsPerDay: 5,
      csvExport: false,
      analytics: false,
      whiteLabel: false,
      cloudSync: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: 'Pro',
    badge: 'PRO',
    color: '#FFD700',
    prices: {
      monthly: 9,
      annual: 90,
    },
    limits: {
      clients: 100,
      templates: 100,
      historyDays: 30,
      pdfsPerDay: 25,
      csvExport: false,
      analytics: false,
      whiteLabel: false,
      cloudSync: false,
      prioritySupport: false,
    },
  },
  agency: {
    name: 'Agency',
    badge: 'AGENCY',
    color: '#E040FB',
    prices: {
      monthly: 29,
      annual: 290,
    },
    limits: {
      clients: 500,
      templates: 500,
      historyDays: 30,
      pdfsPerDay: 125,
      csvExport: true,
      analytics: true,
      whiteLabel: true,
      cloudSync: true,
      prioritySupport: true,
    },
  },
};

// ─────────────────────────────────────────────
// LIMIT CHECKS
// ─────────────────────────────────────────────
export function canAddClient(tier = 'free', currentCount) {
  const t = tier.toLowerCase();
  const limit = TIERS[t]?.limits.clients ?? TIERS.free.limits.clients;
  return currentCount < limit;
}

export function canAddClientsBatch(tier = 'free', currentCount, addingCount) {
  const t = tier.toLowerCase();
  const limit = TIERS[t]?.limits.clients ?? TIERS.free.limits.clients;
  if (limit === Infinity) return true;
  return currentCount + addingCount <= limit;
}

export function canAddTemplate(tier = 'free', currentCount) {
  const t = tier.toLowerCase();
  const limit = TIERS[t]?.limits.templates ?? TIERS.free.limits.templates;
  return currentCount < limit;
}

export function canExportCSV(tier = 'free') {
  return TIERS[tier.toLowerCase()]?.limits.csvExport ?? false;
}

export function canViewAnalytics(tier = 'free') {
  return TIERS[tier.toLowerCase()]?.limits.analytics ?? false;
}

export function canExportPDF(tier = 'free', todayPdfCount) {
  const t = tier.toLowerCase();
  const limit = TIERS[t]?.limits.pdfsPerDay ?? 1;
  return todayPdfCount < limit;
}

export function canWhiteLabel(tier = 'free') {
  return TIERS[tier.toLowerCase()]?.limits.whiteLabel ?? false;
}

export function canCloudSync(tier = 'free') {
  const t = tier.toLowerCase();
  const result = TIERS[t]?.limits.cloudSync ?? false;
  console.log('[canCloudSync] tier:', t, 'record:', TIERS[t], 'result:', result);
  return result;
}

export function canPrioritySupport(tier = 'free') {
  return TIERS[tier.toLowerCase()]?.limits.prioritySupport ?? false;
}

// ─────────────────────────────────────────────
// JOB HISTORY WINDOW
// ─────────────────────────────────────────────
export function getJobsWithinWindow(jobs, tier = 'free') {
  const t = tier.toLowerCase();
  const days = TIERS[t]?.limits.historyDays ?? 30;
  if (days === Infinity) return jobs;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return jobs.filter(j => new Date(j.date) >= cutoff);
}

// ─────────────────────────────────────────────
// USAGE STATS
// ─────────────────────────────────────────────
export function getUsageStats(tier = 'free', clientCount, templateCount, todayPdfCount) {
  const t = tier.toLowerCase();
  const limits = TIERS[t]?.limits || TIERS.free.limits;
  return {
    clients: { used: clientCount, max: limits.clients === Infinity ? '∞' : limits.clients, atLimit: clientCount >= limits.clients },
    templates: { used: templateCount, max: limits.templates === Infinity ? '∞' : limits.templates, atLimit: templateCount >= limits.templates },
    pdfsToday: { used: todayPdfCount, max: limits.pdfsPerDay === Infinity ? '∞' : limits.pdfsPerDay, atLimit: todayPdfCount >= limits.pdfsPerDay },
    historyDays: limits.historyDays === Infinity ? '∞' : limits.historyDays,
  };
}

// ─────────────────────────────────────────────
// SUPABASE SUBSCRIPTION (read-only from client; writes via Edge + webhooks)
// ─────────────────────────────────────────────
export async function loadSubscription() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { tier: 'free', stripe_customer_id: null };

  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, stripe_customer_id, stripe_subscription_id, current_period_end')
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) {
    return { tier: 'free', stripe_customer_id: null };
  }

  const normalized = {
    ...data,
    tier: (data.tier || 'free').toLowerCase()
  };

  if (normalized.current_period_end && new Date(normalized.current_period_end) < new Date()) {
    return { ...normalized, tier: 'free', expired: true };
  }

  return normalized;
}

/** Server / admin only — not used from browser after RLS lockdown */
export async function updateSubscriptionTier(tier, stripeData = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { error } = await supabase.from('subscriptions').upsert([{
    user_id: session.user.id,
    tier,
    ...stripeData,
  }], { onConflict: 'user_id' });

  if (error) console.error('[updateSubscription]', error);
}
