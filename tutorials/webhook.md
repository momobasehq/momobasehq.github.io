# Settle a pending payment with a webhook

Many providers accept a payment, then report the result later by calling a webhook. In this tutorial you make the `dummy` provider leave a payment pending, then play the provider and settle it with a signed webhook.

This takes about ten minutes and continues from [Set up payments in the dashboard](/tutorials/dashboard-setup). You need `curl` and `openssl`.

## 1. Make the provider leave payments pending

1. In the dashboard, select **Providers**, then **Configure** on **Tutorial simulator**.
2. On **Configuration**, enter the following and select **Replace configuration**:

    ```json
    { "webhook_secret": "tutorial-webhook-secret", "outcome": "pending" }
    ```

Open the account's page by selecting its name, and copy its **Account ID**.

## 2. Create a payment

On **Tutorial checkout**, open **Testing**, get a token, and select **Collect**. The response shows `"status": "pending"`. Copy its `transaction_id` and `provider_reference`.

```sh
export MOMOBASE_URL=http://localhost:9090
export WEBHOOK_SECRET=tutorial-webhook-secret
export PROVIDER_ID='paste-the-account-id'
export PROVIDER_REFERENCE='paste-the-provider-reference'
```

### Checkpoint

On **Transactions**, the payment is `pending`. Momobase is waiting for the provider. The reconciliation worker keeps asking the provider too, but this provider will never answer on its own.

## 3. Send the provider's webhook

Provider webhooks arrive at `/webhooks/{providerAccountID}`, so each account has its own URL to give its provider. Momobase checks two things before it accepts one:

- The `X-Webhook-Secret` header must equal the account's `webhook_secret`.
- The adapter checks the provider's own proof. The `dummy` adapter expects a hex HMAC-SHA256 of the raw body in `X-Momobase-Signature`.

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

The adapter translates the provider's `SUCCESSFUL` into Momobase's `succeeded`.

### Checkpoint

The response contains `"ok":true`, and on **Transactions** the payment is now `succeeded`.

## 4. Try what Momobase rejects

Send the same webhook again. It answers `ok` but changes nothing: Momobase deduplicates deliveries, because providers often retry.

Change one character of `SIGNATURE` and send it. The response is `400 WEBHOOK_ERROR`: the adapter refused the signature. A body whose amount, currency, country, or account disagrees with the stored transaction is refused the same way.

## 5. Restore the provider

Replace the configuration with `{ "webhook_secret": "tutorial-webhook-secret" }` so the other tutorials behave as written.

## Recap

A provider accepted a payment without settling it, and an authenticated, signed webhook finished it. Webhooks and reconciliation apply the same state rules, so whichever reports first wins and the other becomes a no-op.

## Next

- Read the [payment lifecycle](/guide/payment-lifecycle) for how uncertain payments resolve.
- Implement `VerifyWebhook` for a real provider in [Build a provider adapter](/library/providers).
