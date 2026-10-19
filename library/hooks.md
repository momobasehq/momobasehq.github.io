# Add payment hooks

Hooks run your Go code inside a Momobase instance. Use `OnPaymentRequest` to reject a new payment and `OnTransactionChanged` to react to a committed status change.

## What you need

- A Go program that [embeds an instance](/library/embedding). Hooks are not available in the prebuilt server.

## Register hooks

Bind hooks after `momobase.New()` and before `Run()` or `Serve()`:

```go
package extension

import (
	"context"
	"errors"
	"log/slog"

	"github.com/momobasehq/momobase"
	"github.com/momobasehq/momobase/hooks"
)

func Register(instance *momobase.Instance, appID string, maxAmount int64) {
	instance.OnPaymentRequest().Bind(func(_ context.Context, event hooks.PaymentRequestEvent) error {
		if event.AppID == appID && event.Amount > maxAmount {
			return errors.New("payment exceeds the application limit")
		}
		return nil
	})

	instance.OnTransactionChanged().Bind(func(ctx context.Context, event hooks.TransactionChangedEvent) error {
		if event.AppID != appID {
			return nil
		}
		instance.Logger().InfoContext(ctx, "transaction changed",
			slog.String("transaction_id", event.TransactionID),
			slog.String("status", event.Status),
			slog.String("source", event.Source),
		)
		return nil
	})
}
```

The complete program is in [`_examples/extension`](https://github.com/momobasehq/momobase/tree/main/_examples/extension).

## Reject a payment request

`OnPaymentRequest` runs after validation and idempotency checks, before routing and before anything is stored.

- Handlers run in registration order. The first error stops the chain.
- The caller receives `PAYMENT_REJECTED`. Your error text is logged, not returned.
- It runs in the request path: honor the context and avoid slow network calls.
- Changing the event does not change the payment request.
- The event contains account and customer data. Do not copy it into logs or errors.

## Observe a transaction change

`OnTransactionChanged` runs after a status change commits.

- Every handler runs, even if one returns an error. Errors are logged and the change is not rolled back.
- Delivery is best effort. If another system must receive every change, use a transactional outbox instead.
- The event excludes customer account data, provider credentials, raw responses, and webhook bodies.

`event.Source` tells you what caused the change:

| Value            | Meaning                                         |
| ---------------- | ----------------------------------------------- |
| `request`        | The initial provider call produced the status   |
| `webhook`        | A verified provider callback changed the status |
| `reconciliation` | A provider status query changed the status      |

For all event fields and binding rules, see [the Go API reference](/library/go-api#hooks).

## Next

- Try the tutorials [Reject large payments](/tutorials/payment-limit) and [Notify your backend](/tutorials/notify-backend).
