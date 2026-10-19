# Embed an instance

Run Momobase inside your own Go program. If you do not need custom provider adapters, hooks, or extra routes, use [the server](/server/) instead.

## What you need

- Go 1.25 or newer.
- A Go module for your program.

## Create an instance

1. Create a module and add Momobase:

    ```sh
    go mod init example.com/payments
    go get github.com/momobasehq/momobase@latest
    ```

2. Write `main.go`:

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

3. Run it:

    ```sh
    go run .
    ```

The API is now on `http://localhost:9090`. Create an administrator with [`SeedAdmin`](#control-the-lifecycle), then follow the [Quickstart](/guide/quickstart).

Keep in mind:

- Register at least one provider. Momobase registers none on its own. The code you register under (`"dummy"` above) is the `provider_code` used when creating a provider account.
- Without `WithConfig`, `New` uses `momobase.DefaultConfig()`: SQLite in `./data`, port `9090`, migrations applied, and placeholder secrets. That is for local development only. For anything else, see [Configuration](/library/configuration).
- Start from `DefaultConfig()`, not a `momobase.Config{}` literal. A literal has Go zero values: no database type, no migrations, no workers.
- `New` opens the database, so always `Close` the instance. Listeners and workers start only when you call `Run` or `Serve`.

## Control the lifecycle

| Method                                  | What it does                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `Run()`                                 | Serves until `SIGINT` or `SIGTERM`, then shuts down gracefully                  |
| `Serve(ctx)`                            | Serves until the context is cancelled or the server stops                       |
| `Close()`                               | Stops the server and workers and closes the database pool; safe to call again   |
| `Addr()`                                | Returns the configured address, or the bound address after starting with port 0 |
| `Migrate(ctx)`                          | Applies pending migrations                                                      |
| `SeedAdmin(ctx, email, password, name)` | Creates the first administrator; fails if the email already exists              |

An instance serves only once. Create a new one for each test or restart. Allow at least 10 seconds of termination grace for HTTP shutdown.

```go
if err := instance.SeedAdmin(context.Background(), "you@example.com", "change me", "You"); err != nil {
	log.Fatal(err)
}
```

## Deploy your program

Follow [Deploy the server](/server/deployment) and the [Go live](/guide/go-live) checklist. The same rules apply; set them in `Config` instead of environment variables:

| Rule                             | Server variable         | `Config` field                     |
| -------------------------------- | ----------------------- | ---------------------------------- |
| Migrate deliberately             | `AUTO_MIGRATE=false`    | `cfg.Features.AutoMigrate = false` |
| Run workers on one replica only  | `WORKERS_ENABLED=false` | `cfg.Workers.Enabled = false`      |
| Turn on production safety checks | `APP_ENV=production`    | `cfg.App.Env = "production"`       |

With `AutoMigrate` off, `New` logs pending migrations instead of applying them. Call `instance.Migrate(ctx)` from one process before serving traffic.

## Extend the Fiber application

`App()` returns Momobase's `*fiber.App`. Add routes before calling `Run` or `Serve`:

```go
import "github.com/gofiber/fiber/v3"

instance.App().Get("/ready", func(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
})
```

- Do not register routes under `/api/v1`, `/api/admin`, or `/webhooks`.
- `/` serves static files from [`App.PublicDir`](/library/configuration#application) (`mb_public` by default) when that directory exists. A request that matches no file falls through to your routes. `instance.PublicDir()` returns `""` when no directory is served:

    ```go
    if instance.PublicDir() == "" {
    	instance.App().Get("/", func(c fiber.Ctx) error {
    		return c.Redirect().To("/console/")
    	})
    }
    ```

- `App()` is Fiber v3 on fasthttp, not a standard-library `http.Handler`. Use a separate listener or an adapter if the rest of your program uses `net/http`.
- `DB()` returns the instance's `*gorm.DB` and `Logger()` its `*slog.Logger`. Do not close the database handle; `instance.Close` owns it. A logger you pass with `WithLogger` stays yours to close.

## Next

- [Add hooks](/library/hooks) to reject or observe payments.
- [Build a provider adapter](/library/providers) for a real payment rail.
- Look up every symbol in the [Go API reference](/library/go-api).
