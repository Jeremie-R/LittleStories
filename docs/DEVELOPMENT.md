# Developing Little Stories

## Run it

```bash
bun install
bun run dev        # http://localhost:5174 (also on your LAN, so you can open it on a phone)
bun run build      # type-check + production build into dist/
bun run preview    # serve dist/ locally (service worker enabled)
```

`npm` works too.

Without Supabase env vars the app runs in **device-only mode**: "Try it without an account" keeps everything in the browser (text in localStorage, photos in IndexedDB), and the Google and email buttons are shown but disabled.

## How it's built

| | |
|---|---|
| App | Vite + React 19 + TypeScript, React Router, plain CSS (tokens in `src/styles/base.css`), Plus Jakarta Sans |
| Data | `src/data/backend.ts` interface with two implementations: `localBackend.ts` (device) and `supabase.ts` (signed in). Screens only use `src/data/store.ts`. |
| Sign-in | Supabase Auth: Google (redirect) and a 6-digit code by email. Loaded lazily, only when configured (`src/auth/AuthProvider.tsx`). |
| Photos | Compressed in the browser (`src/data/photos.ts`): 1600 px WebP for stories, 720 px square for avatars, JPEG where the browser can't write WebP. Kept in IndexedDB, uploaded to a private Supabase Storage bucket when saved. |
| Offline | `sw.template.js` → `dist/sw.js` precaches the app shell and icons. Signed in, the journal is cached in localStorage and changes wait in an outbox until they're saved, so the app works without signal. |
| Map | `src/components/WorldMap.tsx`: Natural Earth 1:50m countries (`world-atlas`), Equal Earth projection (`d3-geo`), pinch/drag zoom (`d3-zoom`). The map screen and its 750 kB of shapes load only when the Map tab is opened. |

Data model (`src/lib/types.ts`):
- **Person** ("a heart" in the app): name, photo, start and end dates (the same day twice = one day, no end = still going), about, country, rating 1–10, tags, Instagram, phone.
- **Story**: date, optional title, text, country, tags, the people it's with (any number), photos.
- **Profile**: what you write about yourself on the You tab.

Tags are free text, shared between people and stories: the ones already used are suggested first, then a short list of ideas (`src/lib/tags.ts`).

Deleting someone deletes the stories that were only theirs; stories shared with others stay, without them.

## Supabase

### 1. Project and tables

1. Create a project at [supabase.com](https://supabase.com) (the free plan is plenty). Pick a region close to you.
2. **SQL Editor → New query**: paste the contents of `supabase/schema.sql` and run it. It creates `people`, `stories` and `profiles` (one JSON document per row, so new fields never need a migration), row-level security so each person only sees their own rows, and the private `photos` bucket.
3. **Project Settings → API Keys**: copy the project URL and the publishable key into `.env.local` (see `.env.example`) and into the Vercel project's environment variables:
   ```
   VITE_SUPABASE_URL=https://dydywowsexvxmaiuqlvi.supabase.co
   VITE_SUPABASE_KEY=sb_publishable_…
   ```
   These are built into the JavaScript, so a change only takes effect after a new deploy. The publishable key is meant for the browser (row-level security protects the data). Never give a `VITE_` name to anything secret, such as the `service_role` key or Google's client secret.
4. **Authentication → Sign In / Providers**: leave "Allow anonymous sign-ins" off. The app doesn't use it ("Try it without an account" stays on the device), and it would let anyone create throwaway accounts. Keep "Confirm email" on: without it, anyone could sign up with someone else's address and Supabase would mark it as confirmed.
5. **Authentication → URL Configuration**:
   - Site URL: `https://littlestories.app.roberrini.com`
   - Redirect URLs: `https://littlestories.app.roberrini.com/**`, `https://little-stories-wcn2.vercel.app/**`, `http://localhost:5174/**`

> Free projects pause after a week without any activity. Opening the app counts; if it does pause, restore it from the dashboard (nothing is lost).

### 2. Google sign-in

1. [Google Cloud Console](https://console.cloud.google.com) → **Google Auth Platform → Clients → Create client → Web application**.
   - Authorized redirect URI: `https://dydywowsexvxmaiuqlvi.supabase.co/auth/v1/callback`. This is the one that matters: Google returns to Supabase, which then returns to the app. A missing or different value shows up as `redirect_uri_mismatch`.
   - Authorized JavaScript origins: `https://littlestories.app.roberrini.com`, `https://little-stories-wcn2.vercel.app`, `http://localhost:5174`
2. **Branding**: app name "Little Stories", support email, and `supabase.co` plus `roberrini.com` as authorized domains.
3. Supabase → **Authentication → Sign In / Providers → Google**: enable it and paste the client ID and secret. They belong here only: the app and Vercel never need them.

Google's consent screen says "continue to `dydywowsexvxmaiuqlvi.supabase.co`". Showing our own domain there needs Supabase's custom domain add-on (paid).

### 3. Sign-in code by email

Supabase sends a sign-in **link** by default. The app asks for the **code** instead, because a link opened from the mail app lands in the browser, not in the installed app.

1. **Custom SMTP first.** Supabase's built-in mailer only delivers to the project's team members, a few emails an hour, and the templates can't be edited until custom SMTP is set. Use [Resend](https://resend.com) (free: 3,000 emails a month):
   - Add the domain `app.roberrini.com` in Resend (region Ireland, the same as the Supabase project) and copy the DNS records it lists into OVH's DNS zone exactly (a DKIM TXT and two CNAMEs, `send.app` and `rsend.app`, at the time of writing), plus a `_dmarc.app` TXT. Skip the "receiving" MX: nothing receives mail at this domain. Add records only; don't change the mail records already in the zone. Keep sending off `roberrini.com` itself, which holds the OVH mailboxes, and off `mail.roberrini.com`, which is OVH's webmail.
   - Supabase → **Authentication → Emails → SMTP Settings**: host `smtp.resend.com`, port `465`, user `resend`, password = a Resend API key, sender email `hello@app.roberrini.com`, sender name `Little Stories`.
   - Raise **Authentication → Rate Limits → emails per hour** to something like 30.
2. **Authentication → Emails → Templates**: in both **Magic link or OTP** and **Confirm sign up**, show the code. For example:
   ```html
   <h2>Your Little Stories code</h2>
   <p>Enter this code to sign in:</p>
   <p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
   <p>It expires in an hour. If you didn't ask for it, you can ignore this email.</p>
   ```
   (Subject, e.g.: `{{ .Token }} is your Little Stories code`.)
3. **Authentication → Sign In / Providers → Email**: keep "Email OTP length" at 6 (it must match `CODE_LENGTH` in `src/data/config.ts`).

Current project: `dydywowsexvxmaiuqlvi`, live at https://littlestories.app.roberrini.com (also https://little-stories-wcn2.vercel.app).

## Deploying (Vercel)

`vercel.json` handles SPA routing and cache headers (hashed assets are immutable, `sw.js` is never cached). In Vercel: **Add New → Project → import the GitHub repo**. The Vite preset is detected; the build runs `bun run build` and publishes `dist/`. Add the two `VITE_SUPABASE_*` variables. Every push to `main` deploys.

### Subdomain on OVH

1. Vercel → the project → **Settings → Domains → Add** `littlestories.app.roberrini.com`. Vercel shows the CNAME target to use.
2. OVH → **Web Cloud → Domain names → roberrini.com → DNS zone → Add an entry → CNAME**: subdomain `littlestories.app`, target the value Vercel gave (with a trailing dot). DNS usually takes a few minutes; Vercel issues the certificate on its own.
3. Back in Supabase and Google, make sure the domain is in the redirect URLs and JavaScript origins listed above.

## Android

The web app is a complete PWA: manifest with `any` and `maskable` icons, standalone display, portrait orientation, "Write a story" and "Add someone" shortcuts, and a service worker for offline use.

As for Workout Journal, the recommended wrapper is a **Trusted Web Activity** generated with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap): `npx @bubblewrap/cli init --manifest https://littlestories.app.roberrini.com/manifest.webmanifest`, then `bubblewrap build`. Copy `android/assetlinks.template.json` to `public/.well-known/assetlinks.json` with the package name and the signing key's SHA-256, then redeploy. Google sign-in and the email code work unchanged inside it.

## Design

Warm paper background, flat white cards with large radii, near-black text, and colour as accents only, following the moodboard: sunny yellow for actions (the + button, Save), coral for hearts and the people map, periwinkle for the stories map, cocoa, olive and taupe in the charts. Each person gets a stable accent colour from their id (avatar, profile date). The illustration (`src/components/Scene.tsx`) is a smiling heart rising over hills, in day, dusk and blush variants. Desktop is the same single column, centered.
