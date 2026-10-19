# Monitor payments and providers

Make a provider fail on purpose, then find the signs of it in the dashboard.

## What you need

- The setup from [Set up payments in the dashboard](/tutorials/dashboard-setup).
- Optional: the backup from [Add a backup provider](/tutorials/dashboard-fallback).
- About five minutes.

## 1. Read the dashboard

Select **Dashboard**.

| Tile or chart         | Shows                                                               |
| --------------------- | ------------------------------------------------------------------- |
| **System**            | The database connection                                             |
| **Runtime providers** | Adapters loaded in memory                                           |
| **Active accounts**   | Provider accounts serving traffic                                   |
| **Workers**           | Background loops: health checks, reconciliation, cleanup            |
| **Transactions**      | Payments over the selected range; filter by **App** or **Provider** |

## 2. Make a provider fail

1. Select **Providers**, then **Configure** on **Tutorial simulator**.
2. On the **Configuration** tab, enter:

    ```json
    { "webhook_secret": "tutorial-webhook-secret", "fail_health": true }
    ```

3. Select **Replace configuration**, then **Done**.

Saving replaces the whole configuration, so always include `webhook_secret`.

## 3. Watch the health checks

Select **Operations**. The **Provider health** table shows each account's latest result, circuit state, consecutive failures, and last error.

After a few health-check intervals, **Tutorial simulator** shows a growing failure count and **Last error** says the upstream is unavailable. After three consecutive failures it is marked down and routing skips it. With a backup, payments go to **Tutorial backup**; without one, payments fail with `ROUTE_UNAVAILABLE`.

## 4. Inspect a payment

Select **Transactions** and open any payment.

- **Provider account** and **Provider reference** show which provider holds the payment and its ID there.
- **Reconciliation attempts** and **Next reconciliation** show whether Momobase is still asking the provider for an outcome. Momobase keeps querying a `pending` or `unknown` payment, with increasing delays, until it resolves.

## 5. Check balances

The **Balances** card on **Providers** queries each active account's provider live. Use it to check that a disbursement account has funds.

## 6. See who changed what

Select **Audit log**. Your change from step 2 is at the top, with the administrator who made it and their IP address.

## 7. Restore the provider

Replace the configuration of **Tutorial simulator** with `{ "webhook_secret": "tutorial-webhook-secret" }`. Health recovers after the next successful checks.

## Next

- [Operate the server](/server/operations) covers the same signals from the command line and how to diagnose `ROUTE_UNAVAILABLE`.
- [Payment lifecycle](/guide/payment-lifecycle) explains reconciliation.
