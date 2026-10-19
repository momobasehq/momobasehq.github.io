# HTTP API conventions

Rules that apply to every endpoint. For paths, request bodies, and responses, see the [OpenAPI explorer](/api-reference).

## Route groups

| Prefix or path                 | Audience                     | Authentication                    |
| ------------------------------ | ---------------------------- | --------------------------------- |
| `/ping`, `/healthz`            | Infrastructure probes        | None                              |
| `/api/v1/token`                | Application authentication   | Client ID and secret form values  |
| `/api/v1/*`                    | Application integrations     | Application bearer token          |
| `/api/admin/token`             | Administrator authentication | Email and password form values    |
| `/api/admin/*`                 | Operators and admin tools    | Administrator bearer token        |
| `/webhooks/:providerAccountID` | Payment providers            | Webhook secrets and adapter proof |

`/api/admin/login` is an alias for `/api/admin/token`.

## Authentication

Get a token by sending an `application/x-www-form-urlencoded` body to the token endpoint.

Application token:

```text
grant_type=client_credentials
client_id=<application client ID>
client_secret=<application client secret>
```

Administrator token:

```text
grant_type=password
username=<administrator email>
password=<administrator password>
```

Refresh either token:

```text
grant_type=refresh_token
refresh_token=<refresh token>
```

Send the access token on every request:

```http
Authorization: Bearer <access token>
```

Revoking a credential or session, or disabling an application or administrator, takes effect immediately, even for unexpired tokens.

## Authorization

Application credential scopes:

| Scope                  | Allows                                |
| ---------------------- | ------------------------------------- |
| `collections:create`   | Create collections                    |
| `disbursements:create` | Create disbursements                  |
| `transactions:read`    | Read the application's transactions   |
| `*`                    | Satisfy every application scope check |

`GET /api/v1/payment-methods` needs a valid application token but no scope.

Administrators get permissions through roles, such as `system:read`, `transactions:read`, `providers:update`, or `routes:create`. `*` grants every permission. Get the full list from `GET /api/admin/permissions?audience=admin`.

## Response envelopes

Successful responses:

```json
{
	"success": true,
	"data": {}
}
```

Errors:

```json
{
	"success": false,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "currency must be exactly 3 characters"
	},
	"message": "currency must be exactly 3 characters"
}
```

Match on `error.code`. `error.message` is for people and may change.

Token endpoints return the OAuth token object directly, without this envelope.

## Pagination

List endpoints take `page` (default `1`) and `per_page` (default `20`, maximum `100`). The list is inside `data`:

```json
{
	"page": 1,
	"total": 42,
	"items": [],
	"count": 20
}
```

`count` is the number of items on this page. `total` is the number of items across all pages.

## Idempotency

Collections and disbursements require an `Idempotency-Key` header, unique per application.

- The same request with the same key returns the existing transaction.
- A different request with a used key returns an error.

Use one key per business operation, such as an order ID, and reuse it on retries.

## Content type and request limits

Send `Content-Type: application/json` on every JSON write. Anything else returns `415 UNSUPPORTED_MEDIA_TYPE`.

| Request class      | Limit                                  |
| ------------------ | -------------------------------------- |
| General requests   | 1 MiB body                             |
| Provider webhooks  | 256 KiB body                           |
| HTTP read timeout  | 65 seconds                             |
| HTTP write timeout | 65 seconds                             |
| Idle connection    | 120 seconds                            |
| Provider operation | 45 seconds inside the request lifetime |

## Rate limits

Per client address, per minute:

| Route class             | Requests per window |
| ----------------------- | ------------------- |
| Token endpoints         | 20                  |
| Application endpoints   | 120                 |
| Administrator endpoints | 120                 |
| Webhook endpoint        | 300                 |

Going over returns `429 RATE_LIMITED`. Each instance counts separately. Behind a proxy, set `TRUSTED_PROXY_CIDRS` or every client shares one limit.

## Request identifiers

Send `X-Request-ID` (visible ASCII, up to 64 characters) to trace a request. Momobase returns it in the response and logs it. If you don't send one, or it is too long, Momobase generates one.

## CORS and proxies

Browsers can call the API only from origins in `CORS_ALLOWED_ORIGINS` (`App.CORSAllowedOrigins` in Go). Credentialed requests are not allowed. Allowed headers: `Authorization`, `Content-Type`, `X-Request-ID`, and `Idempotency-Key`.

Forwarded client addresses are trusted only from proxies in `TRUSTED_PROXY_CIDRS` (`App.TrustedProxyCIDRs`). Leave it empty when no proxy is in front.

## Webhook authentication

Providers send webhooks to one provider account:

```http
POST /webhooks/<provider-account-id>
X-Webhook-Secret: <account webhook secret>
```

Momobase checks `X-Webhook-Secret` against the provider account's `webhook_secret`. The provider adapter then verifies the provider's own signature, if it has one. Only verified events change a transaction.
