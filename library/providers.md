# Build a provider adapter

A provider adapter connects Momobase to one payment provider's API. Check the [included providers](/guide/providers#included-providers) first; the one you need may already exist.

## What you need

- A Go program that [embeds an instance](/library/). The prebuilt server runs only the adapters built into it.
- The provider's API documentation and sandbox credentials.

Start from the complete [`_examples/customprovider`](https://github.com/momobasehq/momobase/tree/main/_examples/customprovider) adapter.

## Implement the contract

Every adapter implements `providers.PaymentProvider`:

```go
import "github.com/momobasehq/momobase/providers"

type PaymentProvider interface {
	Capabilities() []Capability
	Init(context.Context, ProviderConfig) error
}
```

- `Init` receives one provider account's configuration, a `map[string]any`, plus its `environment`. Return an error when a setting is missing or invalid. Read values with `providers.ConfigString`, `ConfigBool`, and `ConfigInt`.
- `Capabilities` returns the service and payment method pairs the account supports, such as `{ServiceCollection, PaymentMethodMomo}`. Routes can only use these.
- Momobase creates one adapter value per provider account and may call it concurrently, so protect any shared state.

Then implement the operations your capabilities need:

| Interface            | Method                                                                                     | Needed                                |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `Collector`          | `Collect(context.Context, PaymentRequest) (*ProviderPaymentResponse, error)`               | For any collection capability         |
| `Disburser`          | `Disburse(context.Context, PaymentRequest) (*ProviderPaymentResponse, error)`              | For any disbursement capability       |
| `TransactionQuerier` | `QueryTransaction(context.Context, string, string) (*ProviderTransactionStatus, error)`    | Always: Momobase uses it to follow up |
| `HealthChecker`      | `HealthCheck(context.Context) error`                                                       | Recommended. Also runs at start-up    |
| `WebhookVerifier`    | `VerifyWebhook(context.Context, []byte, map[string]string) (*ProviderWebhookEvent, error)` | When the provider sends callbacks     |
| `RequestValidator`   | `ValidateRequest(context.Context, *PaymentRequest) error`                                  | When accounts need a set format       |
| `BalanceQuerier`     | `QueryBalance(context.Context, string) (*ProviderBalance, error)`                          | When the provider reports balances    |

- Amounts are integers in the currency's minor unit.
- Return a status constant: `TxPending`, `TxProcessing`, `TxUnknown`, `TxSucceeded`, `TxFailed`, `TxCancelled`, or `TxExpired`. `providers.PaymentStatus` maps common provider spellings; map provider-specific codes yourself.
- Every call has a 45-second deadline. Honor context cancellation and set timeouts on your HTTP client.

## Validate accounts

Momobase treats the payment's `Account` as an opaque string. When the provider needs a specific format, such as a phone number with a country code, normalize it in `ValidateRequest`:

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

It may change only `Account` and `Scheme`.

## Verify webhooks

`VerifyWebhook` gets the raw body and headers. Check the provider's signature, or equivalent proof, before trusting any value. Momobase checks the account's `X-Webhook-Secret` first, but that doesn't replace the provider's own check.

Return a `ProviderWebhookEvent` with the `ProviderReference`, `Status`, and event type. Include the amount, currency, country, account, and external reference when the callback has them: Momobase rejects the webhook if they don't match the payment.

## Register it

```go
instance, err := momobase.New(
	momobase.WithProvider("acme_pay", newAcmeProvider),
)
```

A factory takes a `*slog.Logger` and returns a new adapter on every call. Then create a provider account with provider code `acme_pay`, test it, activate it, and add routes.

## Test before moving money

1. Unit-test configuration, account formats, status mapping, and webhook signatures.
2. Test timeouts and cancellation against a fake provider, with `go test -race`.
3. In the provider's sandbox, try collections, disbursements, retries with the same idempotency key, duplicate webhooks, and a payment settled by follow-up.
4. Check that errors and logs contain no credentials or customer data. `providers.Redact` strips likely secrets from error text.

Every type and helper is on [pkg.go.dev](https://pkg.go.dev/github.com/momobasehq/momobase/providers).
