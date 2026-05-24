# Rommé

Personal score tracker for Rommé. Two players, paper-style sheet, captures every round for long-term analysis. German UI. Built as a PWA so it can live on the iPad home screen.

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4, Drizzle ORM, Neon Postgres (HTTP driver). Auth is a single shared password with an HMAC-signed cookie — no JWT library, no user table.

## Local setup

```bash
# 1. Link the project (provisions DATABASE_URL etc. into Vercel)
vercel link

# 2. Pull env vars from Vercel — fills .env.local with DATABASE_URL
vercel env pull .env.local

# 3. Generate a SESSION_SECRET and pick an APP_PASSWORD
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "APP_PASSWORD=your-shared-password" >> .env.local

# 4. Run the initial migration (creates tables + seeds Richard/Andrea)
npm run db:migrate

# 5. Start dev
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:generate` — generate a new SQL migration from `app/_lib/schema.ts`
- `npm run db:migrate` — apply migrations to `DATABASE_URL`
- `npm run db:studio` — open Drizzle Studio

## Deploying

This app expects two manual setup steps in Vercel:

1. **Install the Neon Marketplace integration** (Vercel dashboard → Integrations → Neon). This auto-provisions `DATABASE_URL` for all environments.
2. **Set two environment variables** in Project Settings → Environment Variables (all environments):
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`
   - `APP_PASSWORD` — the shared password Richard and Andrea will use
3. **Push to GitHub / `vercel deploy`** — Vercel builds and deploys.
4. **Run the initial migration once against production**:
   ```bash
   DATABASE_URL="<paste prod URL from Vercel>" npm run db:migrate
   ```

## Domain notes

- `players` table is keyed by `name` (UNIQUE) so the same person doesn't drift across spellings.
- `matches.round_count` must be 3, 5, or 10.
- `rounds` are stored per match with a UNIQUE `(match_id, round_number)`. Dealer rotates: round N → dealer = `(N-1) % 2` (left = 0).
- Winner of a round must have 0 points; the loser tallies the remaining hand.
- Lowest total at end of match wins.
- Hard delete on a match cascades to its rounds.

## Files Richard should replace

- `public/icon-512.png` and `public/apple-touch-icon.png` are solid-blue placeholders. Replace with real artwork for a polished PWA install.
