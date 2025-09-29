# Project Context

This file captures the current status and working context for the Debit Card Manager project so future work can pick up quickly.

## Overview
- Purpose: Manage company debit cards, balances, and transactions; provide dashboard and reporting with exports.
- Framework: Next.js 14 (App Router) + React 18
- Styling: Tailwind CSS
- Backend: Supabase (PostgreSQL) accessed from Next API routes (serverless runtime)
- i18n: i18next (EN/VI)
- Charts: Recharts
- Exports: xlsx (Excel), pdf-lib (PDF), CSV strings

## Runtime & Build
- Node engine: ">=18.17.0"
- Next.js: 14.2.5
- Deployment: Vercel (Production build via `next build`)
- Scripts:
  - `npm run dev` — local dev server
  - `npm run build` — production build
  - `npm run start` — start production server
  - `npm run typecheck` — TS type checking
  - `npm run lint` — Next.js ESLint
  - `npm run check:exports [BASE_URL]` — sanity check export endpoints

## Environment
- Required (client-safe):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `auth` usage in Supabase client is disabled for sessions/refresh.

## Data Model (db/schema.sql)
- tables:
  - `cards` (id, card_number, card_name, department, current_balance, timestamps)
  - `transactions` (id, card_id, type credit|debit, amount, description, category, vendor_name, client_partner_name, transaction_date, created_by, timestamps)
  - `balance_snapshots` (id, card_id, balance, snapshot_date, timestamps)
- triggers maintain `cards.current_balance` on tx insert/update/delete.
- helpful indexes for common queries.

## API Endpoints
- Cards
  - `GET /api/cards`
  - `POST /api/cards` (validate name)
  - `PUT /api/cards/[id]`
  - `DELETE /api/cards/[id]`
- Transactions
  - `GET /api/transactions` — filters: `type`, `cardId`, `start`, `end`, `q`, `limit`, `offset`
  - `POST /api/transactions`
  - `PUT /api/transactions/[id]`
  - `DELETE /api/transactions/[id]`
  - `GET /api/transactions/export` — export filtered results. Query params:
    - `format=csv|xlsx|pdf`
    - `type`, `cardId`, `start`, `end`, `q`, `limit`, `offset` (optional range)
    - Filenames include context suffixes (type/dateRange/card/search)
- Reports
  - `GET /api/reports/balance` — sum of `cards.current_balance`
  - `GET /api/reports/monthly` — month buckets for credit/debit
  - `GET /api/reports/expenses` — debit totals by `category`
  - `GET /api/reports/monthly/export` — CSV/XLSX/PDF; PDF includes simple bar chart; filename includes date range/card
  - `GET /api/reports/expenses/export` — CSV/XLSX/PDF; PDF includes horizontal bars for top categories; filename includes date range/card

## Frontend Pages (app/)
- `layout.tsx` — global providers: i18n, toasts, header; tailwind styles
- `/` Dashboard
  - Shows total balance, quick actions, and recent 10 transactions
  - Export controls for recent transactions (CSV/XLSX/PDF via `/api/transactions/export?limit=10`)
- `/cards` Cards
  - Create/list/delete cards
- `/transactions` Transactions
  - Create new tx
  - Filter/search/paginate list
  - Export controls at top (with filters) and below the table for convenience
- `/reports` Reports
  - Date filter inputs
  - Charts (Monthly, Expense by Category)
  - Export controls for Monthly and Expenses (CSV/XLSX/PDF). PDF includes charts.

## Localization
- EN: `locales/en/common.json`
- VI: `locales/vi/common.json` — mojibake fixed; new keys added for export labels and `na` placeholder
- UI fallback for empty fields uses localized `na` (N/A; VI: "Không có")

## Exports Implementation
- CSV: server builds UTF-8 text with escaped cells
- Excel: `xlsx` AOAs -> sheet -> workbook; writes as ArrayBuffer; Response sends `Uint8Array(ArrayBuffer)`
- PDF: `pdf-lib` creates simple tables; Reports exports embed basic bar charts
- Filenames: Content-Disposition with contextual suffix (type, date range, card name+number, search)
- Transactions export supports client-provided `limit`/`offset` to export the current slice (used by Dashboard recent)

## Known/Recent Fixes
- Fixed VI locale mojibake and added missing keys
- Cleaned README and added export documentation
- Replaced UI placeholders with localized `N/A`
- Adjusted exports to satisfy Vercel TypeScript checks (ArrayBuffer for XLSX/PDF Response body)

## Future Ideas / Backlog
- Optional: richer PDF formatting (pagination headers, totals, currency, localization)
- Optional: include card name/number directly in Transactions table view and export the same order
- Optional: auth/rate-limiting if project becomes public
- Optional: CSV import for bulk transactions
- Optional: tests for API endpoints

## Quick Commands
- Check exports against a URL:
  - `npm run check:exports` (defaults to http://localhost:3000)
  - or `npm run check:exports https://your-app.vercel.app`

## Contact Points
- Supabase credentials must be present at build/runtime
- For Vercel, ensure env vars are set and Node >= 18.17 is used (default okay)

