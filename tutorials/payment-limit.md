# Reject large payments with a hook

Build a Go program that embeds Momobase and rejects any payment above a limit before it reaches a provider.

## What you need

- Go 1.25 or newer.
- `curl` and `jq`, for the [Quickstart](/guide/quickstart) steps you run against this program.
- About ten minutes.

The dashboard is part of Momobase Server only, so this tutorial uses the API.

## 1. Create the program

```sh
mkdir payment-limit && cd payment-limit
go mod init example.com/payment-limit
go get github.com/momobasehq/momobase@latest
```

Create `main.go`:

```go
package main

import (
	"context"
	"errors"
	"log"

	"github.com/momobasehq/momobase"
	"github.com/momobasehq/momobase/hooks"
	"github.com/momobasehq/momobase/providers/dummy"
)

// maxAmount is in currency minor units.
const maxAmount = 100_000

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

	instance.OnPaymentRequest().Bind(func(_ context.Context, event hooks.PaymentRequestEvent) error {
		if event.Amount > maxAmount {
			return errors.New("payment exceeds the limit")
		}
		return nil
	})

	if err := instance.Run(); err != nil {
		log.Fatal(err)
	}
}
```

Bind hooks after `New` and before `Run`.

## 2. Run it and set up routing

```sh
go run .
```

In another terminal, run the [Quickstart](/guide/quickstart) steps that create the application, provider account, and route, then make its payment. Skip starting the server and creating the administrator: this program does both, with `admin@example.com` and `local-password`.

The Quickstart's 50,000 UGX collection returns `succeeded`, because it is under the limit.

## 3. Send a payment over the limit

In the same terminal, so `$APP_TOKEN` and `$MOMOBASE_URL` are still set:

```sh
curl --silent --show-error \
	-X POST \
	-H "Authorization: Bearer $APP_TOKEN" \
	-H 'Content-Type: application/json' \
	-H 'Idempotency-Key: tutorial-limit-1' \
	-d '{
		"payment_method":"momo",
		"account":"256770000000",
		"amount":250000,
		"currency":"UGX",
		"country":"UG",
		"reference":"TUTORIAL-LIMIT-1"
	}' \
	"$MOMOBASE_URL/api/v1/collections" |
	jq
```

The response is HTTP `400` with the code `PAYMENT_REJECTED`. Momobase logs your hook's error text but does not return it to the caller. No transaction is created and no provider is called.

## Next

- [Add payment hooks](/library/hooks), including `OnTransactionChanged` for observing status changes.
- [Configure the library](/library/configuration).
