# Providers and routing

A **provider account** holds your credentials for one payment provider, in one country and currency. A **route** decides which provider account takes each payment.

## Included providers

Momobase Server includes these provider adapters. In the [Go package](/library/#register-providers), you register the ones you need.

| Code          | Provider     | Collections        | Disbursements | Verified webhooks | Configuration keys                                                                       |
| ------------- | ------------ | ------------------ | ------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `dummy`       | Simulator    | Simulated          | Simulated     | No                | `webhook_secret` only                                                                    |
| `mtn`         | MTN MoMo     | Mobile money       | Mobile money  | No                | [`mtn`](https://github.com/momobasehq/providers/blob/main/mtn/README.md)                 |
| `airtel`      | Airtel Money | Mobile money       | Mobile money  | No                | [`airtel`](https://github.com/momobasehq/providers/blob/main/airtel/README.md)           |
| `yopayments`  | Yo! Payments | Mobile money       | Mobile money  | No                | [`yopayments`](https://github.com/momobasehq/providers/blob/main/yopayments/README.md)   |
| `marzpay`     | MarzPay      | Mobile money, card | Mobile money  | Yes               | [`marzpay`](https://github.com/momobasehq/providers/blob/main/marzpay/README.md)         |
| `flutterwave` | Flutterwave  | Mobile money       | Mobile money  | Yes               | [`flutterwave`](https://github.com/momobasehq/providers/blob/main/flutterwave/README.md) |

Each README lists the configuration keys with an example. Some settings change what an account can do:

- **MTN** offers only the services whose credentials are complete. Set `collection_*` or `disbursement_*` keys per service, or the shared `subscription_key`, `api_user`, and `api_key` for both. It has no live default `base_url`, so outside sandbox set `base_url` and `target_environment`.
- **Airtel** disbursements need `pin` or `encrypted_pin`.
- **MarzPay** needs `webhook_signing_secret` whenever `callback_url` is set. It has no sandbox and always calls the live API.

::: warning Under testing
Most adapters have not yet run against a real merchant account in every market. Start in each provider's sandbox, and report what you find using [TESTING.md](https://github.com/momobasehq/providers/blob/main/TESTING.md).
:::

Need a provider that isn't listed? [Build a provider adapter](/library/providers).

## Add a provider account

1. Get API credentials from the provider, starting with its sandbox.
2. In the dashboard, select **Providers**, then **New account**. Choose the provider code, environment, country, and currency.
3. In **Configuration (JSON)**, enter the provider's keys and a long random `webhook_secret`. Every account needs one.
4. Select **Create**, then **Test**. When the test passes, select **Activate**.

The configuration is stored encrypted. Saving it replaces the whole JSON, so always include `webhook_secret`. The account's environment decides whether the adapter uses the provider's sandbox or live URL, unless you set `base_url`.

::: warning A broken provider account stops start-up
Momobase loads every active provider account when it starts. If one fails to load, because its configuration is rejected or the provider is unreachable, Momobase does not start. Always test an account before you activate it.
:::

## Receive provider webhooks

Providers report payment results to Momobase with webhooks. In the provider's portal, set the callback URL to:

```text
<APP_PUBLIC_URL>/webhooks/<provider-account-id>
```

Each webhook must carry an `X-Webhook-Secret` header equal to the account's `webhook_secret`, or Momobase rejects it. For providers with verified webhooks, Momobase also checks the provider's own signature. Duplicate webhooks are ignored, and a webhook whose amount, currency, country, or account doesn't match the payment is rejected.

Without webhooks, Momobase still finishes payments by asking the provider, just more slowly.

## Route payments

A route sends one **service** (collection or disbursement) and **payment method** to a provider account, at a **priority**. Lower numbers are tried first.

1. Select **Routes**, then **New route**.
2. Choose the service, provider account, and payment method.
3. Set the priority and select **Create**.

For each payment, Momobase tries routes in priority order and uses the first one whose provider account:

- is active and matches the payment's country and currency;
- supports the service and payment method; and
- is healthy.

## Add a backup provider

Create a second provider account and a route for the same service and payment method with a higher priority number, such as `2`. Momobase uses it whenever the first account is inactive or unhealthy.

An account is skipped as unhealthy after three provider calls in a row fail (for 30 seconds), or after three failed health checks (until a check succeeds). Invalid customer data doesn't count as a failure.

Fallback happens only when Momobase picks a route. Once a payment is sent to a provider, it is never resent to another one.

The dashboard can't change a route's priority after you create it. Send `PATCH /api/admin/routes/<id>` with both `priority` and `active`; leaving out `active` turns the route off.

## Fix `ROUTE_UNAVAILABLE`

No route could take the payment. Check that:

1. The application, the provider account, and the payment use the same currency.
2. The provider account's country matches the payment's.
3. An active route exists for the service and payment method.
4. The provider account is active, and **Operations** in the dashboard shows it healthy.
5. The provider supports that service and payment method.
