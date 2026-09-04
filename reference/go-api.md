# Go API reference

Import the root package to construct and operate a Momobase instance:

```go
import "github.com/momobasehq/momobase"
```

Provider contracts live in `github.com/momobasehq/momobase/providers`, and lifecycle event types live in `github.com/momobasehq/momobase/hooks`.

## Construction

### `New(opts ...Option) (*Instance, error)`

Loads or accepts configuration, validates it, opens the database, optionally applies migrations, seeds authorization data, and constructs the API, services, provider runtime manager, workers, and hooks.

At least one provider factory must be registered. The caller owns every successful instance and must call `Close`.

### `LoadConfig() (Config, error)`

Loads configuration from environment variables. Invalid explicit boolean or duration values return an error. See [Configuration](/reference/configuration).

## Options

| Option                        | Effect                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `WithConfig(cfg)`             | Uses a complete `Config` instead of loading the environment                                    |
| `WithConfigFunc(fn)`          | Mutates resolved configuration; functions run in supplied order after configuration resolution |
| `WithAddr(addr)`              | Sets `Config.App.Addr`                                                                         |
| `WithLogger(logger)`          | Replaces the configured JSON logger with a host-owned `*slog.Logger`                           |
| `WithProvider(code, factory)` | Registers or replaces one provider factory under `code`                                        |
| `WithProviders(factories)`    | Registers or replaces several provider factories                                               |

Blank provider codes and nil factories are rejected during construction. Supplying the same code more than once keeps the last factory.

## Instance lifecycle

| Method             | Description                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `Run() error`      | Serves until `SIGINT` or `SIGTERM`, then shuts down gracefully                                        |
| `Serve(ctx) error` | Starts provider runtimes, workers, and HTTP; stops when the context is cancelled or the server exits  |
| `Close() error`    | Stops an active server and workers, then closes the database connection pool; safe to call repeatedly |
| `Addr() string`    | Returns the configured address, or the bound address after serving begins with port `0`               |

An instance can be served once. Calling `Serve` after it has already served or after it has closed returns an error. Context-driven shutdown is not returned as an error by `Instance.Serve`.

`Close` waits for an active server and workers to stop. It does not close a logger supplied through `WithLogger`.

## Setup and migrations

| Method                                        | Description                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Migrate(ctx) error`                          | Applies versioned migrations and converges current models; safe to call repeatedly |
| `SeedAdmin(ctx, email, password, name) error` | Creates a `super_admin`; intended as a one-time bootstrap operation                |

`New` calls `Migrate` automatically unless `Features.AutoMigrate` is false. `SeedAdmin` is not idempotent: calling it again with the same email returns the underlying uniqueness error.

## Host integration

| Method     | Result         | Use                                                                          |
| ---------- | -------------- | ---------------------------------------------------------------------------- |
| `App()`    | `*fiber.App`   | Add Fiber routes, mount the application, or exercise it in tests             |
| `DB()`     | `*gorm.DB`     | Access the instance-owned database when an extension cannot use a public API |
| `Logger()` | `*slog.Logger` | Write extension logs through the configured structured logger                |

`App` uses Fiber v3 and fasthttp; it is not a standard-library `http.Handler`. Database callers must not close the handle returned by `DB` because the instance owns it.

## Hooks

### `OnPaymentRequest() *hooks.Hook[hooks.PaymentRequestEvent]`

Returns the blocking pre-routing hook. Handlers run in registration order. The first error rejects the payment with `PAYMENT_REJECTED`; idempotent replays skip the hook.

`PaymentRequestEvent` contains:

| Field           | Meaning                                |
| --------------- | -------------------------------------- |
| `AppID`         | Calling application ID                 |
| `ServiceType`   | `collection` or `disbursement`         |
| `PaymentMethod` | Requested payment rail                 |
| `Amount`        | Integer amount in currency minor units |
| `Currency`      | Normalized three-letter currency code  |
| `Country`       | Normalized two-letter country code     |
| `Reference`     | Application business reference         |
| `Account`       | Payer or payee account; sensitive      |
| `Scheme`        | Optional provider-specific scheme      |
| `Description`   | Payment narrative                      |
| `PartyName`     | Customer or recipient name; sensitive  |
| `PartyEmail`    | Customer or recipient email; sensitive |

### `OnTransactionChanged() *hooks.Hook[hooks.TransactionChangedEvent]`

Returns the post-commit status hook. All handlers run even when one fails; errors are logged and do not roll back the transaction.

`TransactionChangedEvent` includes the source (`request`, `webhook`, or `reconciliation`), application and transaction identifiers, business reference, service, method, amount, currency, country, previous and new status, provider account ID, and provider reference. It excludes provider credentials, raw responses, webhook bodies, and customer account data.

### Bind and remove handlers

```go
unbind := instance.OnTransactionChanged().Bind(handler)
defer unbind()
```

`Bind` panics for a nil handler and returns an idempotent removal function. Binding and removal are safe during concurrent invocation. A handler already present in the current invocation snapshot may still finish.

The authoritative package-level symbol reference is also available on [pkg.go.dev](https://pkg.go.dev/github.com/momobasehq/momobase).
