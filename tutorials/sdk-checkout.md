# Take payments from a Node.js backend

In this tutorial you write the payment step of a checkout backend with the TypeScript SDK. It checks what can be paid for, creates a collection that is safe to retry, and waits for the final outcome.

This takes about fifteen minutes. You need Node.js 24 and the app credential from [Set up payments in the dashboard](/tutorials/dashboard-setup).

## 1. Create the project

```sh
mkdir checkout && cd checkout
npm init -y
npm pkg set type=module
npm install momobase
```

Export the credential you copied from the dashboard:

```sh
export MOMOBASE_CLIENT_ID='paste-the-client-id'
export MOMOBASE_CLIENT_SECRET='paste-the-client-secret'
```

## 2. Write the checkout

Create `checkout.ts`:

```ts
import { MomobaseAPIError, MomobaseClient } from "momobase";

// One long-lived client per credential shares its cached token across requests.
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
		// Derived from the order, so a retry of the same order cannot pay twice.
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

Amounts are integer minor units, so `50000` is UGX 50,000.

## 3. Take a payment

```sh
node checkout.ts ORDER-1
```

### Checkpoint

The script prints `Routable: momo`, then a transaction ID with `succeeded`, then `Order finished: succeeded`.

## 4. Retry the same order

Run exactly the same command again:

```sh
node checkout.ts ORDER-1
```

The message is now `idempotent replay` and the transaction ID is the same. Momobase recognized the idempotency key and returned the original payment instead of charging again. This is what makes it safe to retry after a timeout or a crash.

Reusing a key with a different payload, such as a different amount, is refused with `PAYMENT_ERROR`.

## 5. Wait for a slow provider

Real providers often answer "processing" and settle later. Make the `dummy` provider do that:

1. In the dashboard, select **Providers**, then **Configure** on **Tutorial simulator**.
2. On **Configuration**, enter `{ "webhook_secret": "tutorial-webhook-secret", "settle_after": 1 }` and select **Replace configuration**.

Then pay a new order:

```sh
node checkout.ts ORDER-2
```

### Checkpoint

The payment starts as `processing`, and the script keeps printing `now processing`. Within about two minutes the reconciliation worker queries the provider, and the script prints `now succeeded`.

Polling suits a script. In a real backend, return to the customer straight away and check the transaction later, or [notify your backend](/tutorials/notify-backend) from Momobase when it changes.

## 6. Handle a refused payment

In the dashboard, select **Deactivate** on every provider account, then pay another order:

```sh
node checkout.ts ORDER-3
```

The script prints `Payment refused: 503 ROUTE_UNAVAILABLE`. Branch on `error.code`, which is stable, rather than on the message.

Reactivate the accounts and restore the configuration to `{ "webhook_secret": "tutorial-webhook-secret" }` when you are done.

## Recap

- Ask `paymentMethods.list()` what can route before showing payment options.
- Derive the idempotency key from your own order, so retries are harmless.
- A payment can finish after the request that created it. Treat only `succeeded`, `failed`, `cancelled`, and `expired` as final.

## Next

- [Application client](/sdk/application-client) documents every method.
- [Errors and cancellation](/sdk/errors) covers timeouts and which errors to retry.
