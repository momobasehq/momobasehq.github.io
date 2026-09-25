# Add a backup provider

When you give a payment method more than one route, Momobase tries them in priority order and skips any account that cannot take the payment. In this tutorial you add a backup account, take the primary offline, and watch payments move to the backup.

This takes about five minutes and continues from [Set up payments in the dashboard](/tutorials/dashboard-setup).

## 1. Add a second provider account

1. Select **Providers**, then **New account**.
2. Set **Provider** to `dummy` and **Name** to `Tutorial backup`, for the same `UG` and `UGX`.
3. Set **Configuration (JSON)** to `{ "webhook_secret": "tutorial-backup-secret" }`.
4. Select **Create**, then **Test** and **Activate** on its row.

## 2. Route to it at a lower preference

Lower numbers win. Your first route has priority `1`, so priority `2` makes this one the fallback.

1. Select **Routes**, then **New route**.
2. Choose **Collection**, **Tutorial backup (dummy)**, and `momo`.
3. Set **Priority** to `2` and select **Create**.

The dashboard cannot change a route's priority after creation, so choose it deliberately.

## 3. Send a payment

On **Tutorial checkout**, open **Testing**, get a token, and select **Collect**. Then open the payment on **Transactions**.

### Checkpoint

**Provider account** is **Tutorial simulator**. Both routes are eligible, and the primary has the better priority.

## 4. Take the primary offline

1. Select **Providers**, then **Deactivate** on **Tutorial simulator**.
2. Send another collection from the **Testing** tab.
3. Open the new payment on **Transactions**.

### Checkpoint

**Provider account** is now **Tutorial backup**. The primary route still exists, but its account is inactive, so selection moved to the next route.

You deactivated the account by hand. Momobase skips an account the same way when its circuit breaker opens after repeated failures, or when its health check reports it down.

## 5. Bring the primary back

Select **Activate** on **Tutorial simulator**. The next payment goes to it again.

::: warning
Deactivating an account takes effect immediately and there is no confirmation prompt. In production, add the backup route before you take a primary offline.
:::

## Recap

Priority chooses between eligible routes, and an ineligible account is skipped. Fallback only happens while Momobase picks a route. Once a transaction is committed to an account, Momobase never resends it to another provider, because that could move money twice.

## Next

- [Monitor payments and providers](/tutorials/dashboard-monitor) to see health and circuit state.
- Read [Routing](/guide/routing) for every eligibility check.
