# Quickstart

Run Momobase locally and make a test payment through the built-in `dummy` provider. No money moves.

## What you need

- Docker
- `curl` and `jq`
- About 10 minutes

Using the Go package instead of the server? [Embed an instance](/library/embedding), create an administrator with `SeedAdmin`, then start at [step 3](#_3-get-an-administrator-token).

## 1. Start the server

```sh
docker run -d --name momobase -p 9090:9090 -v momobase-data:/data ghcr.io/momobasehq/server:latest
```

Check that it is up:

```sh
curl http://localhost:9090/healthz
```

You should see `{"success":true,"data":{"ok":true}}`.

## 2. Create an administrator

```sh
docker exec momobase momobase seed-admin --email admin@example.com --password local-password
```

The dashboard is now at `http://localhost:9090/_/`. The rest of this page uses the API. To do steps 4–6 in the dashboard instead, follow [Set up payments in the dashboard](/tutorials/dashboard-setup).

## 3. Get an administrator token

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

## 4. Create an application and a credential

An application accepts payments in one currency.

```sh
export APP_ID="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{"name":"Quickstart checkout","environment":"sandbox","currency":"UGX"}' \
		"$MOMOBASE_URL/api/admin/apps" |
		jq -er '.data.id'
)"

export CREDENTIAL="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{"name":"Quickstart backend","scopes":"collections:create transactions:read"}' \
		"$MOMOBASE_URL/api/admin/apps/$APP_ID/credentials"
)"

export CLIENT_ID="$(printf '%s' "$CREDENTIAL" | jq -er '.data.credential.client_id')"
export CLIENT_SECRET="$(printf '%s' "$CREDENTIAL" | jq -er '.data.client_secret')"
```

The client secret is shown only once. In a real deployment, store it in a secret manager.

## 5. Add a provider account

Create a `dummy` provider account for Uganda, then test and activate it. Every provider account needs a `webhook_secret`.

```sh
export PROVIDER_ID="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $ADMIN_TOKEN" \
		-H 'Content-Type: application/json' \
		-d '{
			"provider_code":"dummy",
			"name":"Quickstart simulator",
			"environment":"sandbox",
			"country":"UG",
			"currency":"UGX",
			"config":{"webhook_secret":"quickstart-webhook-secret"}
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

## 6. Add a route

A route sends one kind of payment to a provider account. This one sends mobile money (`momo`) collections to the account from step 5.

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

## 7. Make a payment

Get an application token with the credential from step 4:

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

Create a collection. Every payment needs an `Idempotency-Key` header.

```sh
export PAYMENT="$(
	curl --fail --silent --show-error \
		-X POST \
		-H "Authorization: Bearer $APP_TOKEN" \
		-H 'Content-Type: application/json' \
		-H 'Idempotency-Key: quickstart-order-1' \
		-d '{
			"payment_method":"momo",
			"account":"256770000000",
			"amount":50000,
			"currency":"UGX",
			"country":"UG",
			"reference":"QUICKSTART-ORDER-1",
			"description":"First Momobase payment",
			"customer":{"name":"Ada Lovelace","email":"ada@example.com"}
		}' \
		"$MOMOBASE_URL/api/v1/collections"
)"

printf '%s' "$PAYMENT" | jq
export TRANSACTION_ID="$(printf '%s' "$PAYMENT" | jq -er '.data.transaction_id')"
```

`.data.status` is `succeeded`, because the `dummy` provider succeeds immediately by default.

## 8. Read the transaction

```sh
curl --fail --silent --show-error \
	-H "Authorization: Bearer $APP_TOKEN" \
	"$MOMOBASE_URL/api/v1/transactions/$TRANSACTION_ID" |
	jq
```

You now have an administrator, an application with a credential, a provider account, a route, and a completed transaction.

## Next

- Call Momobase from your code with an [SDK](/sdk/).
- Work through the [tutorials](/tutorials/): the dashboard, webhooks, and hooks.
- Add a real provider account: the server includes [official providers](/server/#included-providers) for MTN, Airtel, Yo! Payments, MarzPay, and Flutterwave.
- Before handling real money, complete the [Go live](/guide/go-live) checklist.
