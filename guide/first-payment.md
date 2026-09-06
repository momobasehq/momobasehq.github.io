# Create your first payment

This tutorial provisions the minimum routing data on a running instance and creates a collection through the deterministic `dummy` provider. It moves no money.

## Before you begin

You need a Momobase instance on `http://localhost:9090` with an administrator already seeded. Either path gets you there:

- [Install the server](/server/install) — one `docker run`, then `seed-admin`.
- [Embed the library](/library/embedding) — write `main()`, then call `SeedAdmin`.

You also need `curl` and `jq`.

The examples below assume the administrator is `admin@example.com` with the password `local-password`. Substitute what you actually seeded.

```sh
export MOMOBASE_URL=http://localhost:9090
```

## Authenticate as the administrator

```sh
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

- Learn how the [payment lifecycle](/guide/payment-lifecycle) handles uncertain outcomes, and how [routing](/guide/routing) picked this provider account.
- Do the same thing in TypeScript with the [SDK](/sdk/).
- Replace the dummy adapter by [building a provider adapter](/library/providers).
- [Configure](/server/configuration) and [deploy](/server/deployment) the server before leaving development mode.
