import { createClient } from '@supabase/supabase-js'

let _client = null

function warnIfUrlRefMismatch(supabaseUrl, supabaseAnonKey) {
  try {
    const payload = supabaseAnonKey.split('.')[1]
    if (!payload) return
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
    const { ref } = JSON.parse(atob(b64 + pad))
    if (ref && !supabaseUrl.includes(ref)) {
      console.warn(
        `[Supabase] Your anon key is for project ref "${ref}" but VITE_SUPABASE_URL does not contain that ref. ` +
          'Fix typos in .env.local (URL + anon key must be the same project), then restart npm run dev.',
      )
    }
  } catch {
    /* ignore */
  }
}

function getClient() {
  if (_client) return _client
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
  const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add .env.local next to package.json, then restart: npm run dev',
    )
  }
  warnIfUrlRefMismatch(supabaseUrl, supabaseAnonKey)
  _client = createClient(supabaseUrl, supabaseAnonKey)
  return _client
}

/** Lazy client so missing env does not crash module load before App can show the config screen. */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const c = getClient()
      const v = c[prop]
      return typeof v === 'function' ? v.bind(c) : v
    },
  },
)
