# Debit Card Manager

A simple and modern web application to manage company debit card balances and transactions. Supports English and Vietnamese.

## Features

- Multi-language support (EN/VI)
- Card management (add, list, delete)
- Transaction tracking (income/expense) with filters and pagination
- Dashboard overview (total balance, recent activity)
- Reports (monthly summary, expenses by category)
- Export to CSV, Excel (.xlsx), and PDF

## Getting Started

### Prerequisites

- Node.js v18.17.0+
- npm

### Installation

1) Install dependencies

```
npm install
```

2) Configure environment

Copy `.env.example` to `.env.local` and set Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3) Run the dev server

```
npm run dev
```

Open http://localhost:3000

## Exports

- Transactions and Reports pages include an Export control to download CSV/XLSX/PDF.
- Reports PDF includes simple bar charts for quick visual reference.
- Filenames include filters like date range and card when provided.

## Scripts

- `npm run typecheck` – TypeScript checks
- `npm run lint` – Next.js ESLint
- `npm run check:exports` – simple e2e checks for export endpoints (requires dev server running)

## Tech Stack

- Next.js (App Router, React 18)
- Tailwind CSS
- Supabase (PostgreSQL)
- i18next (localization)
- Recharts (charts)
- pdf-lib, xlsx (exports)

