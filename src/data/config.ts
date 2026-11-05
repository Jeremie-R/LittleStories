// Read each variable by its full name: Vite then inlines only these two. Going through
// `const env = import.meta.env` would put every VITE_* variable in the public bundle.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

/** Supabase project from VITE_SUPABASE_* env vars, or null to run device-only. */
export const supabaseConfig = url && key ? { url, key } : null

export const cloudEnabled = supabaseConfig !== null

/** Digits Supabase can put in an email sign-in code. The exact length is a project setting. */
export const CODE_MIN = 6
export const CODE_MAX = 10
