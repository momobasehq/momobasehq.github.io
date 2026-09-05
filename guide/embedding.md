# Embed Momobase as a Go package

Import the root module when Momobase should run inside a Go application with compiled providers, hooks, or additional Fiber routes.

## Create an instance

Add Momobase to your module:

```sh
go get github.com/momobasehq/momobase@latest
```

Then construct and run the instance:

```go
package main

import (
	"log"

	"github.com/momobasehq/momobase"
	"github.com/momobasehq/momobase/providers/dummy"
)

func main() {
	instance, err := momobase.New(
		momobase.WithProvider("dummy", dummy.New),
		momobase.WithAddr(":9090"),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer func() { _ = instance.Close() }()

	if err := instance.Run(); err != nil {
		log.Fatal(err)
	}
}
```

`New()` uses `momobase.DefaultConfig()` unless you provide `WithConfig()`. It opens the database and prepares the HTTP server, providers, and workers, so the caller must close the returned instance.

`New` does not start listeners or background workers. `Run` or `Serve` starts them after active provider accounts have been loaded.

## Configure the instance

Momobase reads no environment variables and no configuration files. `momobase.DefaultConfig()` returns a complete development baseline; copy it, change what your deployment needs, and hand it back with `WithConfig`:

```go
cfg := momobase.DefaultConfig()
cfg.App.Env = "production"
cfg.App.PublicURL = "https://payments.example.com"
cfg.App.CORSAllowedOrigins = []string{"https://checkout.example.com"}
cfg.Features.AutoMigrate = false

cfg.DB = momobase.DatabaseConfig{
	Type:     "postgres",
	Host:     "database.internal",
	Port:     "5432",
	User:     "momobase",
	Password: secrets.DatabasePassword,
	Name:     "momobase",
	SSLMode:  "require",
}

cfg.Security.EncryptionMasterKeyBase64 = secrets.EncryptionKey
cfg.Security.AdminOAuthSecret = secrets.AdminOAuthSecret
cfg.Security.AppOAuthSecret = secrets.AppOAuthSecret

instance, err := momobase.New(
	momobase.WithConfig(cfg),
	momobase.WithProvider("dummy", dummy.New),
)
```

Where those values come from is your application's decision: environment variables, a flag set, a configuration file, or a secret manager. Momobase never looks. See [reading configuration from the environment](/reference/configuration#read-configuration-from-the-environment) for that pattern written out.

Start from `DefaultConfig()` rather than building a `momobase.Config{}` literal. A struct you assemble field by field gets Go zero values, which means disabled workers, no migrations, and an empty database type.

The defaults carry placeholder secrets so a development instance starts unconfigured. `momobase.New` rejects them once `App.Env` is `staging` or `production`.

### Options

| Option                        | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `WithConfig(cfg)`             | Use a complete `momobase.Config` instead of `DefaultConfig()` |
| `WithConfigFunc(fn)`          | Modify the resolved configuration before startup              |
| `WithAddr(addr)`              | Override the HTTP listen address                              |
| `WithLogger(logger)`          | Use an application-owned `slog.Logger`                        |
| `WithProvider(code, factory)` | Register one compiled provider                                |
| `WithProviders(factories)`    | Register several compiled providers                           |

At least one provider is required. Provider codes become the values operators select when creating provider accounts.

`WithConfig` is resolved before configuration mutators run, so `WithAddr` and every `WithConfigFunc` apply after it regardless of argument order. Use them for a small override on top of an otherwise complete configuration:

```go
instance, err := momobase.New(
	momobase.WithConfig(cfg),
	momobase.WithAddr(":8080"),
	momobase.WithProvider("dummy", dummy.New),
)
```

See the [configuration reference](/reference/configuration) for every field and its default.

## Control the lifecycle

- `Run()` serves until `SIGINT` or `SIGTERM` and shuts down gracefully.
- `Serve(ctx)` serves until the context is cancelled or the server stops.
- `Close()` stops the server and workers and closes the database connection pool. It is safe to call more than once.
- `Addr()` returns the configured address, or the bound address after starting with port `0`.

Use `Migrate(ctx)` and `SeedAdmin(ctx, email, password, name)` when your host application owns setup tasks.

An instance can be served only once. Use a fresh instance for each test or restart. `SeedAdmin` is a one-time bootstrap operation rather than a startup hook; repeated calls with the same email fail.

## Extend the Fiber application

`App()` returns Momobase's `*fiber.App`. Add application-specific routes before serving it:

```go
import "github.com/gofiber/fiber/v3"

instance.App().Get("/ready", func(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
})
```

Register additional routes before calling `Run` or `Serve`. Avoid placing application routes under Momobase's `/api/v1`, `/api/admin`, or `/webhooks` prefixes.

Momobase uses Fiber and fasthttp, so `App()` is not a standard-library `http.Handler`. Keep a separate listener or add an adapter if the rest of your application uses `net/http`.

Use `DB()` and `Logger()` only when an extension needs the instance-owned database handle or structured logger. Prefer Momobase's public APIs for payment operations.

Do not close the value returned by `DB`; `instance.Close` owns the underlying connection pool. A logger supplied with `WithLogger` remains owned by the host.

## Add in-process behavior

Register typed hooks after construction and before serving:

```go
unbind := instance.OnTransactionChanged().Bind(handleTransactionChange)
defer unbind()
```

Request hooks can reject a payment before routing or persistence. Transaction-change hooks observe committed changes and are best-effort. See [Add payment hooks](/guide/extensions).
