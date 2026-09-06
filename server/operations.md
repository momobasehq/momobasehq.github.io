# Operate the server

Verify a running deployment, inspect workers and provider runtimes, and diagnose the payment failures that actually happen.

The administration dashboard at `DASHBOARD_PATH` shows most of what follows. The examples here use the [TypeScript SDK](/sdk/) because a runbook needs to be scriptable; the same data is available from the [Admin API](/api-reference) directly.

## Check the process and database

Use the unauthenticated endpoints for load balancers and orchestrators:

```sh
curl --fail https://payments.example.com/ping
curl --fail https://payments.example.com/healthz
```

`/ping` is a liveness response. `/healthz` returns `{"success":true,"data":{"ok":true}}`. Neither performs a provider check.

Use the authenticated system endpoint when an operator needs database and runtime state:

```ts
const health = await admin.system.health();

console.log({
	ok: health.ok,
	database: health.database,
	runtimes: health.runtime_provider_count,
	activeAccounts: health.active_provider_account_count,
});
```

## Inspect background workers

```ts
const workers = await admin.system.workers();

for (const worker of workers.items) {
	console.log(worker.name, worker.configured, worker.state);
}
```

The server configures three workers:

| Worker           | Responsibility                                                              |
| ---------------- | --------------------------------------------------------------------------- |
| `health`         | Check loaded providers and persist reachability, latency, and circuit state |
| `reconciliation` | Query unresolved transactions and reprocess unmatched verified webhooks     |
| `cleanup`        | Remove expired administrator and application sessions                       |

Workers run once at start-up and then at their configured interval. `WORKERS_ENABLED=false` prevents all three from being registered. Running more than one replica requires [assigning worker ownership](/server/deployment#assign-worker-ownership).

## Inspect provider runtimes

```ts
const [runtimes, health] = await Promise.all([
	admin.system.runtimeProviders(),
	admin.providers.health(),
]);
```

A persisted provider account routes payments only while its runtime is loaded. Compare the account's `config_version` with the runtime version and inspect:

- `initialized` and declared `capabilities`;
- configured country and currency;
- health status and consecutive failures;
- circuit state; and
- collection, disbursement, and balance-query availability.

Test a provider account before activating it:

```ts
await admin.providers.test(providerAccountId);
await admin.providers.activate(providerAccountId);
```

Testing decrypts the stored configuration, initializes a temporary adapter, validates its capabilities, and runs `HealthCheck` when implemented.

## Diagnose `ROUTE_UNAVAILABLE`

`ROUTE_UNAVAILABLE` means no route passed the current eligibility checks. Confirm that:

1. the application and provider account use the payment currency;
2. the provider account country matches the request;
3. an active route exists for the service and payment method;
4. the provider account is active and initialized;
5. the adapter declares that route's capability; and
6. health and circuit state allow routing.

Use application payment-method discovery as the final check:

```ts
const methods = await app.paymentMethods.list({
	serviceType: "collection",
	country: "UG",
});
```

See [Routing payments](/guide/routing) for the complete selection order.

## Diagnose unresolved transactions

A `processing` or `unknown` transaction needs a provider status query or verified webhook before it can settle. Check:

- the reconciliation worker is configured and running;
- the adapter implements `TransactionQuerier`;
- the transaction has a provider reference;
- the original provider account runtime is loaded;
- provider health and circuit state; and
- `next_reconcile_at`, `last_reconciled_at`, and `reconciliation_attempts` on the transaction.

Reconciliation always queries the provider account selected for the original attempt. Do not manually route an unresolved transaction to another provider.

## Diagnose rejected webhooks

A rejected callback failed one of the [two authentication layers](/api/conventions#webhook-authentication), or its fields did not match the transaction. Work through them in order:

1. Does `X-Webhook-Secret` match the provider account's stored `webhook_secret`?
2. Does the adapter's `VerifyWebhook` accept the provider's own signature over the raw body?
3. Do the event's amount, currency, country, external reference, and account match the stored transaction?

Duplicate verified events are ignored rather than rejected. An event that arrives before its provider reference can be matched is stored, not dropped — the reconciliation worker retries it.

## Preserve diagnostic context

The server accepts or generates `X-Request-ID`, returns it in the response, and includes it in request logs. Carry this identifier into incident records.

Provider errors are redacted and truncated before they are logged or persisted. Keep raw credentials, payment accounts, webhook bodies, and access tokens out of your own logs too.

Set `LOG_LEVEL=debug` when reproducing a failure, and put it back afterwards.
