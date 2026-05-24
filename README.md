# Rommé Score Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![React 19](https://img.shields.io/badge/React-19-149ECA)

A small, focused web app for keeping score in the card game [Rommé](https://en.wikipedia.org/wiki/Rummy) (German Rummy). It replaces the paper score sheet two players keep at the table: it captures every round, keeps the running totals honest, and stores the history so you can look back on it.

It was built for a real, recurring situation — two people who play a game or two most days and wanted their paper sheet on an iPad instead. The interface is in **German** and the whole design is deliberately tuned to that one use case. It is shared as open source as a compact, real-world example of a Next.js 16 + Drizzle + Neon app, not as a configurable product.

## What it does

- **Two-player matches** of 3, 5, or 10 rounds.
- **Round-by-round entry** with automatic dealer rotation, and the "peek at the joker before dealing" reminder.
- **Winner toggle** that auto-zeroes the winner's score; the loser tallies the points left in hand.
- **Paper-style completed view** — monospace columns and per-round dealer marks that mirror the physical sheet.
- **Edit or delete** any match, so a fat-finger entry is easy to fix.
- **Installable as a PWA** (Add to Home Screen) — behaves like a native app on iPad/iPhone.
- **Captures the right data for later** — date/time, per-round points, and *which player dealt each round* — so questions like "does the dealer tend to lose?" can be answered down the line.

## What it is *not*

- **Not multi-user.** One shared password, no accounts, no per-user login. It's built for two people in one household sharing the same devices.
- **No statistics or charts (yet).** v1 only *captures* the data. Analytics — win rates, dealer-vs-loss correlation, point distributions — is a planned future addition, not something that ships today.
- **Not a rules engine.** It does not validate melds, runs, or legal plays. It trusts the players and simply records the score they agree on each round.
- **Not internationalized.** German UI only, on purpose.
- **Not for more than two players**, and not a generic card-game tracker — the schema and UI are specific to two-player Rommé scoring.
- **Not a polished, configurable product.** Player names, the two-player assumption, and the scoring rules are baked in. Forking and adapting is expected if you want something different.

## How scoring works

- A match is 3, 5, or 10 rounds between two fixed players (left / right).
- The dealer rotates each round: round *N* → dealer = `(N − 1) % 2` (left = 0). The left player always deals round 1.
- The **winner of a round scores 0**; the loser tallies the points still in their hand (0–500).
- The player with the **lowest total** at the end of the match wins. Equal totals render as *Unentschieden* (a draw).
- Totals are never stored — they are always summed from the individual rounds, so the rounds are the single source of truth.

## Tech & design notes

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript** (strict), **Tailwind 4**.
- **Drizzle ORM** over **Neon Postgres** via the serverless HTTP driver (lazy client, so the build doesn't need a live DB).
- **Auth is intentionally minimal**: a single shared password compared with a timing-safe hash, and an HMAC-signed opaque session cookie — no JWT library, no user table. `verifySession()` is enforced in every page and Server Action; the proxy (middleware) is an optimistic gate only.
- **No client state library**: round entry uses Server Actions plus `router.refresh()`.
- **Validation** with Zod v4 on the server, backed by Postgres `CHECK` constraints, so bad data can't land even if the UI is bypassed.
- Data model: `players` (UNIQUE, case-insensitive upsert so names don't drift across spellings), `matches` (round count constrained to 3/5/10), and `rounds` (UNIQUE per `match_id, round_number`; dealer stored per round so an edit can never break the rotation invariant). A hard delete on a match cascades to its rounds.

## Local setup

```bash
# 1. Link the project (provisions DATABASE_URL etc. into Vercel)
vercel link

# 2. Pull env vars from Vercel — fills .env.local with DATABASE_URL
vercel env pull .env.local

# 3. Generate a SESSION_SECRET and pick an APP_PASSWORD
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "APP_PASSWORD=your-shared-password" >> .env.local

# 4. Run the initial migration (creates tables + seeds the two players)
npm run db:migrate

# 5. Start dev
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

> The two seeded player names live in the seed migration (`drizzle/0000_init.sql`). Change them there if you fork this for your own table.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:generate` — generate a new SQL migration from `app/_lib/schema.ts`
- `npm run db:migrate` — apply migrations to `DATABASE_URL`
- `npm run db:studio` — open Drizzle Studio

## Deploying

Designed to deploy on [Vercel](https://vercel.com) with two manual setup steps:

1. **Install the Neon Marketplace integration** (Vercel dashboard → Integrations → Neon). This auto-provisions `DATABASE_URL` for all environments.
2. **Set two environment variables** in Project Settings → Environment Variables (all environments):
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`
   - `APP_PASSWORD` — the shared password the two players will use
3. **Push to GitHub / `vercel deploy`** — Vercel builds and deploys.
4. **Run the initial migration once against production**:
   ```bash
   DATABASE_URL="<paste prod URL from Vercel>" npm run db:migrate
   ```

## Placeholder assets

- `public/icon-512.png` and `public/apple-touch-icon.png` are solid-blue placeholders. Replace them with real artwork for a polished PWA install.

## License

[MIT](LICENSE) © designovaone
