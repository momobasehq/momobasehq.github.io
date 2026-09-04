# Create your first payment

This tutorial runs Momobase locally with its deterministic dummy provider, provisions the minimum routing data, and creates a collection. The dummy provider moves no money.

## Before you begin

Install:

- the Go version declared by Momobase's `go.mod`;
- `curl`; and
- `jq` for extracting values from API responses.

Use a new directory so the tutorial's SQLite database and Go module remain isolated.

Set local signing secrets. These values are only for the disposable development instance created by this tutorial:

```sh
export ADMIN_OAUTH_SECRET=local-admin-oauth-secret-at-least-32-characters
export APP_OAUTH_SECRET=local-application-oauth-secret-at-least-32-characters
```

## Create the host application

```sh
mkdir momobase-quickstart
cd momobase-quickstart
go mod init example.com/momobase-quickstart
go get github.com/momobasehq/momobase@latest
```

Create `main.go`:

```go
package main

import (
	"context"
	"log"
	"os"

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
	defer func() { _ = instance.Close() }()

	if len(os.Args) == 2 && os.Args[1] == "seed-admin" {
		err := instance.SeedAdmin(
			context.Background(),
			"admin@example.com",
			"local-password",
			"Local Admin",
		)
		if err != nil {
			log.Fatal(err)
		}
		return
	}

	if err := instance.Run(); err != nil {
		log.Fatal(err)
	}
}
```

`momobase.New` loads environment configuration and development defaults, creates `./data/momobase.db`, applies migrations, and prepares the API. The host registers the dummy adapter because Momobase does not register providers automatically.

## Create the first administrator

Run the one-time setup path:

```sh
go run . seed-admin
```

Start the server and leave it running:

```sh
go run .
```

The API is now available at `http://localhost:9090`. Open another terminal in the same directory for the remaining commands.

## Authenticate as the administrator

```sh
export MOMOBASE_URL=http://localhost:9090

export ADMIN_TOKEN="$(
	curl --fail --silent --show-error \
		--data-urlencode 'grant_type=password' \
		--data-urlencode 'username=admin@example.com' \
		--data-urlencode 'password=local-password' \
		"$MOMOBASE_URL/api/admin/token" |
		jq -er '.access_token'
)"
```

Administrator token responses are OAuth token objects and are not wrapped in the usual Momobase response envelope.

## Create an application

The application currency must match every payment it submits.

```sh
export APP_ID="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{"name":"Tutorial checkout","environment":"sandbox","currency":"UGX"}' \
		"$MOMOBASE_URL/api/admin/apps" |
		jq -er '.data.id'
)"
```

Create a credential with permission to create and read collections:

```sh
export CREDENTIAL="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{"name":"Tutorial backend","scopes":"collections:create transactions:read"}' \
		"$MOMOBASE_URL/api/admin/apps/$APP_ID/credentials"
)"

export CLIENT_ID="$(printf '%s' "$CREDENTIAL" | jq -er '.data.credential.client_id')"
export CLIENT_SECRET="$(printf '%s' "$CREDENTIAL" | jq -er '.data.client_secret')"
```

The client secret is returned only at creation or rotation. A real deployment should put it in a secret manager immediately.

## Configure the dummy provider

Create a provider account for Uganda shillings. `webhook_secret` is required even when this tutorial does not send a webhook.

```sh
export PROVIDER_ID="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{
			"provider_code":"dummy",
			"name":"Tutorial simulator",
			"environment":"sandbox",
			"country":"UG",
			"currency":"UGX",
			"config":{"webhook_secret":"tutorial-webhook-secret"}
		}' \
		"$MOMOBASE_URL/api/admin/providers/accounts" |
		jq -er '.data.id'
)"

curl --fail --silent --show-error \
	-X POST \
	-H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/providers/accounts/$PROVIDER_ID/test" |
	jq

curl --fail --silent --show-error \
	-X PATCH \
	-H "Authorization: Bearer $ADMIN_TOKEN" \
	"$MOMOBASE_URL/api/admin/providers/accounts/$PROVIDER_ID/activate" |
	jq
```

Testing initializes a temporary adapter and checks its health. Activation loads the account into the running provider registry.

## Create a route

```sh
curl --fail --silent --show-error \
	-X POST \
	-H "Authorization: Bearer $ADMIN_TOKEN" \
	-H 'Content-Type: application/json' \
	-d "{
		\"service_type\":\"collection\",
		\"payment_method\":\"momo\",
		\"provider_account_id\":\"$PROVIDER_ID\",
		\"priority\":100,
		\"active\":true
	}" \
	"$MOMOBASE_URL/api/admin/routes" |
	jq
```

This route can serve `collection` requests using `momo` when the request country and currency match the provider account.

## Authenticate the application

```sh
export APP_TOKEN="$(
	curl --fail --silent --show-error \
		--data-urlencode 'grant_type=client_credentials' \
		--data-urlencode "client_id=$CLIENT_ID" \
		--data-urlencode "client_secret=$CLIENT_SECRET" \
		"$MOMOBASE_URL/api/v1/token" |
		jq -er '.access_token'
)"
```

Confirm that the route is currently available:

```sh
curl --fail --silent --show-error \
	-H "Authorization: Bearer $APP_TOKEN" \
	"$MOMOBASE_URL/api/v1/payment-methods?service_type=collection&country=UG" |
	jq
```

The result should include `collection` and `momo`.

## Create a collection

```sh
export PAYMENT="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $APP_TOKEN" \
		-H 'Content-Type: application/json' \
		-H 'Idempotency-Key: tutorial-order-1' \
		-d '{
			"payment_method":"momo",
			"account":"256770000000",
			"amount":50000,
			"currency":"UGX",
			"country":"UG",
			"reference":"TUTORIAL-ORDER-1",
			"description":"First Momobase payment",
			"customer":{"name":"Ada Lovelace","email":"ada@example.com"}
		}' \
		"$MOMOBASE_URL/api/v1/collections"
)"

printf '%s' "$PAYMENT" | jq
export TRANSACTION_ID="$(printf '%s' "$PAYMENT" | jq -er '.data.transaction_id')"
```

The dummy provider defaults to an immediate successful outcome, so `.data.status` should be `succeeded`.

Read the stored transaction:

```sh
curl --fail --silent --show-error \
	-H "Authorization: Bearer $APP_TOKEN" \
	"$MOMOBASE_URL/api/v1/transactions/$TRANSACTION_ID" |
	jq
```

You now have a working Momobase host, administrator, application credential, provider account, route, and payment transaction.

## Continue

- [Embed Momobase](/guide/embedding) with explicit configuration and application routes.
- Learn how the [payment lifecycle](/guide/payment-lifecycle) handles uncertain outcomes.
- Replace the dummy adapter by [building a provider adapter](/guide/providers).
- Review the [deployment guide](/guide/deployment) before leaving development mode.
