# Monitor payments and providers

The dashboard shows the state of every payment and provider. In this tutorial you make a provider fail on purpose, then follow the signs of it through the dashboard, the way you would during a real incident.

This takes about five minutes and continues from [Set up payments in the dashboard](/tutorials/dashboard-setup).

## 1. Read the dashboard

Select **Dashboard**.

- **System** reports the database connection.
- **Runtime providers** counts adapters loaded in memory, and **Active accounts** counts accounts serving traffic.
- **Workers** lists the background loops: health checks, reconciliation, and cleanup.
- The **Transactions** chart counts payments over the selected range. Filter it by **App** or **Provider**.

## 2. Make a provider fail

Tell the `dummy` provider to fail its health checks:

1. Select **Providers**, then **Configure** on **Tutorial simulator**.
2. On the **Configuration** tab, enter:

    ```json
    { "webhook_secret": "tutorial-webhook-secret", "fail_health": true }
    ```

3. Select **Replace configuration**, then **Done**.

Saving replaces the whole configuration and reloads the adapter, so `webhook_secret` must be included again.

## 3. Watch the health checks

Select **Operations**. The **Provider health** table shows the latest verdict for each account, its circuit state, the consecutive failure count, and the last error.

### Checkpoint

After a few health-check intervals, **Tutorial simulator** shows a growing failure count, and **Last error** says the upstream is unavailable. After three consecutive failures it is marked down, and routing skips it. With the backup from [Add a backup provider](/tutorials/dashboard-fallback), payments keep flowing to **Tutorial backup**; without it, a payment is rejected with `ROUTE_UNAVAILABLE`.

The **Runtime providers** table on the same page lists the loaded adapters and how many capabilities each declares.

## 4. Inspect a payment

Select **Transactions** and open any payment. Two fields matter most during an incident:

- **Provider account** and **Provider reference** tell you which provider holds the payment, and how that provider identifies it.
- **Reconciliation attempts** and **Next reconciliation** show whether Momobase is still asking the provider for an outcome. A payment left `pending` or `unknown` is queried again with increasing delays until it resolves.

## 5. Check balances

The **Balances** card on **Providers** queries each active account's provider live. Use it to confirm a disbursement account holds enough funds.

## 6. See who changed what

Select **Audit log**. Your configuration change from step 2 is at the top, with the administrator who made it and their IP address.

## 7. Restore the provider

Replace the configuration of **Tutorial simulator** with `{ "webhook_secret": "tutorial-webhook-secret" }`. Health recovers on the next successful checks.

## Recap

- **Dashboard** answers whether the system is up.
- **Operations** answers whether each provider is healthy and routable.
- **Transactions** answers where a payment is and whether it is still being resolved.
- **Audit log** answers who changed the configuration.

## Next

- [Operate the server](/server/operations) covers the same signals from the command line, and how to diagnose `ROUTE_UNAVAILABLE`.
- Read the [payment lifecycle](/guide/payment-lifecycle) for how reconciliation resolves uncertain payments.
