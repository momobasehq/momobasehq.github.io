# HTTP API

Rules that apply to every endpoint. For each endpoint's path, body, and response, see the [OpenAPI explorer](/api-reference). The [SDKs](/guide/payments#install-an-sdk) handle all of this for you.

| Path         | For                                          | Sign in with                          |
| ------------ | -------------------------------------------- | ------------------------------------- |
| `/api/v1`    | Your applications: payments and transactions | An application credential             |
| `/api/admin` | Administrators and tools                     | An administrator's email and password |
| `/webhooks`  | Payment providers                            | The account's webhook secret          |

## Authentication

Get a token with a form-encoded `POST`.

::: code-group

```sh [Application]
curl -X POST http://localhost:9090/api/v1/token \
	--data-urlencode 'grant_type=client_credentials' \
	--data-urlencode "client_id=$CLIENT_ID" \
	--data-urlencode "client_secret=$CLIENT_SECRET"
```

```sh [Administrator]
curl -X POST http://localhost:9090/api/admin/token \
	--data-urlencode 'grant_type=password' \
	--data-urlencode 'username=admin@example.com' \
	--data-urlencode "password=$ADMIN_PASSWORD"
```

:::

The response is an OAuth token object with `access_token` and `refresh_token`. Send the access token on every request:

```http
Authorization: Bearer <access token>
```

To refresh, `POST` `grant_type=refresh_token` and `refresh_token=<refresh token>` to `/api/v1/token/refresh` or `/api/admin/token/refresh`. What each token may do is set by [scopes and roles](/guide/access).

## Responses

Successful responses wrap the result in `data`:

```json
{ "success": true, "data": {} }
```

Errors carry a stable `code` and a human-readable `message`:

```json
{
	"success": false,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "currency must be exactly 3 characters"
	}
}
```

Match on `error.code`; the message may change. Token responses are the exception: a successful token response is the token object itself, without the wrapper.

## Pagination

List endpoints take `page` (default `1`) and `per_page` (default `20`, maximum `100`), and return this inside `data`:

```json
{ "page": 1, "total": 42, "count": 20, "items": [] }
```

`count` is the number of items on this page, `total` across all pages.

## Payments

Send `Content-Type: application/json` on every JSON request, or you get `415`.

Creating a collection or disbursement also needs an `Idempotency-Key` header. See [Retry safely](/guide/payments#retry-safely).

## Limits

| Limit           | Value                                   |
| --------------- | --------------------------------------- |
| Request body    | 1 MiB, or 256 KiB for provider webhooks |
| Request timeout | 65 seconds                              |
| Provider call   | 45 seconds                              |

## Rate limits

Per client address, per minute, per instance:

| Endpoints               | Requests |
| ----------------------- | -------- |
| Token endpoints         | 20       |
| Application endpoints   | 120      |
| Administrator endpoints | 120      |
| Webhooks                | 300      |

Going over returns `429 RATE_LIMITED`.

## Request IDs

Every response has an `X-Request-ID` header, which also appears in the logs. Send your own `X-Request-ID` (up to 64 visible ASCII characters) to trace a request through your systems.
