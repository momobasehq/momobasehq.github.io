# HTTP API conventions

The generated [endpoint reference](/api-reference) is authoritative for paths, request bodies, and response models. This page describes behavior shared across endpoints.

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

Token endpoints accept `application/x-www-form-urlencoded` bodies.

Application token grant:

```text
grant_type=client_credentials
client_id=<application client ID>
client_secret=<application client secret>
```

Administrator token grant:

```text
grant_type=password
username=<administrator email>
password=<administrator password>
```

Refresh grant for either audience:

```text
grant_type=refresh_token
refresh_token=<refresh token>
```

Send access tokens as:

```http
Authorization: Bearer <access token>
```

Momobase verifies the token and resolves its application credential or administrator from the database on every authenticated request. Revoked credentials, sessions, disabled applications, and inactive administrators therefore stop authorizing requests without waiting for access-token expiry.

## Authorization

Application credentials accept these scopes:

| Scope                  | Allows                                |
| ---------------------- | ------------------------------------- |
| `collections:create`   | Create collections                    |
| `disbursements:create` | Create disbursements                  |
| `transactions:read`    | Read the application's transactions   |
| `*`                    | Satisfy every application scope check |

Payment-method discovery requires a valid application token but no additional scope.

Administrator roles grant resource permissions such as `system:read`, `transactions:read`, `providers:update`, or `routes:create`. Use `GET /api/admin/permissions?audience=admin` to retrieve the current catalogue instead of hard-coding it. The wildcard `*` satisfies every permission check.

## Response envelopes

Most successful JSON endpoints return:

```json
{
	"success": true,
	"data": {}
}
```

Failures return:

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

Treat `error.code` as the stable machine-readable value and `error.message` as diagnostic text.

OAuth token endpoints are the exception: they return the token object directly without the Momobase envelope.

## Pagination

List endpoints accept `page` and `per_page`. Both default to positive values when missing or invalid; `per_page` defaults to 20 and is capped at 100.

Paginated data has this shape inside `data`:

```json
{
	"page": 1,
	"total": 42,
	"items": [],
	"count": 20
}
```

`count` is the number of items in the current page; `total` is the total matching row count.

## Idempotency

Collections and disbursements require an `Idempotency-Key` header. The key is scoped to the authenticated application.

An identical normalized request returns the existing transaction. Reusing the key with a different service or payload returns an error. The key should identify one business operation and remain stable across network retries.

Verified webhook events are also deduplicated before they are applied.

## Content type and request limits

JSON write endpoints require a `Content-Type` beginning with `application/json`; otherwise they return `415 UNSUPPORTED_MEDIA_TYPE`.

| Request class      | Limit                                  |
| ------------------ | -------------------------------------- |
| General requests   | 1 MiB body                             |
| Provider webhooks  | 256 KiB body                           |
| HTTP read timeout  | 65 seconds                             |
| HTTP write timeout | 65 seconds                             |
| Idle connection    | 120 seconds                            |
| Provider operation | 45 seconds inside the request lifetime |

## Rate limits

Limits use a one-minute window and the client address resolved through trusted-proxy configuration:

| Route class             | Requests per window |
| ----------------------- | ------------------- |
| Token endpoints         | 20                  |
| Application endpoints   | 120                 |
| Administrator endpoints | 120                 |
| Webhook endpoint        | 300                 |

Exhausting a limit returns HTTP `429` with code `RATE_LIMITED`. Limits are maintained by each running process; a multi-replica deployment does not share one counter.

## Request identifiers

Clients may send `X-Request-ID` using visible ASCII and at most 64 characters. Momobase discards an oversized value and generates a replacement. The resolved identifier is returned in the response and recorded in structured request logs.

## CORS and proxies

Momobase allows only configured CORS origins and does not enable credentialed browser requests. Allowed request headers include `Authorization`, `Content-Type`, `X-Request-ID`, and `Idempotency-Key`.

Forwarded client addresses are trusted only from `App.TrustedProxyCIDRs`. Configure this list when a controlled reverse proxy fronts Momobase; otherwise leave it empty.

## Webhook authentication

Webhook requests target a specific provider account:

```http
POST /webhooks/<provider-account-id>
X-Webhook-Secret: <account webhook secret>
```

The provider adapter may require additional headers for its own signature verification. Momobase gives the adapter the raw body and request headers, stores only verified normalized events, and checks any supplied transaction fields before applying a status change.
