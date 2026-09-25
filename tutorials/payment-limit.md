# Reject large payments with a hook

Hooks run your own Go code inside Momobase. In this tutorial you build a small Momobase program that rejects any payment above a limit before it reaches a provider.

This takes about ten minutes. You need Go and the command-line steps in [Create your first payment](/guide/first-payment), which you run against the program you build here. The dashboard is part of Momobase Server, so it is not available in a program of your own.

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

The hook is bound after `New` and before `Run`, so it sees the first request.

## 2. Run it and provision routing

```sh
go run .
```

In another terminal, follow [Create your first payment](/guide/first-payment) from the start. It creates an application, a provider account, and a route in this program's database.

### Checkpoint

The tutorial's 50,000 UGX collection returns `succeeded`. That amount is under the limit, so the hook returned `nil`.

## 3. Send a payment over the limit

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

### Checkpoint

The response is HTTP `400` with the code `PAYMENT_REJECTED`. The message is generic: Momobase logs your hook's error text but never returns it to the caller.

The hook runs before routing and persistence, so no transaction exists and no provider was called.

## Recap

You compiled Momobase into your own program and added a policy the API does not have. `OnPaymentRequest` rejects payments; its sibling `OnTransactionChanged` observes committed status changes.

## Next

- Read [Add payment hooks](/library/hooks) for ordering, sensitive fields, and observers.
- See every option for the program in [Configure the library](/library/configuration).
