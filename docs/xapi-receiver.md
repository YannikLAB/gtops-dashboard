# Coursera xAPI receiver

Important: Coursera xAPI is a **push** integration.

That means Coursera is not asking for Coursera's OAuth URL. Coursera is asking for the OAuth token endpoint and xAPI statement endpoint of the receiving platform — in this case, this GTOPs dashboard app.

## Values to enter in Coursera

These URLs only work after the site is deployed to a public HTTPS domain.

If deployed at:

```text
https://gtops.example.org
```

then enter:

```text
OAuth Server URL:
https://gtops.example.org/api/xapi/oauth/token

Tracking URL / Tenant Server URL / xAPI Statement URL:
https://gtops.example.org/api/xapi/statements
```

If Coursera specifically appends `/xapi/statements` to a tenant base URL, use only the base domain as the tenant URL:

```text
Tenant Server URL:
https://gtops.example.org
```

But if Coursera asks for the xAPI statement endpoint or tracking URL, use the full `/api/xapi/statements` URL.

## Credentials to enter in Coursera

You must generate a new client ID and client secret for Coursera to authenticate against this app.

These are **not** your Coursera API Client ID and Client Secret.

Add generated values to this app's environment:

```env
XAPI_CLIENT_ID=generated_client_id_for_coursera
XAPI_CLIENT_SECRET=generated_client_secret_for_coursera
XAPI_TOKEN_SIGNING_SECRET=long_random_signing_secret
XAPI_TOKEN_TTL_SECONDS=3600
```

Then enter the same `XAPI_CLIENT_ID` and `XAPI_CLIENT_SECRET` into Coursera's xAPI configuration.

## Local testing

Localhost will not work from Coursera because Coursera needs a public HTTPS URL.

You can still test locally with curl:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/xapi/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials' \
  -d "client_id=$XAPI_CLIENT_ID" \
  -d "client_secret=$XAPI_CLIENT_SECRET" | jq -r .access_token)

curl -X POST http://localhost:3000/api/xapi/statements \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "test-statement",
    "actor": { "objectType": "Agent", "mbox": "mailto:test@example.org" },
    "verb": { "id": "http://adlnet.gov/expapi/verbs/progressed" },
    "object": { "id": "https://www.coursera.org/course/example" }
  }'
```

Set this to write received xAPI JSON to local files during development:

```env
XAPI_WRITE_LOCAL_LOG=true
```

Local files are written to:

```text
data/xapi-statements/
```

For production, received statements should be stored in Supabase instead of local files.
