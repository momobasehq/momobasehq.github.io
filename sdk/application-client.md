# Application client

Use `MomobaseClient` from a trusted service to discover routable payment methods, create collections or disbursements, and read the application's transactions.

The client authenticates lazily. Call `await app.authenticate()` only when startup should verify the credential before doing other work.

## List routable payment methods

Ask Momobase what can route before collecting payment details:

```ts
const { items } = await app.paymentMethods.list({
	serviceType: "collection",
	country: "UG",
});
```

`serviceType` and `country` are optional. The result contains only service and payment-method pairs available to the authenticated application.

Currency is taken from the authenticated application. A method is listed only when at least one active route, provider account, runtime, capability, health snapshot, and circuit state currently allow it. Availability can change after discovery.

## Create a collection

```ts
const payment = await app.collections.create(
	{
		payment_method: "momo",
		scheme: "mtn",
		account: "256770000000",
		amount: 50000,
		currency: "UGX",
		country: "UG",
		reference: "ORDER-1",
		description: "Order ORDER-1",
		customer: { name: "Ada Lovelace", email: "ada@example.com" },
	},
	{ idempotencyKey: "order-1" },
);
```

Amounts are integer minor units, so `50000` is UGX 50,000. `account`, `scheme`, and `metadata` are provider-defined. The selected provider validates them and may normalize `account` and `scheme`.

Use one stable idempotency key for retries of the same operation. Do not reuse it for a different payload.

The SDK does not generate idempotency keys. Omitting the key sends the request, but Momobase rejects it, so set `idempotencyKey` for every collection and disbursement.

## Create a disbursement

```ts
const payout = await app.disbursements.create(
	{
		payment_method: "momo",
		scheme: "mtn",
		account: "256770000001",
		amount: 25000,
		currency: "UGX",
		country: "UG",
		reference: "PAYOUT-1",
		recipient: { name: "Grace Hopper" },
	},
	{ idempotencyKey: "payout-1" },
);
```

Collection and disbursement responses include `transaction_id`, `status`, `selected_provider`, `provider_reference`, and `platform_fee`.

Possible statuses are `pending`, `processing`, `unknown`, `succeeded`, `failed`, `cancelled`, and `expired`. Treat `succeeded`, `failed`, `cancelled`, and `expired` as terminal. See [Payment lifecycle](/guide/payment-lifecycle).

## Read a transaction

```ts
const byID = await app.transactions.get(payment.transaction_id);
const byReference = await app.transactions.getByReference("ORDER-1");
```

`getByReference()` is scoped to the authenticated application. Use it when your business reference is the identifier available to the calling service.

Transaction amounts and fees are integer minor units. Provider-specific `metadata` is sent to the selected adapter but is not persisted, while account and party fields become part of the transaction record.

## Methods

| Method                                             | Result                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `paymentMethods.list(filters?, options?)`          | Currently routable service and payment-method pairs |
| `collections.create(payload, options?)`            | Accepted collection                                 |
| `disbursements.create(payload, options?)`          | Accepted disbursement                               |
| `transactions.get(id, options?)`                   | Transaction by Momobase ID                          |
| `transactions.getByReference(reference, options?)` | Transaction by application reference                |

Every method accepts request options where shown. See [Errors and cancellation](/sdk/errors) for `AbortSignal` usage and retry guidance.
