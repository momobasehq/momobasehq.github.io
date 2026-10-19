# Take payments

Your backend calls the application API with an application credential. Use an SDK, or call [the HTTP API](/api/conventions) directly.

## What you need

- An application credential with `collections:create` or `disbursements:create`, and `transactions:read`. The [Quickstart](/guide/quickstart) creates one.
- A route for the payment method you use.

::: warning Keep the client secret on your server
Never ship an application client secret in a browser or mobile app.
:::

## Install an SDK

| SDK        | Install                | Documentation                                                            |
| ---------- | ---------------------- | ------------------------------------------------------------------------ |
| TypeScript | `npm install momobase` | [momobasehq/sdk](https://github.com/momobasehq/sdk#readme)               |
| Python     | `pip install momobase` | [momobasehq/sdk-python](https://github.com/momobasehq/sdk-python#readme) |

Each SDK has two clients. `MomobaseClient` takes payments with an application credential. `MomobaseAdminClient` calls the admin API with an administrator's email and password. Both fetch, cache, and refresh tokens for you.

## Create a payment

::: code-group

```ts [TypeScript]
import { MomobaseClient } from "momobase";

const mb = new MomobaseClient({
	baseUrl: "http://localhost:9090",
	clientId: process.env.MOMOBASE_CLIENT_ID!,
	clientSecret: process.env.MOMOBASE_CLIENT_SECRET!,
});

const payment = await mb.collections.create(
	{
		payment_method: "momo",
		account: "256770000000",
		amount: 50000,
		currency: "UGX",
		country: "UG",
		reference: "ORDER-1",
	},
	{ idempotencyKey: "order-1" },
);

console.log(payment.transaction_id, payment.status);
```

```python [Python]
import os
from momobase import MomobaseClient

with MomobaseClient(
    "http://localhost:9090",
    client_id=os.environ["MOMOBASE_CLIENT_ID"],
    client_secret=os.environ["MOMOBASE_CLIENT_SECRET"],
) as mb:
    payment = mb.collections.create(
        {
            "payment_method": "momo",
            "account": "256770000000",
            "amount": 50000,
            "currency": "UGX",
            "country": "UG",
            "reference": "ORDER-1",
        },
        idempotency_key="order-1",
    )
    print(payment["transaction_id"], payment["status"])
```

:::

Create one client per credential and reuse it. To send money out, call `disbursements.create` with the same fields.

| Field            | Rule                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| `payment_method` | `momo`, `card`, `bank_transfer`, or `wallet`                                      |
| `account`        | Required. The phone number, bank account, card token, or wallet to pay from or to |
| `amount`         | A positive integer in the currency's minor unit                                   |
| `currency`       | The application's currency                                                        |
| `country`        | A two-letter country code, such as `UG`                                           |
| `reference`      | Required. Your own ID for the payment, up to 128 characters                       |
| `description`    | Optional, up to 255 characters                                                    |
| `customer`       | Optional `name` and `email` of the person paying, for collections                 |
| `recipient`      | Optional `name` and `email` of the person paid, for disbursements                 |

## Retry safely

Every payment needs an idempotency key, unique per application. Use an ID from your own system, such as the order ID, and send the same request on every retry.

- The same request with the same key returns the original payment. The provider is not called again.
- A different request with a used key fails with `PAYMENT_ERROR`.

## Wait for the final status

A payment can come back still in progress. Momobase finishes it when the provider sends a webhook, or by asking the provider until it answers.

| Status       | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `pending`    | Saved, not yet confirmed by the provider                   |
| `processing` | The provider accepted it and is working on it              |
| `unknown`    | The provider gave no clear answer. Momobase will ask again |
| `succeeded`  | Final. The money moved                                     |
| `failed`     | Final. The provider rejected it                            |
| `cancelled`  | Final. It was cancelled                                    |
| `expired`    | Final. It expired before completing                        |

A final status never changes. Respond to your customer right away, then read the payment later with `transactions.get(transaction_id)`, or by your reference with `transactions.getByReference` (`get_by_reference` in Python). To be told about every change instead, use a [hook](/library/hooks).

## Handle errors

A failed call throws (or raises) a `MomobaseAPIError` with the HTTP `status` and a `code`. Branch on the code; the message is for people and may change.

| Code                | Means                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`  | A field is missing or invalid                                                                                    |
| `ROUTE_UNAVAILABLE` | No provider account can take this payment. See [Fix `ROUTE_UNAVAILABLE`](/guide/providers#fix-route-unavailable) |
| `PAYMENT_REJECTED`  | A [hook](/library/hooks) refused the payment                                                                     |
| `PAYMENT_ERROR`     | The payment could not be created, such as a reused idempotency key                                               |
| `RATE_LIMITED`      | Too many requests. See [rate limits](/api/conventions#rate-limits)                                               |

## Check what you can take

`paymentMethods.list` (`payment_methods.list` in Python) returns the service and payment method pairs that can route right now. Filter by service and country. Use it to show only the methods that work.
