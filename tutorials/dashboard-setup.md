# Set up payments in the dashboard

In this tutorial you run Momobase Server, sign in to its dashboard, and configure everything a payment needs: an app, a credential, a provider account, and a route. Then you send a test payment and find it in the transaction list.

This takes about ten minutes. You need Docker.

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

The dashboard has no sign-up screen, so the first administrator is always created on the command line. `seed-admin` runs once; a second run with the same email fails.

Open `http://localhost:9090/_/`, enter the email and password, and select **Sign in**.

### Checkpoint

You see the **Dashboard** page. The **System** tile reads **Healthy**. The sidebar groups screens under **Overview**, **Configuration**, and **Administration**.

## 2. Create an app

An app represents one system that creates payments, such as your checkout backend. Its currency is fixed: every payment it sends must use it.

1. Select **Apps**, then **New app**.
2. Enter the name `Tutorial checkout`. Leave **Currency** as `UGX` and **Environment** as **Sandbox**.
3. Select **Create**.

The app appears in the table. Select **Manage** on its row to open it.

## 3. Issue a credential

Your backend exchanges a credential for access tokens. Give it only the scopes it needs.

1. On the **Credentials** tab, select **New credential**.
2. Enter the name `Tutorial backend`.
3. Check `collections:create` and `transactions:read`.
4. Select **Create**.

The **Client secret** dialog shows the **Client ID** and **Client secret**. Copy both somewhere safe now. The secret is stored hashed and is never shown again; if you lose it, select **Rotate** on the credential to issue a new one.

## 4. Add a provider account

A provider account connects Momobase to one upstream provider for one country and currency. Here you use `dummy`, which simulates payments in memory.

1. Select **Providers**, then **New account**.
2. Set **Provider** to `dummy` and **Name** to `Tutorial simulator`. Leave **Country** as `UG` and **Currency** as `UGX`.
3. Replace **Configuration (JSON)** with:

    ```json
    { "webhook_secret": "tutorial-webhook-secret" }
    ```

4. Select **Create**.

Accounts start inactive, so a half-configured account can never receive traffic. On its row, select **Test**. When the toast says **Configuration passed its health check**, select **Activate**.

::: tip
In a real deployment, `webhook_secret` should be a long random value. The configuration is encrypted at rest and never shown again.
:::

## 5. Route payments to the account

A route tells Momobase which account serves a service and payment method.

1. Select **Routes**, then **New route**.
2. Leave **Service** as **Collection**.
3. Set **Provider account** to **Tutorial simulator (dummy)** and **Payment method** to `momo`.
4. Leave **Priority** as `1` and select **Create**.

### Checkpoint

The route is listed with status active. Momobase can now take mobile-money collections in Uganda.

## 6. Send a test payment

The app's **Testing** tab calls the public API exactly as your backend would.

1. Select **Apps**, then **Manage** on **Tutorial checkout**, then the **Testing** tab.
2. Paste the **Client ID** and **Client secret** from step 3.
3. On the **Token** tab, select **Get a token**, then **List payment methods**. The result lists `collection` and `momo`.
4. On the **Payments** tab, choose `momo` as the **Payment method**, keep the default account and amount, and select **Collect**.

The response shows `"status": "succeeded"`. The `dummy` provider settles immediately by default.

## 7. Find the payment

Select **Transactions**. Your payment is at the top. Select its row to see the full record: the amount, the **Provider account** that served it, the **Provider reference**, and the idempotency key the tester generated.

## Recap

You configured the four things every Momobase payment depends on:

- An **app** and its **credential** say who may create payments.
- A **provider account** says how to reach a provider.
- A **route** says which account serves which payment method.

## Next

- [Add a backup provider](/tutorials/dashboard-fallback) so payments keep flowing when one account is down.
- [Take payments from a Node.js backend](/tutorials/sdk-checkout) with the credential you just issued.
- Read [Routing](/guide/routing) for every rule that decides which account serves a payment.
