# Provider API reference

```go
import "github.com/momobasehq/momobase/providers"
```

One adapter value serves one provider account. Momobase may call it concurrently from payment requests, health checks, balance queries, webhooks, and reconciliation; synchronize any mutable state.

## Factory and minimum contract

```go
type Factory func(*slog.Logger) PaymentProvider

type PaymentProvider interface {
	Capabilities() []Capability
	Init(context.Context, ProviderConfig) error
}
```

- `Factory` must return a new, non-nil adapter value on every call.
- `Init` receives the decrypted account configuration plus the account's `environment`. Return an error when required settings are missing or invalid.
- `Capabilities` returns the service and payment-method pairs the initialized account supports. Declaring any payment capability requires `TransactionQuerier`.

## Operation interfaces

| Interface            | Method signature                                                                           | Purpose                                     |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `Collector`          | `Collect(context.Context, PaymentRequest) (*ProviderPaymentResponse, error)`               | Collect money from a customer               |
| `Disburser`          | `Disburse(context.Context, PaymentRequest) (*ProviderPaymentResponse, error)`              | Send money to a recipient                   |
| `TransactionQuerier` | `QueryTransaction(context.Context, string, string) (*ProviderTransactionStatus, error)`    | Query by provider reference and country     |
| `BalanceQuerier`     | `QueryBalance(context.Context, string) (*ProviderBalance, error)`                          | Query balances for a country                |
| `HealthChecker`      | `HealthCheck(context.Context) error`                                                       | Check upstream reachability and credentials |
| `WebhookVerifier`    | `VerifyWebhook(context.Context, []byte, map[string]string) (*ProviderWebhookEvent, error)` | Authenticate and normalize a raw callback   |
| `RequestValidator`   | `ValidateRequest(context.Context, *PaymentRequest) error`                                  | Validate or normalize account and scheme    |

- `Collector` is required for any collection capability; `Disburser` for any disbursement capability.
- Every provider operation has a 45-second deadline. Honor context cancellation and set transport limits on your HTTP client.

## Capabilities

```go
type Capability struct {
	ServiceType   string
	PaymentMethod PaymentMethod
}
```

| Service constants     | Payment method constants    |
| --------------------- | --------------------------- |
| `ServiceCollection`   | `PaymentMethodMomo`         |
| `ServiceDisbursement` | `PaymentMethodCard`         |
|                       | `PaymentMethodBankTransfer` |
|                       | `PaymentMethodWallet`       |

`PaymentMethods`, `ValidPaymentMethod`, `Supports`, and `SupportsService` inspect these values.

## Payment request

`PaymentRequest` is the normalized request passed to an adapter:

| Field           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `TransactionID` | Momobase transaction ID                                    |
| `PaymentMethod` | Selected payment method                                    |
| `Currency`      | Three-letter currency code                                 |
| `Country`       | Two-letter country code                                    |
| `Reference`     | Application business reference                             |
| `Account`       | Provider-specific payer or payee identifier                |
| `Scheme`        | Optional provider-specific network, bank, brand, or scheme |
| `Metadata`      | Provider-specific values; passed through, not stored       |
| `Name`          | Customer or recipient display name                         |
| `Email`         | Customer or recipient email                                |
| `Description`   | Payment narrative                                          |
| `Amount`        | Integer amount in currency minor units                     |

`RequestValidator` may change only `Account` and `Scheme`. Momobase rejects changes to any other field, and an `Account` normalized to an empty or unusable value.

## Payment and query responses

| Type                        | Fields                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `ProviderPaymentResponse`   | `ProviderReference` (upstream ID), `Status`, `Message`, `Raw` (optional; redacted before storage) |
| `ProviderTransactionStatus` | `ProviderReference`, `Status`, `Message`                                                          |
| `ProviderBalance`           | `Currency`, `Available`, `Ledger` (both in minor units)                                           |

`Status` is a constant below, or an upstream value that `PaymentStatus` recognizes.

## Transaction statuses

| Constant       | Value        | Terminal |
| -------------- | ------------ | -------- |
| `TxPending`    | `pending`    | No       |
| `TxProcessing` | `processing` | No       |
| `TxUnknown`    | `unknown`    | No       |
| `TxSucceeded`  | `succeeded`  | Yes      |
| `TxFailed`     | `failed`     | Yes      |
| `TxCancelled`  | `cancelled`  | Yes      |
| `TxExpired`    | `expired`    | Yes      |

`PaymentStatus` maps common spellings of success, failure, processing, cancellation, and expiry. Anything else becomes `unknown`. Map provider-specific codes yourself.

## Webhook event

`ProviderWebhookEvent` must include `ProviderReference`, `Status`, and an event type. Optional fields are checked against the transaction when present:

| Field               | Check                                            |
| ------------------- | ------------------------------------------------ |
| `ExternalReference` | Exact match with the application's reference     |
| `Amount`            | Exact match in minor units                       |
| `Currency`          | Case-insensitive match                           |
| `Country`           | Case-insensitive match                           |
| `Account`           | Exact match with the stored (normalized) account |
| `Raw`               | Stored after sensitive keys are redacted         |

The webhook endpoint checks the account's `X-Webhook-Secret` first. `VerifyWebhook` must still verify the provider's own signature, MAC, certificate, or equivalent before trusting any value.

## Configuration helpers

`ProviderConfig` is `map[string]any`. Momobase sets `environment` before calling `Init`, overriding any stored value.

| Helper                      | Behavior                                       |
| --------------------------- | ---------------------------------------------- |
| `ConfigString(config, key)` | Returns a trimmed string                       |
| `ConfigBool(config, key)`   | `true` for case-insensitive `true` or `1`      |
| `ConfigInt(config, key)`    | Converts to `int`; zero when invalid           |
| `ConfigPath(config, "a.b")` | Reads a string through nested `map[string]any` |
| `First(values...)`          | Returns the first non-blank trimmed string     |

## Utility functions

| Helper               | Use                                                                |
| -------------------- | ------------------------------------------------------------------ |
| `DoJSON`             | Send a context-bound JSON request and decode a successful response |
| `FormatAmountMinor`  | Format minor units using the currency's precision                  |
| `ParseAmountToMinor` | Parse a decimal amount into minor units                            |
| `OptionalAmount`     | Parse a non-blank amount, or return `nil`                          |
| `PaymentStatus`      | Normalize common provider status names                             |
| `RandomRef`          | Generate a random prefixed reference                               |
| `Redact`             | Remove likely secrets and truncate provider error text             |

`DoJSON` reads at most 4 KiB of an unsuccessful response body and redacts the error. It does not add authentication, retries, or a client timeout.

## Exported errors

| Error                     | Meaning                                               |
| ------------------------- | ----------------------------------------------------- |
| `ErrCircuitOpen`          | An open provider circuit refused the operation        |
| `ErrOperationUnsupported` | The adapter does not implement the optional operation |

Check them with `errors.Is`.
