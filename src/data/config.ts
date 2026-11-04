// Read each variable by its full name: Vite then inlines only these two. Going through
// `const env = import.meta.env` would put every VITE_* variable in the public bundle.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

/** Supabase project from VITE_SUPABASE_* env vars, or null to run device-only. */
export const supabaseConfig = url && key ? { url, key } : null

export const cloudEnabled = supabaseConfig !== null

/** Digits in the email sign-in code (Supabase → Authentication → Providers → Email → OTP length). */
export const CODE_LENGTH = 6
