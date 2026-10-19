# Settle a pending payment with a webhook

Make the `dummy` provider leave a payment pending, then settle it by sending a signed provider webhook yourself.

## What you need

- The setup from [Set up payments in the dashboard](/tutorials/dashboard-setup).
- `curl` and `openssl`.
- About ten minutes.

## 1. Make the provider leave payments pending

1. In the dashboard, select **Providers**, then **Configure** on **Tutorial simulator**.
2. On **Configuration**, enter the following and select **Replace configuration**:

    ```json
    { "webhook_secret": "tutorial-webhook-secret", "outcome": "pending" }
    ```

3. Select the account's name and copy its **Account ID**.

## 2. Create a payment

On **Tutorial checkout**, open **Testing**, get a token, and select **Collect**. The response shows `"status": "pending"`. Copy its `provider_reference`.

```sh
export MOMOBASE_URL=http://localhost:9090
export WEBHOOK_SECRET=tutorial-webhook-secret
export PROVIDER_ID='paste-the-account-id'
export PROVIDER_REFERENCE='paste-the-provider-reference'
```

On **Transactions**, the payment is `pending`.

## 3. Send the provider's webhook

Each provider account receives webhooks at `/webhooks/{providerAccountID}`. A webhook needs:

- An `X-Webhook-Secret` header equal to the account's `webhook_secret`.
- The provider's own signature. For `dummy`, that is a hex HMAC-SHA256 of the raw body in `X-Momobase-Signature`.

```sh
BODY="{\"reference\":\"$PROVIDER_REFERENCE\",\"status\":\"SUCCESSFUL\"}"
SIGNATURE="$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')"

curl --fail-with-body --silent --show-error \
	-X POST \
	-H 'Content-Type: application/json' \
	-H "X-Webhook-Secret: $WEBHOOK_SECRET" \
	-H "X-Momobase-Signature: $SIGNATURE" \
	-d "$BODY" \
	"$MOMOBASE_URL/webhooks/$PROVIDER_ID"
```

The response contains `"ok":true`. On **Transactions**, the payment is now `succeeded`.

## 4. Try what Momobase rejects

- Send the same webhook again. It returns `ok` and changes nothing: duplicate deliveries are ignored.
- Change one character of `SIGNATURE` and send it. The response is `400 WEBHOOK_ERROR`.

A webhook whose amount, currency, country, or account does not match the stored transaction is also rejected.

## 5. Restore the provider

Replace the configuration with `{ "webhook_secret": "tutorial-webhook-secret" }` so the other tutorials work as written.

## Next

- [Webhook authentication](/api/conventions#webhook-authentication) in the HTTP conventions.
- Implement `VerifyWebhook` for a real provider in [Build a provider adapter](/library/providers).
