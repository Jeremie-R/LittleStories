const env = import.meta.env

/** Supabase project from VITE_SUPABASE_* env vars, or null to run device-only. */
export const supabaseConfig =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_KEY
    ? { url: env.VITE_SUPABASE_URL as string, key: env.VITE_SUPABASE_KEY as string }
    : null

export const cloudEnabled = supabaseConfig !== null

/** Digits in the email sign-in code (Supabase → Authentication → Providers → Email → OTP length). */
export const CODE_LENGTH = 6
