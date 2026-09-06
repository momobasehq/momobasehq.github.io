# Embed an instance

Import the root module when Momobase should run inside a Go program with compiled providers, hooks, or additional Fiber routes. If you do not need any of those, [the server](/server/) already is this program.

## Create an instance

```sh
go mod init example.com/payments
go get github.com/momobasehq/momobase@latest
```

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

`New` opens the database and prepares the HTTP server, providers, and workers, so the caller must close the returned instance. It does not start listeners or background workers — `Run` or `Serve` does that, after active provider accounts have been loaded.

At least one provider is required; Momobase registers none automatically. Provider codes become the values operators select when creating provider accounts.

Without `WithConfig`, `New` uses `momobase.DefaultConfig()`: SQLite in `./data`, port 9090, migrations applied, and placeholder secrets. That is enough to [create your first payment](/guide/first-payment) and nothing more — see [Configure the library](/library/configuration) for every field, and start from `DefaultConfig()` rather than a `momobase.Config{}` literal, which gets Go zero values and therefore no workers, no migrations, and no database type.

## Control the lifecycle

- `Run()` serves until `SIGINT` or `SIGTERM` and shuts down gracefully.
- `Serve(ctx)` serves until the context is cancelled or the server stops.
- `Close()` stops the server and workers and closes the database connection pool. Safe to call more than once.
- `Addr()` returns the configured address, or the bound address after starting with port `0`.

An instance can be served only once. Construct a fresh one for each test or restart, and allow enough termination grace for the 10-second HTTP shutdown window.

Use `Migrate(ctx)` and `SeedAdmin(ctx, email, password, name)` when the host owns setup tasks. `SeedAdmin` is a one-time bootstrap rather than a startup hook: a repeated call with the same email fails.

```go
if err := instance.Migrate(context.Background()); err != nil {
	log.Fatal(err)
}
```

## Deploy the host

The host owns the executable, container image, process manager, and deployment topology. The operational policy does not change with the host, so [Deploy the server](/server/deployment) applies here too — a shared database for multiple replicas, TLS terminated in front, deliberate migrations, and workers enabled on exactly one replica.

What differs is only how you express it:

| Policy                       | In the server           | Here                               |
| ---------------------------- | ----------------------- | ---------------------------------- |
| Migrate deliberately         | `AUTO_MIGRATE=false`    | `cfg.Features.AutoMigrate = false` |
| One worker owner per cluster | `WORKERS_ENABLED=false` | `cfg.Workers.Enabled = false`      |
| Production safety checks     | `APP_ENV=production`    | `cfg.App.Env = "production"`       |

With `AutoMigrate` disabled, `New` logs any pending migrations by name rather than applying them. Run `instance.Migrate(ctx)` from a single process before serving traffic.

## Extend the Fiber application

`App()` returns Momobase's `*fiber.App`. Add application routes before serving it:

```go
import "github.com/gofiber/fiber/v3"

instance.App().Get("/ready", func(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
})
```

Register routes before calling `Run` or `Serve`, and keep them out of the `/api/v1`, `/api/admin`, and `/webhooks` prefixes.

Momobase uses Fiber and fasthttp, so `App()` is not a standard-library `http.Handler`. Keep a separate listener or add an adapter if the rest of your application uses `net/http`.

Use `DB()` and `Logger()` only when an extension needs the instance-owned database handle or structured logger; prefer the public APIs for payment operations. Do not close the value returned by `DB` — `instance.Close` owns that pool. A logger supplied with `WithLogger` stays owned by the host.

## Next

- [Add hooks](/library/hooks) to reject a payment before routing or observe committed changes.
- [Build a provider adapter](/library/providers) for a real payment rail.
- Look up every symbol in the [Go API reference](/library/go-api).
