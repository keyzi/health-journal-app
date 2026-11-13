const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Local-only mode remains available when Supabase is not configured.
export const supabaseConfig = url && publishableKey
  ? { url, publishableKey }
  : null
import { createClient } from '@supabase/supabase-js'


export const supabase = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null
