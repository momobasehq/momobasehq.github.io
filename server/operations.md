# Operate the server

Check a running deployment and fix the payment problems you are most likely to hit. The dashboard shows most of this information. The commands below use the [Admin API](/api-reference) so you can script them. The [SDKs](/sdk/) wrap the same endpoints.

## What you need

- `curl` and `jq`.
- The server's URL and an administrator account.

Set up your shell:

```sh
export MOMOBASE_URL=https://payments.example.com

export ADMIN_TOKEN="$(
	curl --fail --silent --show-error \
		--data-urlencode 'grant_type=password' \
		--data-urlencode 'username=admin@example.com' \
		--data-urlencode 'password=your-password' \
		"$MOMOBASE_URL/api/admin/token" |
		jq -er '.access_token'
)"
```

## Check the process and database

```sh
curl --fail "$MOMOBASE_URL/ping"      # liveness
curl --fail "$MOMOBASE_URL/healthz"   # readiness: {"success":true,"data":{"ok":true}}
```

Neither endpoint checks providers. For database and runtime state:

```sh
curl --fail --silent -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/system/health" | jq '.data'
```

Check that `database` is `ok`, and that `runtime_provider_count` matches the number of active provider accounts (`active_provider_account_count`).

## Check background workers

```sh
curl --fail --silent -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/workers" | jq '.data'
```

| Worker           | What it does                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| `health`         | Checks each loaded provider and records reachability, latency, and circuit state |
| `reconciliation` | Queries providers about unresolved transactions and retries unmatched webhooks   |
| `cleanup`        | Removes expired administrator and application sessions                           |

Workers run at start-up and then at their [configured interval](/server/configuration#workers). With `WORKERS_ENABLED=false`, none of them run. With several replicas, [enable workers on exactly one](/server/deployment#assign-worker-ownership).

## Check provider accounts

```sh
curl --fail --silent -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/runtime/providers" | jq '.data'

curl --fail --silent -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/health/providers" | jq '.data'
```

A provider account handles payments only while its runtime is loaded. For each account, check:

- `initialized` and the declared `capabilities`;
- country and currency;
- health status and consecutive failures;
- circuit state; and
- that the account's `config_version` matches the runtime's version.

Test a provider account, then activate it:

```sh
curl --fail --silent -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/providers/accounts/$PROVIDER_ID/test" | jq

curl --fail --silent -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/providers/accounts/$PROVIDER_ID/activate" | jq
```

The test loads the stored configuration into a temporary adapter and runs its health check.

## Diagnose `ROUTE_UNAVAILABLE`

No route passed the eligibility checks. Confirm each of these:

1. The application and the provider account use the payment's currency.
2. The provider account's country matches the request.
3. An active route exists for the service and payment method.
4. The provider account is active and its runtime is loaded.
5. The adapter declares the route's service and payment method.
6. Provider health and circuit state allow routing.

Then ask the application API which methods are available right now, using an application token:

```sh
curl --fail --silent -H "Authorization: Bearer $APP_TOKEN" \
	"$MOMOBASE_URL/api/v1/payment-methods?service_type=collection&country=UG" | jq
```

See [Routing](/guide/routing) for the full selection order.

## Diagnose unresolved transactions

A `processing` or `unknown` transaction settles only after a provider status query or a verified webhook. Check that:

- the reconciliation worker is running;
- the adapter implements `TransactionQuerier`;
- the transaction has a provider reference;
- the original provider account's runtime is loaded;
- provider health and circuit state allow calls; and
- the transaction's `next_reconcile_at`, `last_reconciled_at`, and `reconciliation_attempts` are moving.

Reconciliation always asks the provider account used for the original attempt. Never send an unresolved transaction to another provider.

## Diagnose rejected webhooks

Check these in order:

1. `X-Webhook-Secret` matches the provider account's `webhook_secret`.
2. The adapter's `VerifyWebhook` accepts the provider's signature over the raw body.
3. The event's amount, currency, country, external reference, and account match the stored transaction.

See [webhook authentication](/api/conventions#webhook-authentication). Duplicate events are ignored. An event that arrives before its transaction can be matched is stored, and the reconciliation worker retries it.

## Trace a request

Every response carries an `X-Request-ID` header, and request logs include it. Send your own `X-Request-ID` to use your identifier instead. Record it when you report or investigate a problem.

To see more detail while you reproduce a problem, set `LOG_LEVEL=debug`, then set it back.

Keep credentials, payment accounts, webhook bodies, and access tokens out of your own logs. Momobase redacts provider errors before logging them.
