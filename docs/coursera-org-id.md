# Finding the Coursera organization/business ID

The Coursera organization/business ID is not the public web slug.

If your Coursera admin URL contains something like `hc4a`, that is usually only a human-readable slug. Coursera API requests may use either a numeric ID or an opaque string ID depending on the endpoint/account.

Examples of possible IDs:

```text
123456
987654
vJnSGFQKQJSRCDrEQGoMrg
```

It may appear in API URLs as a path segment or query parameter, for example:

```text
/api/businesses.v1/123456/...
/api/organizations.v1/123456/...
?businessId=123456
?orgId=vJnSGFQKQJSRCDrEQGoMrg
```

## Found candidate

From browser developer tools you found:

```text
https://www.coursera.org/api/dataPrivacyAgreements.v1?orgId=vJnSGFQKQJSRCDrEQGoMrg&action=isDPANeeded
```

You also found an `enterpriseEvents.v1` request where the same value appears inside organization event keys:

```text
214096363~organizationEventKey!~vJnSGFQKQJSRCDrEQGoMrg!!!~ADMIN_FIRST_VISIT
```

This strongly suggests the Coursera organization ID for at least some Coursera admin API calls is:

```text
vJnSGFQKQJSRCDrEQGoMrg
```

The separate number `214096363` is likely a user/account/profile identifier in the event key, not the organization ID.

We should store `vJnSGFQKQJSRCDrEQGoMrg` as `COURSERA_ORG_ID` when wiring the Coursera integration, while still verifying which documented Business API/report endpoints accept it.

## Ways to verify it

1. Search Network requests for the same value: `vJnSGFQKQJSRCDrEQGoMrg`.
2. Search requests for `orgId`, `businessId`, `enterprise`, `organization`, or `business`.
3. Ask Coursera support/CSM: “Is `vJnSGFQKQJSRCDrEQGoMrg` our Coursera Business organization ID for API/reporting endpoints?”

## Important

Do not put Coursera client secrets, browser cookies, `CAUTH`, CSRF tokens, or API-key secrets in public frontend code or shared notes. The org ID is not usually as sensitive as a secret, but all Coursera API calls should still run server-side.
