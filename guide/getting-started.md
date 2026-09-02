# Get started

Embed Momobase in a Go application and register the dummy provider for a local instance that moves no money.

## Install

```sh
go mod init example.com/payments
go get github.com/momobasehq/momobase@latest
```

## Create the host application

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
	)
	if err != nil {
		log.Fatal(err)
	}
	defer instance.Close()

	if err := instance.SeedAdmin(
		context.Background(),
		"admin@example.com",
		"replace-this-password",
		"Admin",
	); err != nil {
		log.Fatal(err)
	}

	if err := instance.Run(); err != nil {
		log.Fatal(err)
	}
}
```

`New` loads configuration from the environment, opens the database, runs migrations by default, and constructs the Fiber API. The application owns the process and must close every successfully created instance.

## Run

```sh
go run .
```

The API listens on `http://localhost:9090` and stores development data in `./data/momobase.db`. Use the Admin API to create an application, dummy provider account, and route before submitting payments.

Next, read how to [configure an embedding application](/guide/embedding), [build a provider](/guide/providers), or explore the [API reference](/api-reference).
