# Quickstart

Set up everything a payment needs in the dashboard, then send a test payment through the built-in `dummy` provider. No money moves.

## What you need

- Momobase running, with an administrator. See [Introduction](/guide/).
- About ten minutes.

## 1. Sign in

Open `http://localhost:9090/_/` and sign in with the email and password you gave `seed-admin`.

## 2. Create an application

An application is one system that creates payments, such as your checkout backend. Every payment it sends uses the application's currency.

1. Select **Apps**, then **New app**.
2. Enter the name `Checkout`. Leave **Currency** as `UGX` and **Environment** as **Sandbox**.
3. Select **Create**, then **Manage** on its row.

## 3. Issue a credential

Your backend signs in with a credential: a client ID and secret.

1. On the **Credentials** tab, select **New credential**.
2. Enter the name `Backend`, and check `collections:create` and `transactions:read`.
3. Select **Create**.

Copy the **Client ID** and **Client secret** now. The secret is never shown again; if you lose it, select **Rotate**.

## 4. Add a provider account

A provider account holds your credentials for one provider, in one country and currency. `dummy` simulates a provider.

1. Select **Providers**, then **New account**.
2. Set **Provider** to `dummy` and **Name** to `Simulator`. Leave **Country** as `UG` and **Currency** as `UGX`.
3. Replace **Configuration (JSON)** with:

    ```json
    { "webhook_secret": "quickstart-webhook-secret" }
    ```

4. Select **Create**. On its row, select **Test**, then **Activate**.

## 5. Add a route

A route sends one kind of payment to a provider account.

1. Select **Routes**, then **New route**.
2. Leave **Service** as **Collection**. Set **Provider account** to **Simulator (dummy)** and **Payment method** to `momo`.
3. Select **Create**.

## 6. Send a test payment

1. Select **Apps**, **Manage** on **Checkout**, then the **Testing** tab.
2. Paste the client ID and secret from step 3. On the **Token** tab, select **Get a token**.
3. On the **Payments** tab, choose `momo`, keep the default account and amount, and select **Collect**.

The response shows `"status": "succeeded"`. Select **Transactions** to find the payment.

Every dashboard action is also an admin API endpoint. To script this setup, see the [OpenAPI explorer](/api-reference) or use `MomobaseAdminClient` from an [SDK](/guide/payments#install-an-sdk).

## Next

- [Take payments](/guide/payments) from your backend with the credential from step 3.
- [Add a real provider](/guide/providers).
