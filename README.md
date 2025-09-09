# Debit Card Manager

A Next.js + Supabase app to manage company debit card balances and transactions.

## Tech
- Next.js (App Router), React, Tailwind CSS
- Supabase (Postgres) via `@supabase/supabase-js`

## Setup
1. Node 18.17+ recommended: `node -v`
2. Install deps: `npm install`
3. Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run dev server: `npm run dev`

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm start` — run production server
- `npm run typecheck` — TypeScript check

## Notes
- API routes under `app/api/*` connect directly to Supabase.
- No authentication; use unguessable link and rate limiting as basic protection.

