# Notify your backend of payment changes

Build a Go program that embeds Momobase and posts every transaction status change to your backend, signed so the backend can trust it.

Momobase does not call applications on its own; this hook adds that.

## What you need

- Go 1.25 or newer and Node.js 24.
- `curl` and `jq`, for the [Quickstart](/guide/quickstart) steps you run against this program.
- About fifteen minutes.

## 1. Write a receiver

The receiver stands in for your backend and rejects requests without a valid signature. Create `receiver.mjs` anywhere:

```js
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const secret = "tutorial-notify-secret";

createServer(async (req, res) => {
	let body = "";
	for await (const chunk of req) body += chunk;
	const expected = createHmac("sha256", secret).update(body).digest("hex");
	const given = String(req.headers["x-signature"] ?? "");
	if (
		given.length !== expected.length ||
		!timingSafeEqual(Buffer.from(given), Buffer.from(expected))
	) {
		res.writeHead(401).end();
		return;
	}
	console.log(JSON.parse(body));
	res.writeHead(204).end();
}).listen(4000, () => console.log("Listening on :4000"));
```

```sh
node receiver.mjs
```

## 2. Create the Momobase program

In another terminal:

```sh
mkdir notify && cd notify
go mod init example.com/notify
go get github.com/momobasehq/momobase@latest
```

Create `main.go`:

```go
package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/momobasehq/momobase"
	"github.com/momobasehq/momobase/hooks"
	"github.com/momobasehq/momobase/providers/dummy"
)

const (
	notifyURL    = "http://localhost:4000/"
	notifySecret = "tutorial-notify-secret"
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

	instance.OnTransactionChanged().Bind(func(ctx context.Context, event hooks.TransactionChangedEvent) error {
		return notify(ctx, event)
	})

	if err := instance.Run(); err != nil {
		log.Fatal(err)
	}
}

// notify posts a signed summary of the change. A failed post is logged, not retried.
func notify(ctx context.Context, event hooks.TransactionChangedEvent) error {
	body, err := json.Marshal(map[string]any{
		"transaction_id":  event.TransactionID,
		"reference":       event.Reference,
		"previous_status": event.PreviousStatus,
		"status":          event.Status,
		"source":          event.Source,
	})
	if err != nil {
		return err
	}
	mac := hmac.New(sha256.New, []byte(notifySecret))
	mac.Write(body)

	// Hooks run in the payment path, so bound the call.
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
		return fmt.Errorf("notify: receiver answered %s", resp.Status)
	}
	return nil
}
```

`OnTransactionChanged` runs after a status change is committed. If it returns an error, Momobase logs it and keeps the change.

## 3. Run it and take a payment

```sh
go run .
```

In a third terminal, run the [Quickstart](/guide/quickstart) steps that create the application, provider account, and route, then make its payment. Skip starting the server and creating the administrator: this program does both, with `admin@example.com` and `local-password`.

When the collection is created, the receiver prints the change with `status` `succeeded` and `source` `request`. Later changes from a webhook or reconciliation arrive the same way, with `source` set to `webhook` or `reconciliation`.

## 4. Stop the receiver

Stop the receiver and create another collection with a new `Idempotency-Key` and `reference`. The payment still succeeds, and the Momobase log records the failed notification.

Notifications sent while your backend is down are lost. If every change must arrive, write it to an outbox table in the hook and deliver from there with retries, or have your backend read `GET /api/v1/transactions/{id}` to catch up.

## Next

- [Add payment hooks](/library/hooks) lists every event field.
- [Reject large payments with a hook](/tutorials/payment-limit) uses the hook that runs before routing.
