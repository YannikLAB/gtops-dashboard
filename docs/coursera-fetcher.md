# Coursera server-side fetcher

The project has a server-only Coursera API helper in:

```text
src/lib/coursera.ts
```

It supports:

- loading Coursera env vars server-side
- HTTP Basic API-key auth using Client ID + Client Secret
- optional OAuth client-credentials token checks if Coursera confirms that grant type
- fetching a configured report endpoint once a documented endpoint path is known
- summarizing raw response shape for development

## Required `.env.local` values

```env
COURSERA_CLIENT_ID=...
COURSERA_CLIENT_SECRET=...
COURSERA_ORG_ID=vJnSGFQKQJSRCDrEQGoMrg
COURSERA_AUTH_MODE=basic
COURSERA_TOKEN_URL=https://accounts.coursera.org/oauth2/v1/token
COURSERA_API_BASE_URL=https://api.coursera.org/api
```

## Why `/api/coursera/token` may be skipped

The first OAuth client-credentials token URL returned 404, and Coursera's accounts OAuth endpoint reported that `client_credentials` is not supported for this app.

That strongly suggests the Client ID + Client Secret from the Coursera admin API-key screen are meant to authenticate API requests directly with HTTP Basic auth, not to mint an OAuth bearer token.

So the default is now:

```env
COURSERA_AUTH_MODE=basic
```

Open this only if `COURSERA_AUTH_MODE=oauth-client-credentials`:

```text
http://localhost:3000/api/coursera/token
```

## Report probe

The report probe intentionally does not guess a report endpoint. Add a documented Coursera Business API report path first:

```env
COURSERA_REPORT_PATH=someDocumentedReports.v1?q=search
```

Then restart `npm run dev` and open:

```text
http://localhost:3000/api/coursera/report-probe
```

The fetcher will call:

```text
COURSERA_API_BASE_URL + COURSERA_REPORT_PATH
```

If neither `orgId` nor `businessId` is already in the path query string, it appends:

```text
orgId=COURSERA_ORG_ID
```

## Security notes

Never expose:

- `COURSERA_CLIENT_SECRET`
- Coursera browser cookies
- `CAUTH`
- CSRF tokens
- OAuth access tokens

All Coursera requests should stay server-side.
