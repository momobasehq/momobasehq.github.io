# Set up payments in the dashboard

Run Momobase Server, configure everything a payment needs in the dashboard, and send a test payment.

## What you need

- Docker.
- About ten minutes.

## 1. Start the server and create an administrator

```sh
docker run -d \
	--name momobase \
	-p 9090:9090 \
	-v momobase-data:/data \
	ghcr.io/momobasehq/server:latest

docker exec momobase momobase seed-admin \
	--email admin@example.com --password 'local-password'
```

The dashboard has no sign-up screen, so create the first administrator with `seed-admin`. Run it once; a second run with the same email fails.

Open `http://localhost:9090/_/`, enter the email and password, and select **Sign in**.

You should see the **Dashboard** page with the **System** tile reading **Healthy**.

## 2. Create an application

An application is one system that creates payments, such as your checkout backend. Every payment it sends must use its currency.

1. Select **Apps**, then **New app**.
2. Enter the name `Tutorial checkout`. Leave **Currency** as `UGX` and **Environment** as **Sandbox**.
3. Select **Create**.
4. Select **Manage** on its row.

## 3. Issue a credential

1. On the **Credentials** tab, select **New credential**.
2. Enter the name `Tutorial backend`.
3. Check `collections:create` and `transactions:read`.
4. Select **Create**.

Copy the **Client ID** and **Client secret** from the dialog now. The secret is never shown again; if you lose it, select **Rotate** on the credential.

## 4. Add a provider account

A provider account connects Momobase to one provider for one country and currency. `dummy` simulates payments and moves no money.

1. Select **Providers**, then **New account**.
2. Set **Provider** to `dummy` and **Name** to `Tutorial simulator`. Leave **Country** as `UG` and **Currency** as `UGX`.
3. Replace **Configuration (JSON)** with:

    ```json
    { "webhook_secret": "tutorial-webhook-secret" }
    ```

4. Select **Create**.
5. On its row, select **Test**. When the toast says **Configuration passed its health check**, select **Activate**.

New accounts are inactive until you activate them. In a real deployment, use a long random `webhook_secret`.

## 5. Add a route

A route sends one service and payment method to a provider account.

1. Select **Routes**, then **New route**.
2. Leave **Service** as **Collection**.
3. Set **Provider account** to **Tutorial simulator (dummy)** and **Payment method** to `momo`.
4. Leave **Priority** as `1` and select **Create**.

The route is listed as active.

## 6. Send a test payment

1. Select **Apps**, then **Manage** on **Tutorial checkout**, then the **Testing** tab.
2. Paste the **Client ID** and **Client secret** from step 3.
3. On the **Token** tab, select **Get a token**, then **List payment methods**. The result lists `collection` and `momo`.
4. On the **Payments** tab, choose `momo` as the **Payment method**, keep the default account and amount, and select **Collect**.

The response shows `"status": "succeeded"`.

## 7. Find the payment

Select **Transactions**. Your payment is at the top. Select its row to see the amount, **Provider account**, **Provider reference**, and idempotency key.

## Next

- [Add a backup provider](/tutorials/dashboard-fallback).
- [Take payments from a Node.js backend](/tutorials/sdk-checkout) with the credential you just issued.
- [Routing](/guide/routing) lists every rule that picks a provider account.
