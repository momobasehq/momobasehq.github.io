# SDKs

Official clients for the Momobase HTTP API. Each SDK's GitHub README is its full documentation.

| SDK        | Package                                                     | Runtime                                                       | Documentation                                                            |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| TypeScript | [`momobase` on npm](https://www.npmjs.com/package/momobase) | Node.js 24, or a browser with `fetch()` and `AbortController` | [momobasehq/sdk](https://github.com/momobasehq/sdk#readme)               |
| Python     | [`momobase` on PyPI](https://pypi.org/project/momobase/)    | Python 3.11 or newer                                          | [momobasehq/sdk-python](https://github.com/momobasehq/sdk-python#readme) |

Both SDKs have the same two clients:

| Client                | Calls              | Authenticates with                                           |
| --------------------- | ------------------ | ------------------------------------------------------------ |
| `MomobaseClient`      | Payment API        | An application credential: client ID and client secret       |
| `MomobaseAdminClient` | Administration API | An administrator's email and password, or a saved token pair |

Both clients get a token on the first request, cache it, and refresh it for you.

## What you need

- A running Momobase instance. Follow the [Quickstart](/guide/quickstart) if you don't have one.
- An application credential with the scopes you need, such as `collections:create` and `transactions:read`.
- A route that can serve the payment. The Quickstart creates one.

::: warning Keep the client secret on your server
`MomobaseClient` holds an application client secret. Never ship it in a browser or mobile app bundle.
:::

## TypeScript

```sh
npm install momobase
```

```ts
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

Full documentation: [github.com/momobasehq/sdk](https://github.com/momobasehq/sdk#readme).

## Python

```sh
pip install momobase
```

```python
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

Full documentation: [github.com/momobasehq/sdk-python](https://github.com/momobasehq/sdk-python#readme).

## Other languages

Call the HTTP API directly. See [HTTP conventions](/api/conventions) and the [OpenAPI explorer](/api-reference).
