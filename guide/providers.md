# Build a provider adapter

A provider adapter translates Momobase's normalized payment contract to one upstream payment API. This guide defines the required interfaces, registration step, and checks needed before an account can route.

Start with the complete [`examples/customprovider`](https://github.com/momobasehq/momobase/tree/main/examples/customprovider) adapter when implementing a real provider.

## Implement the minimum contract

Every provider implements `PaymentProvider`:

```go
type PaymentProvider interface {
	Capabilities() []Capability
	Init(context.Context, ProviderConfig) error
}
```

`Init()` validates one provider account's decrypted configuration. It can run again after the account changes, so replace old state rather than merging it. Helpers such as `providers.ConfigString`, `ConfigBool`, and `ConfigInt` read flat configuration values.

`Capabilities()` returns the service and payment-method pairs available under the current configuration. Momobase will not create a route outside that list.

Momobase constructs a separate adapter for each provider account and whenever it tests or reloads configuration. Do not rely on `Init` running exactly once. An active adapter can receive concurrent calls from requests and workers, so protect mutable state.

## Implement payment operations

Implement only the operations the upstream API supports:

| Interface            | Method             | Purpose                                                                                  |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `Collector`          | `Collect`          | Request money from a customer                                                            |
| `Disburser`          | `Disburse`         | Send money to a recipient                                                                |
| `TransactionQuerier` | `QueryTransaction` | Read status and support reconciliation; required when any payment capability is declared |
| `BalanceQuerier`     | `QueryBalance`     | Read the provider balance                                                                |
| `HealthChecker`      | `HealthCheck`      | Verify upstream reachability and credentials                                             |
| `WebhookVerifier`    | `VerifyWebhook`    | Authenticate and normalize callbacks                                                     |
| `RequestValidator`   | `ValidateRequest`  | Validate provider-specific request data before persistence                               |

Return the status constants in `providers`, such as `TxPending`, `TxSucceeded`, or `TxFailed`. Amounts use integer minor currency units throughout Momobase.

Every declared collection capability requires `Collector`; every declared disbursement capability requires `Disburser`. Duplicate or unsupported capabilities prevent the provider runtime from loading.

Provider calls have a 45-second context deadline. Honor cancellation and give any HTTP client its own appropriate transport settings. Helpers such as `providers.DoJSON`, `ParseAmountToMinor`, `FormatAmountMinor`, `PaymentStatus`, `RandomRef`, and `Redact` cover common adapter work; see the [provider API reference](/reference/provider-api).

## Validate provider-specific accounts

Momobase deliberately treats `PaymentRequest.Account` as opaque. Implement `RequestValidator` when the upstream requires an MSISDN, bank account, card token, wallet address, or provider-specific metadata.

```go
func (p *Provider) ValidateRequest(_ context.Context, req *providers.PaymentRequest) error {
	account, err := normalizeAccount(req.Account, req.Country)
	if err != nil {
		return err
	}
	req.Account = account
	return nil
}
```

Validation runs after route selection and before Momobase persists a transaction. It may rewrite only `Account` and `Scheme`.

## Verify webhooks

`VerifyWebhook()` must authenticate the raw body and headers before decoding trusted values. Return a normalized `ProviderWebhookEvent` with the provider reference and status.

Include amount, currency, country, account, and external reference when the callback supplies them. Momobase compares these values with the transaction before applying the change. Never log provider credentials or unredacted raw payment data.

Momobase also requires `X-Webhook-Secret` to match the provider account's `webhook_secret` before invoking the adapter. This protects the Momobase endpoint; it does not replace verification of the upstream provider's signature inside `VerifyWebhook`.

## Register the adapter

Factories receive a provider-scoped logger and return a new provider value:

```go
instance, err := momobase.New(
	momobase.WithProvider("acme_pay", newAcmeProvider),
)
```

Operators then create a provider account whose `provider_code` is `acme_pay`, test it, activate it, and create routes matching its capabilities.

Provider configuration is encrypted before persistence and never returned by the Admin API. `Init` receives the account's authoritative `environment` value even if encrypted configuration contains a different value.

## Verify the adapter

Before enabling real money movement:

1. Unit-test configuration, account normalization, status mapping, and webhook signatures.
2. Test timeouts and cancellation against a fake upstream.
3. Create and test a sandbox provider account through the Admin API.
4. Exercise collection, disbursement, duplicate idempotency keys, webhooks, and reconciliation.
5. Confirm errors and raw payloads redact credentials and customer data.

Also run the adapter under Go's race detector. Exercise repeated initialization, caller cancellation, circuit recovery, webhook duplication, and a webhook that arrives before the initial provider result is persisted.
