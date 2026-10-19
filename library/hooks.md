# Hooks

Hooks run your Go code inside a Momobase instance. `OnPaymentRequest` can reject a new payment. `OnTransactionChanged` runs after every status change.

## What you need

- A Go program that [embeds an instance](/library/). Hooks are not available in the prebuilt server.

Bind hooks after `momobase.New` and before `Run`.

## Reject a payment

This rejects any payment above a limit, before it reaches a provider:

```go
// maxAmount is in currency minor units.
const maxAmount = 100_000

instance.OnPaymentRequest().Bind(func(_ context.Context, event hooks.PaymentRequestEvent) error {
	if event.Amount > maxAmount {
		return errors.New("payment exceeds the limit")
	}
	return nil
})
```

- It runs after validation and the idempotency check, before routing. Retries of an existing payment skip it.
- Handlers run in the order you bind them. The first error rejects the payment with `PAYMENT_REJECTED`. Your error text is logged, not returned to the caller.
- It runs while the caller waits, so keep it fast and honor the context.
- The event has the payment's `AppID`, `ServiceType`, `PaymentMethod`, `Amount`, `Currency`, `Country`, `Reference`, `Account`, `Scheme`, `Description`, `PartyName`, and `PartyEmail`. Keep account and customer data out of your logs.

## React to a status change

Momobase does not call your applications on its own. This hook posts every status change to your backend, signed so the backend can trust it:

```go
const (
	notifyURL    = "https://backend.example.com/payments"
	notifySecret = "a-long-random-secret"
)

instance.OnTransactionChanged().Bind(func(ctx context.Context, event hooks.TransactionChangedEvent) error {
	body, err := json.Marshal(map[string]any{
		"transaction_id": event.TransactionID,
		"reference":      event.Reference,
		"status":         event.Status,
	})
	if err != nil {
		return err
	}
	mac := hmac.New(sha256.New, []byte(notifySecret))
	mac.Write(body)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, notifyURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Signature", hex.EncodeToString(mac.Sum(nil)))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("notify: %s", resp.Status)
	}
	return nil
})
```

- It runs after the change is saved. Every handler runs; an error is logged and does not undo the change.
- Delivery is best effort: a change sent while your backend is down is lost. If every change must arrive, write it to an outbox table and deliver from there with retries, or have your backend [read the transaction](/guide/payments#wait-for-the-final-status) to catch up.
- `event.Source` says what caused the change: `request` (the first provider call), `webhook`, or `reconciliation` (Momobase asked the provider).
- The event also has `AppID`, `PreviousStatus`, `ServiceType`, `PaymentMethod`, `Amount`, `Currency`, `Country`, `ProviderAccountID`, and `ProviderReference`. It never contains customer account data or provider credentials.

## Remove a hook

`Bind` returns a function that removes the handler:

```go
unbind := instance.OnTransactionChanged().Bind(handler)
defer unbind()
```

Complete programs are in [`_examples`](https://github.com/momobasehq/momobase/tree/main/_examples).
