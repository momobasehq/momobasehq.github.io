# Build a provider adapter

A provider adapter connects Momobase to one upstream payment API. Check the [official providers](/library/official-providers) first; the one you need may already exist.

## What you need

- A Go program that [embeds an instance](/library/embedding). The prebuilt server runs only the adapters compiled into it.
- The provider's API documentation and sandbox credentials.
- The package `github.com/momobasehq/momobase/providers`.

Start from the complete [`_examples/customprovider`](https://github.com/momobasehq/momobase/tree/main/_examples/customprovider) adapter.

## Implement the minimum contract

Every adapter implements `PaymentProvider`:

```go
type PaymentProvider interface {
	Capabilities() []Capability
	Init(context.Context, ProviderConfig) error
}
```

- `Init` validates one provider account's configuration. It can run again when the account changes, so replace old state instead of merging. Read values with `providers.ConfigString`, `ConfigBool`, and `ConfigInt`.
- `Capabilities` returns the service and payment-method pairs the account supports. Routes can be created only for these pairs. Duplicate or unsupported capabilities stop the adapter from loading.
- Momobase creates a separate adapter value per provider account, and again when it tests or reloads one. Calls can arrive concurrently, so protect mutable state.

## Implement payment operations

Required:

| Interface            | When                                                    |
| -------------------- | ------------------------------------------------------- |
| `Collector`          | You declare any collection capability                   |
| `Disburser`          | You declare any disbursement capability                 |
| `TransactionQuerier` | You declare any payment capability (for reconciliation) |

Optional, in order of usefulness:

| Interface          | Add it when                                    |
| ------------------ | ---------------------------------------------- |
| `HealthChecker`    | Always, so health checks can see the upstream  |
| `WebhookVerifier`  | The provider sends callbacks                   |
| `RequestValidator` | The provider expects a specific account format |
| `BalanceQuerier`   | The provider reports balances                  |

Signatures are in the [provider API reference](/library/provider-api#operation-interfaces).

- Return the `providers` status constants, such as `TxPending`, `TxSucceeded`, or `TxFailed`.
- Amounts are integers in currency minor units.
- Calls have a 45-second deadline. Honor context cancellation and set your HTTP client's transport limits.
- Use the helpers `providers.DoJSON`, `ParseAmountToMinor`, `FormatAmountMinor`, `PaymentStatus`, `RandomRef`, and `Redact` for common work.

## Validate provider-specific accounts

Momobase treats `PaymentRequest.Account` as an opaque string. Implement `RequestValidator` when the provider needs a phone number, bank account, card token, wallet address, or similar in a specific format:

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

It runs after route selection and before the transaction is stored. It may change only `Account` and `Scheme`.

## Verify webhooks

`VerifyWebhook` must check the provider's signature (or equivalent proof) against the raw body and headers before trusting any value. Momobase checks the account's `X-Webhook-Secret` first, but that does not replace the provider's signature check. See [webhook authentication](/api/conventions#webhook-authentication).

Return a `ProviderWebhookEvent` with the provider reference and status. Include amount, currency, country, account, and external reference when the callback has them; Momobase checks them against the transaction. Never log credentials or unredacted payment data.

## Register the adapter

A factory receives a provider-scoped logger and returns a new adapter:

```go
instance, err := momobase.New(
	momobase.WithProvider("acme_pay", newAcmeProvider),
)
```

Then, as an administrator: create a provider account with `provider_code` `acme_pay`, test it, activate it, and add routes for its capabilities. The account's `environment` is always passed to `Init`, overriding any `environment` key in its configuration.

## Test before moving money

1. Unit-test configuration, account normalization, status mapping, and webhook signatures.
2. Test timeouts and cancellation against a fake upstream.
3. Run the tests with Go's race detector (`go test -race`).
4. Create and test a sandbox provider account through the Admin API.
5. Exercise collections, disbursements, repeated idempotency keys, duplicate webhooks, a webhook that arrives before the provider result, and reconciliation.
6. Confirm that errors and stored raw payloads contain no credentials or customer data.
