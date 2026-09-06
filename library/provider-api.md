# Provider API reference

Provider adapters implement contracts from:

```go
import "github.com/momobasehq/momobase/providers"
```

One adapter value represents one configured provider account. Momobase may call it concurrently from payment requests, health checks, balance queries, webhooks, and reconciliation, so adapters must synchronize mutable state.

## Factory and minimum contract

```go
type Factory func(*slog.Logger) PaymentProvider

type PaymentProvider interface {
	Capabilities() []Capability
	Init(context.Context, ProviderConfig) error
}
```

`Factory` must return a non-nil, independent adapter value. `Init` receives decrypted provider configuration plus the authoritative account `environment`. It must validate required settings and return an error when the account cannot be used.

`Capabilities` returns the service and payment-method pairs enabled by the initialized configuration. A provider that returns payment capabilities must also implement `TransactionQuerier` so unresolved results can be reconciled.

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

`Collector` is required for every declared collection capability. `Disburser` is required for every declared disbursement capability.

Momobase bounds provider operations to 45 seconds. Adapters must honor context cancellation and configure any underlying HTTP client with appropriate transport limits.

## Capabilities

```go
type Capability struct {
	ServiceType  string
	PaymentMethod PaymentMethod
}
```

Service constants:

- `ServiceCollection`
- `ServiceDisbursement`

Payment method constants:

- `PaymentMethodMomo`
- `PaymentMethodCard`
- `PaymentMethodBankTransfer`
- `PaymentMethodWallet`

`PaymentMethods`, `ValidPaymentMethod`, `Supports`, and `SupportsService` inspect these values.

## Payment request

`PaymentRequest` contains the normalized request passed to an adapter:

| Field           | Meaning                                                            |
| --------------- | ------------------------------------------------------------------ |
| `TransactionID` | Momobase transaction ID                                            |
| `PaymentMethod` | Selected payment rail                                              |
| `Currency`      | Three-letter currency code                                         |
| `Country`       | Two-letter country code                                            |
| `Reference`     | Application business reference                                     |
| `Account`       | Provider-specific payer or payee identifier                        |
| `Scheme`        | Optional provider-specific network, bank, brand, or scheme         |
| `Metadata`      | Provider-specific request values; passed through and not persisted |
| `Name`          | Customer or recipient display name                                 |
| `Email`         | Customer or recipient email                                        |
| `Description`   | Human-readable payment narrative                                   |
| `Amount`        | Integer amount in currency minor units                             |

`RequestValidator` may replace only `Account` and `Scheme`. Momobase rejects adapters that modify identity, routing, or monetary fields, or normalize the account to an empty or unusable value.

## Payment and query responses

`ProviderPaymentResponse` contains:

- `ProviderReference`: the upstream transaction identifier;
- `Status`: a normalized status or an upstream value understood by `PaymentStatus`;
- `Message`: human-readable result text; and
- `Raw`: optional structured upstream data, redacted before persistence.

`ProviderTransactionStatus` contains `ProviderReference`, `Status`, and `Message`.

`ProviderBalance` contains `Currency`, `Available`, and `Ledger`. Both balances use currency minor units.

## Transaction statuses

Return one of these constants after mapping provider-specific states:

| Constant       | Value        | Terminal |
| -------------- | ------------ | -------- |
| `TxPending`    | `pending`    | No       |
| `TxProcessing` | `processing` | No       |
| `TxUnknown`    | `unknown`    | No       |
| `TxSucceeded`  | `succeeded`  | Yes      |
| `TxFailed`     | `failed`     | Yes      |
| `TxCancelled`  | `cancelled`  | Yes      |
| `TxExpired`    | `expired`    | Yes      |

`PaymentStatus` recognizes common success, failure, processing, cancellation, and expiry spellings. Unrecognized values become `unknown`. Map bespoke or ambiguous provider codes explicitly instead of relying on this helper.

## Webhook event

`ProviderWebhookEvent` must include `ProviderReference`, `Status`, and an event type. It may also include:

| Field               | Validation performed by Momobase when present            |
| ------------------- | -------------------------------------------------------- |
| `ExternalReference` | Exact match with the application's transaction reference |
| `Amount`            | Exact match in minor currency units                      |
| `Currency`          | Case-insensitive match                                   |
| `Country`           | Case-insensitive match                                   |
| `Account`           | Exact match with the account stored after normalization  |
| `Raw`               | Stored only after sensitive map keys are redacted        |

The public webhook endpoint first verifies the provider account's `X-Webhook-Secret`. `WebhookVerifier` must independently verify the upstream provider's signature, MAC, certificate, or equivalent proof before decoding values as trusted.

## Configuration helpers

`ProviderConfig` is `map[string]any`. Momobase adds `environment` before calling `Init`, overriding a value stored in provider configuration.

| Helper                      | Behavior                                              |
| --------------------------- | ----------------------------------------------------- |
| `ConfigString(config, key)` | Returns a trimmed string representation               |
| `ConfigBool(config, key)`   | Accepts case-insensitive `true` or `1`                |
| `ConfigInt(config, key)`    | Converts to `int`, returning zero when invalid        |
| `ConfigPath(config, "a.b")` | Reads a string through nested `map[string]any` values |
| `First(values...)`          | Returns the first nonblank trimmed string             |

## Utility functions

| Helper               | Use                                                                     |
| -------------------- | ----------------------------------------------------------------------- |
| `DoJSON`             | Send a context-bound JSON request and decode a successful JSON response |
| `FormatAmountMinor`  | Format integer minor units using known currency precision               |
| `ParseAmountToMinor` | Parse a decimal provider amount into integer minor units                |
| `OptionalAmount`     | Parse a nonblank amount or return `nil`                                 |
| `PaymentStatus`      | Normalize common provider status names                                  |
| `RandomRef`          | Generate a random prefixed reference                                    |
| `Redact`             | Remove likely secrets and truncate provider error text                  |

`DoJSON` reads at most 4 KiB from unsuccessful response bodies and redacts the resulting error. It does not choose authentication, retries, or an HTTP client timeout for the adapter.

## Exported errors

| Error                     | Meaning                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `ErrCircuitOpen`          | An operation was refused by an open provider circuit        |
| `ErrOperationUnsupported` | The loaded adapter does not implement an optional operation |

Use `errors.Is` when handling these values.
