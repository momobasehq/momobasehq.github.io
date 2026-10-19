# Go package

<div style="display:flex;gap:1rem;">

[![Go reference](https://pkg.go.dev/badge/github.com/momobasehq/momobase.svg)](https://pkg.go.dev/github.com/momobasehq/momobase)

[![Latest release](https://img.shields.io/github/v/release/momobasehq/momobase?label=release)](https://github.com/momobasehq/momobase/releases/latest)

</div>

The Go package is the Momobase engine as a library. Embed it in your own Go program to add [payment hooks](/library/hooks), [your own provider adapter](/library/providers), or extra HTTP routes. It serves the same API as the server, but has no dashboard.

## What you need

- Go 1.25 or newer.

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
    	"context"
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

    	// Fails after the first run because the administrator already exists.
    	if err := instance.SeedAdmin(context.Background(), "admin@example.com", "local-password", "Admin"); err != nil {
    		log.Print(err)
    	}

    	if err := instance.Run(); err != nil {
    		log.Fatal(err)
    	}
    }
    ```

3. Run it:

    ```sh
    go run .
    ```

The API is now on `http://localhost:9090`. Without `WithConfig`, it uses the development defaults: SQLite in `./data` and placeholder secrets. See [Configuration](/guide/configuration).

## Register providers

Momobase registers no providers on its own. Add the [official providers](/guide/providers#included-providers) you need:

```sh
go get github.com/momobasehq/providers/mtn
```

```go
instance, err := momobase.New(
	momobase.WithProvider("mtn", mtn.New),
	momobase.WithProvider("airtel", airtel.New),
)
```

The code you register under is the provider code you choose when you create a provider account. An adapter only runs once an account uses it, so registering unused ones costs nothing.

## Options

| Option                        | Effect                                                   |
| ----------------------------- | -------------------------------------------------------- |
| `WithProvider(code, factory)` | Registers a provider adapter under `code`                |
| `WithProviders(factories)`    | Registers several provider adapters                      |
| `WithConfig(cfg)`             | Uses `cfg` instead of `DefaultConfig()`                  |
| `WithConfigFunc(fn)`          | Edits the configuration; runs in the order you pass them |
| `WithAddr(addr)`              | Sets the listen address                                  |
| `WithLogger(logger)`          | Replaces the JSON logger with your own `*slog.Logger`    |

## Instance methods

| Method                                  | What it does                                                        |
| --------------------------------------- | ------------------------------------------------------------------- |
| `Run()`                                 | Serves until `SIGINT` or `SIGTERM`, then shuts down gracefully      |
| `Serve(ctx)`                            | Serves until the context is cancelled                               |
| `Close()`                               | Stops serving and closes the database. Always call it               |
| `SeedAdmin(ctx, email, password, name)` | Creates an administrator with the `super_admin` role                |
| `Migrate(ctx)`                          | Applies database migrations, when `Features.AutoMigrate` is `false` |
| `App()`                                 | Returns the `*fiber.App`, to add routes                             |
| `Logger()`                              | Returns the instance's `*slog.Logger`                               |

An instance serves only once. Create a new one for each test or restart.

## Add HTTP routes

`App()` is a [Fiber v3](https://docs.gofiber.io/) app. Add routes before `Run`:

```go
instance.App().Get("/ready", func(c fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
})
```

Don't add routes under `/api/v1`, `/api/admin`, or `/webhooks`. Files in `mb_public` are served at `/` first; requests that match no file fall through to your routes.

## Deploy

Build and run your program like any Go service, and follow [Going to production](/guide/go-live), setting the `Config` fields instead of environment variables.

The full API is on [pkg.go.dev](https://pkg.go.dev/github.com/momobasehq/momobase).
