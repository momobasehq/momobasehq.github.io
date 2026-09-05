# Operate Momobase

Use this guide to verify a running deployment, inspect workers and provider runtimes, and diagnose common payment failures. Administrative examples use `MomobaseAdminClient`; equivalent endpoints are available in the [API reference](/api-reference).

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

Momobase can configure three workers:

| Worker           | Responsibility                                                              |
| ---------------- | --------------------------------------------------------------------------- |
| `health`         | Check loaded providers and persist reachability, latency, and circuit state |
| `reconciliation` | Query unresolved transactions and reprocess unmatched verified webhooks     |
| `cleanup`        | Remove expired administrator and application sessions                       |

Workers run once at startup and then at their configured interval. Setting `Workers.Enabled` to `false` prevents all three from being registered.

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

Webhook requests use `POST /webhooks/:providerAccountID` and must pass both checks:

1. `X-Webhook-Secret` must match the provider account's stored `webhook_secret`.
2. The adapter's `VerifyWebhook` must authenticate and normalize the raw provider payload.

When an event supplies transaction fields, its amount, currency, country, external reference, and account must match the stored transaction. Duplicate verified events are ignored. A valid event that arrives before Momobase can match its provider reference remains stored for the reconciliation worker to retry.

## Run migrations safely

For a single development instance, `Features.AutoMigrate` defaults to `true` and applies migrations during `momobase.New`.

For controlled deployments:

1. Set `Features.AutoMigrate` to `false` in every serving replica.
2. Back up the database and encryption master key.
3. Construct one migration instance and call `instance.Migrate(ctx)`.
4. Deploy serving replicas only after migration succeeds.

Migrations are forward-only. Momobase does not provide automatic down migrations.

## Preserve diagnostic context

Momobase accepts or generates `X-Request-ID`, returns it in the response, and includes it in request logs. Carry this identifier into incident records.

Provider errors are redacted and truncated before they are logged or persisted. Do not add raw credentials, payment accounts, webhook bodies, or access tokens to application logs when extending Momobase.
