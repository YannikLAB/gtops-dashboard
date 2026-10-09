# Local setup

## 1. Create `.env.local`

In the project folder:

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
cp .env.example .env.local
```

Edit `.env.local` and add your Coursera values:

```env
COURSERA_CLIENT_ID=your_client_id_here
COURSERA_CLIENT_SECRET=your_client_secret_here
COURSERA_ORG_ID=vJnSGFQKQJSRCDrEQGoMrg
```

Leave Supabase values blank for now if no Supabase project exists yet.

Important: `.env.local` is ignored by git. Do not paste the client secret into shared notes, frontend code, or public repositories.

## 2. Start the site

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 3. Check server-side Coursera configuration

With the dev server running, open:

```text
http://localhost:3000/api/coursera/status
```

This endpoint only reports whether the credentials are present. It does not expose the client secret.

## 4. Next implementation step

Once config is confirmed, the next code task is to implement Coursera OAuth/token handling and a safe server-side report fetcher using documented Coursera Business API endpoints.
