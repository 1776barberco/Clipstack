# ClipStack - Budget in Style

A Next.js 14+ PWA for barbers and beauty professionals to manage irregular income using a bucket-based budgeting system.

## Features

- 🔐 Magic Link Authentication
- 💰 Quick Income Entry (sub-5-second flow)
- 🪣 Automatic Bucket Allocation
- 📊 Stability Meter
- 📈 Weekly Income Charts
- 🏠 Booth Rent Reminders
- 💵 Quarterly Tax Estimates
- ⚡ Offline Support with Queue/Sync
- 📱 PWA - Install on Home Screen

## Tech Stack

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, Postgres, Realtime)
- next-pwa
- Zustand (state management)
- Recharts (charts)

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd clipstack
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Copy your project URL and anon key

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy Edge Functions

```bash
# Tax estimate function
supabase functions deploy tax-estimate

# Booth rent reminder function
supabase functions deploy booth-rent-reminder
```

### 6. Set up Cron Jobs

Run the SQL in `supabase/migrations/004_cron_jobs.sql` to set up automated reminders.

## Database Schema

### Tables

- `profiles` - User profiles with booth rent settings
- `bucket_configs` - Bucket configuration (Essentials, Taxes, Savings, Fun)
- `income_entries` - Income records
- `bucket_transactions` - Deposits, withdrawals, transfers
- `weekly_snapshots` - Historical weekly data
- `notifications` - User notifications

### Views

- `bucket_balances` - Real-time bucket balance calculations

### Functions

- `allocate_income_to_buckets()` - Auto-allocates income on insert
- `get_stability_score()` - Calculates user's stability score

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Supabase    │────▶│  Postgres DB    │
│   (PWA)         │     │  (Auth/API)  │     │  + Realtime     │
└─────────────────┘     └──────────────┘     └─────────────────┘
         │                                              │
         │              ┌──────────────┐                │
         └─────────────▶│ Edge Functions│◀───────────────┘
                        │ - tax-estimate│
                        │ - booth-rent  │
                        └──────────────┘
```

## Bucket System

Default allocation (customizable):
- **Essentials** (50%) - Booth rent, supplies, necessities
- **Taxes** (25%) - Quarterly tax payments
- **Savings** (15%) - Emergency fund, goals
- **Fun** (10%) - Personal spending

## Offline Support

The app uses a queue-based system:
1. Actions are queued in localStorage when offline
2. Automatic sync when connection restored
3. Visual indicator of sync status

## License

MIT
// Deployment trigger Thu Feb 26 12:34:00 AM CST 2026
