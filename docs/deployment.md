# Public HTTPS deployment

Recommended: Vercel for the first public deployment.

## Required production environment variables

Set these in the hosting provider. Do not commit them.

```env
XAPI_CLIENT_ID=...
XAPI_CLIENT_SECRET=...
XAPI_TOKEN_SIGNING_SECRET=...
XAPI_TOKEN_TTL_SECONDS=3600
XAPI_WRITE_LOCAL_LOG=false

COURSERA_ORG_ID=vJnSGFQKQJSRCDrEQGoMrg
COURSERA_AUTH_MODE=basic
COURSERA_API_BASE_URL=https://api.coursera.org/api
```

Coursera API client values are only needed if we later use Coursera pull APIs:

```env
COURSERA_CLIENT_ID=...
COURSERA_CLIENT_SECRET=...
```

## Vercel CLI deployment

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
npx vercel login
npx vercel
```

For production:

```bash
npx vercel --prod
```

## Coursera xAPI URLs after deployment

If Vercel gives you:

```text
https://gtops-dashboard.vercel.app
```

enter in Coursera:

```text
OAuth Server URL:
https://gtops-dashboard.vercel.app/api/xapi/oauth/token

Tracking URL / xAPI Statement URL:
https://gtops-dashboard.vercel.app/api/xapi/statements
```

If the Coursera field specifically says **Tenant Server URL** and appends `/xapi/statements` itself, enter only:

```text
https://gtops-dashboard.vercel.app
```

## Smoke tests after deployment

Open:

```text
https://YOUR_DOMAIN/api/xapi/oauth/token
https://YOUR_DOMAIN/api/xapi/statements
```

Both should return endpoint metadata for GET requests.

Then test token creation with production credentials:

```bash
curl -X POST https://YOUR_DOMAIN/api/xapi/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials' \
  -d 'client_id=YOUR_XAPI_CLIENT_ID' \
  -d 'client_secret=YOUR_XAPI_CLIENT_SECRET'
```
