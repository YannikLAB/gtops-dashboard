# GTOPs Impact Dashboard

Public-facing EC4A/GTOPs dashboard for compliance targets, Coursera learner activity, learner intervention signals, and future workforce-data integrations.

Live site:

```text
https://gtops-dashboard.vercel.app/
```

## Tech stack

- Next.js app router
- TypeScript
- Tailwind CSS
- Vercel hosting
- Supabase database
- Coursera xAPI push integration
- Historical Coursera dashboard CSV backfill importer

## Current status

- Public HTTPS dashboard is deployed on Vercel
- Dashboard reads live metrics from Supabase
- Historical Coursera dashboard aggregate CSVs have been imported
- Coursera xAPI is configured for new learner activity going forward
- `/api/xapi/oauth/token` issues tokens for Coursera xAPI authentication
- `/api/xapi/statements` receives Coursera xAPI statements and stores them in Supabase
- `supabase/schema.sql` defines the database tables, indexes, RLS policies, and public metrics view

Current dashboard sections:

- Key metrics
- Coursera Activity
- Sync Status
- Grant Targets
- Learner Alerts

## Run locally

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

Use `.env.example` as the template:

```bash
cp .env.example .env.local
```

Required for Supabase-backed dashboard data:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Required for Coursera xAPI receiver:

```env
XAPI_CLIENT_ID=
XAPI_CLIENT_SECRET=
XAPI_TOKEN_SIGNING_SECRET=
XAPI_TOKEN_TTL_SECONDS=3600
XAPI_WRITE_LOCAL_LOG=false
```

Optional/future Coursera pull API values:

```env
COURSERA_CLIENT_ID=
COURSERA_CLIENT_SECRET=
COURSERA_ORG_ID=vJnSGFQKQJSRCDrEQGoMrg
COURSERA_AUTH_MODE=basic
COURSERA_TOKEN_URL=https://accounts.coursera.org/oauth2/v1/token
COURSERA_API_BASE_URL=https://api.coursera.org/api
COURSERA_REPORT_PATH=
```

Never commit `.env.local` or secret keys.

## Coursera xAPI configuration

Configured Coursera URLs should use the deployed Vercel domain:

```text
OAuth Server URL:
https://gtops-dashboard.vercel.app/api/xapi/oauth/token

Tracking URL / xAPI Statement URL:
https://gtops-dashboard.vercel.app/api/xapi/statements
```

The Coursera xAPI client credentials are the generated `XAPI_CLIENT_ID` and `XAPI_CLIENT_SECRET`, not the Coursera API keys.

## Supabase

Apply the schema from:

```text
supabase/schema.sql
```

Setup notes:

```text
docs/supabase-setup.md
```

Raw Coursera xAPI statements are stored in:

```text
xapi_statements
```

Historical aggregate metrics are stored in:

```text
impact_metrics
learner_activity_snapshots
```

The public dashboard derives metrics from Supabase and falls back to sample data only if Supabase is unavailable.

## Historical backfill

Coursera xAPI sends new activity going forward. Historical activity is imported from Coursera dashboard CSV exports.

Importer:

```bash
node scripts/import-coursera-dashboard-exports.mjs .
```

Generic row-level CSV importer:

```bash
node scripts/import-historical-coursera-csv.mjs /path/to/coursera-export.csv
```

See:

```text
docs/historical-backfill.md
```

## Deployment

Deploy production to Vercel:

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
npx vercel --prod
```

Deployment notes:

```text
docs/deployment.md
```

## Useful docs

- `docs/local-setup.md`
- `docs/deployment.md`
- `docs/xapi-receiver.md`
- `docs/supabase-setup.md`
- `docs/historical-backfill.md`
- `docs/coursera-fetcher.md`
- `docs/coursera-org-id.md`

## Next possible build steps

1. Add an admin/status page for Supabase and xAPI health.
2. Add protected manual metric editing.
3. Add proper certification and placement tracking.
4. Improve learner-alert logic from stored xAPI events.
5. Add branded design/content refinements for public stakeholders.
