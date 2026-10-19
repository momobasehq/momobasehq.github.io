# Take payments from a Node.js backend

Write the payment step of a checkout backend with the TypeScript SDK: list payment methods, create a collection that is safe to retry, and wait for the final status.

## What you need

- Node.js 24.
- The **Client ID** and **Client secret** from [Set up payments in the dashboard](/tutorials/dashboard-setup).
- About fifteen minutes.

## 1. Create the project

```sh
mkdir checkout && cd checkout
npm init -y
npm pkg set type=module
npm install momobase
```

Export the credential:

```sh
export MOMOBASE_CLIENT_ID='paste-the-client-id'
export MOMOBASE_CLIENT_SECRET='paste-the-client-secret'
```

## 2. Write the checkout

Create `checkout.ts`:

```ts
import { MomobaseAPIError, MomobaseClient } from "momobase";

// Create one client per credential and reuse it.
const app = new MomobaseClient({
	baseUrl: "http://localhost:9090",
	clientId: process.env.MOMOBASE_CLIENT_ID!,
	clientSecret: process.env.MOMOBASE_CLIENT_SECRET!,
});

const terminal = new Set(["succeeded", "failed", "cancelled", "expired"]);

async function checkout(orderId: string, phone: string, amount: number) {
	const payment = await app.collections.create(
		{
			payment_method: "momo",
			account: phone,
			amount,
			currency: "UGX",
			country: "UG",
			reference: orderId,
			description: `Order ${orderId}`,
		},
		// Derived from the order, so retrying the same order cannot pay twice.
		{ idempotencyKey: `checkout-${orderId}` },
	);
	console.log(
		`${payment.transaction_id}: ${payment.status} (${payment.message})`,
	);

	let status = payment.status;
	while (!terminal.has(status)) {
		await new Promise((resolve) => setTimeout(resolve, 5000));
		status = (await app.transactions.get(payment.transaction_id)).status;
		console.log(`  now ${status}`);
	}
	return status;
}

const { items } = await app.paymentMethods.list({
	serviceType: "collection",
	country: "UG",
});
console.log("Routable:", items.map((item) => item.payment_method).join(", "));

try {
	const status = await checkout(
		process.argv[2] ?? "ORDER-1",
		"256770000000",
		50000,
	);
	console.log(`Order finished: ${status}`);
} catch (error) {
	if (!(error instanceof MomobaseAPIError)) throw error;
	console.error(
		`Payment refused: ${error.status} ${error.code}: ${error.message}`,
	);
	process.exitCode = 1;
}
```

Amounts are integers in the currency's minor unit, so `50000` is UGX 50,000.

## 3. Take a payment

```sh
node checkout.ts ORDER-1
```

You should see `Routable: momo`, a transaction ID with `succeeded`, then `Order finished: succeeded`.

## 4. Retry the same order

```sh
node checkout.ts ORDER-1
```

The message is now `idempotent replay` and the transaction ID is the same: Momobase returned the original payment instead of charging again. Reusing a key with a different payload, such as a different amount, fails with `PAYMENT_ERROR`.

## 5. Wait for a slow provider

Make the `dummy` provider settle later:

1. In the dashboard, select **Providers**, then **Configure** on **Tutorial simulator**.
2. On **Configuration**, enter `{ "webhook_secret": "tutorial-webhook-secret", "settle_after": 1 }` and select **Replace configuration**.

Pay a new order:

```sh
node checkout.ts ORDER-2
```

The payment starts as `processing` and the script prints `now processing`. Within about two minutes, reconciliation settles it and the script prints `now succeeded`.

In a real backend, respond to the customer immediately and check the transaction later instead of polling in the request.

## 6. Handle a refused payment

In the dashboard, select **Deactivate** on every provider account, then:

```sh
node checkout.ts ORDER-3
```

The script prints `Payment refused: 503 ROUTE_UNAVAILABLE`. Branch on `error.code`, not on the message.

When you are done, reactivate the accounts and set the configuration back to `{ "webhook_secret": "tutorial-webhook-secret" }`.

## Next

- The [TypeScript SDK README](https://github.com/momobasehq/sdk#readme) documents every method and error.
- Prefer Python? See the [Python SDK](https://github.com/momobasehq/sdk-python#readme).
- [Notify your backend of payment changes](/tutorials/notify-backend) instead of polling.
