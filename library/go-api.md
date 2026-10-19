# Go API reference

| Package                                    | Contains                          |
| ------------------------------------------ | --------------------------------- |
| `github.com/momobasehq/momobase`           | Instance construction and control |
| `github.com/momobasehq/momobase/providers` | Provider adapter contracts        |
| `github.com/momobasehq/momobase/hooks`     | Hook event types                  |

The full symbol list is on [pkg.go.dev](https://pkg.go.dev/github.com/momobasehq/momobase).

## Construction

### `New(opts ...Option) (*Instance, error)`

Validates configuration, opens the database, applies migrations (unless `Features.AutoMigrate` is false), and builds the API, services, provider runtimes, workers, and hooks.

- Uses `DefaultConfig()` unless `WithConfig` is passed.
- Requires at least one registered provider factory.
- You must call `Close` on every instance it returns.

### `DefaultConfig() Config`

Returns the development configuration by value. Edit the copy and pass it to `WithConfig`. See [Configuration](/library/configuration).

The placeholder secrets are also exported as `DefaultEncryptionMasterKeyBase64`, `DefaultAdminOAuthSecret`, and `DefaultAppOAuthSecret`.

### `Config.Validate() error`

Returns an error for configuration that is unsafe in `staging` or `production`. `New` calls it. Messages name the Go field.

## Options

| Option                        | Effect                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| `WithConfig(cfg)`             | Uses `cfg` instead of `DefaultConfig()`                                    |
| `WithConfigFunc(fn)`          | Edits the resolved configuration; functions run in the order you pass them |
| `WithAddr(addr)`              | Sets `Config.App.Addr`                                                     |
| `WithLogger(logger)`          | Replaces the JSON logger with your own `*slog.Logger`                      |
| `WithProvider(code, factory)` | Registers one provider factory under `code`                                |
| `WithProviders(factories)`    | Registers several provider factories                                       |

A blank provider code or nil factory fails construction. If you register the same code twice, the last factory wins.

## Instance lifecycle

| Method             | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `Run() error`      | Serves until `SIGINT` or `SIGTERM`, then shuts down gracefully                                 |
| `Serve(ctx) error` | Starts provider runtimes, workers, and HTTP; stops when `ctx` is cancelled or the server exits |
| `Close() error`    | Stops the server and workers, then closes the database pool; safe to call repeatedly           |
| `Addr() string`    | Returns the configured address, or the bound address after serving on port `0`                 |

- An instance serves once. `Serve` after a previous serve or after `Close` returns an error.
- Cancelling the context is not returned as an error.
- `Close` waits for the server and workers to stop. It does not close a logger passed with `WithLogger`.

## Setup and migrations

| Method                                        | Description                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `Migrate(ctx) error`                          | Applies migrations; safe to call repeatedly                                |
| `SeedAdmin(ctx, email, password, name) error` | Creates a `super_admin`; fails with a uniqueness error if the email exists |

## Host integration

| Method        | Returns        | Use                                                                |
| ------------- | -------------- | ------------------------------------------------------------------ |
| `App()`       | `*fiber.App`   | Add Fiber routes or exercise the API in tests                      |
| `DB()`        | `*gorm.DB`     | Access the instance's database when no public API covers your need |
| `Logger()`    | `*slog.Logger` | Write logs through the instance's logger                           |
| `PublicDir()` | `string`       | The static directory served at `/`, or `""` when none is served    |

`App` is Fiber v3 on fasthttp, not a standard-library `http.Handler`. Do not close the handle returned by `DB`.

## Hooks

### `OnPaymentRequest() *hooks.Hook[hooks.PaymentRequestEvent]`

Blocking hook that runs before routing. Handlers run in registration order. The first error rejects the payment with `PAYMENT_REJECTED`. Idempotent replays skip the hook.

`PaymentRequestEvent` fields:

| Field           | Meaning                                |
| --------------- | -------------------------------------- |
| `AppID`         | Calling application ID                 |
| `ServiceType`   | `collection` or `disbursement`         |
| `PaymentMethod` | Requested payment method               |
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

Runs after a status change commits. Every handler runs even if one fails. Errors are logged and do not roll back the change.

`TransactionChangedEvent` includes the source (`request`, `webhook`, or `reconciliation`), application and transaction IDs, business reference, service, method, amount, currency, country, previous and new status, provider account ID, and provider reference. It excludes provider credentials, raw responses, webhook bodies, and customer account data.

### Bind and remove handlers

```go
unbind := instance.OnTransactionChanged().Bind(handler)
defer unbind()
```

- `Bind` panics on a nil handler.
- The returned function removes the handler and is safe to call more than once.
- Binding and removing are safe while hooks run. A handler removed mid-invocation may still finish that invocation.
