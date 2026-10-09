# Supabase setup

## 1. Create project

Go to:

```text
https://supabase.com/dashboard
```

Create a new project, for example:

```text
gtops-dashboard
```

Save the database password somewhere safe.

## 2. Apply schema

In Supabase:

```text
Project → SQL Editor → New query
```

Paste the full contents of:

```text
supabase/schema.sql
```

Run it.

This creates the `xapi_statements` table and `public_dashboard_metrics` view.

## 3. Get API values

In Supabase:

```text
Project Settings → API
```

Copy:

```env
NEXT_PUBLIC_SUPABASE_URL=Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon public key
SUPABASE_SERVICE_ROLE_KEY=service_role secret key
```

Important: `SUPABASE_SERVICE_ROLE_KEY` is secret. Add it only to `.env.local` and Vercel environment variables. Never put it in frontend code or public docs.

## 4. Add env vars locally

Open:

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
open -e .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Restart local dev server after changing env vars.

## 5. Add env vars to Vercel

Go to:

```text
Vercel → gtops-dashboard → Settings → Environment Variables
```

Add the same three Supabase variables for Production.

Then redeploy:

```bash
npx vercel --prod
```

## What changes after this

Coursera xAPI statements posted to:

```text
/api/xapi/statements
```

will be stored in Supabase. The public dashboard will then derive live metrics from `public_dashboard_metrics` instead of using sample fallback data.
