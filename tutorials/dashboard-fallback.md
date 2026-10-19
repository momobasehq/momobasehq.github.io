# Add a backup provider

Add a second provider account at a lower priority, take the first one offline, and watch payments move to the backup.

## What you need

- The application, provider account, and route from [Set up payments in the dashboard](/tutorials/dashboard-setup).
- About five minutes.

## 1. Add a second provider account

1. Select **Providers**, then **New account**.
2. Set **Provider** to `dummy` and **Name** to `Tutorial backup`, with **Country** `UG` and **Currency** `UGX`.
3. Set **Configuration (JSON)** to `{ "webhook_secret": "tutorial-backup-secret" }`.
4. Select **Create**, then **Test** and **Activate** on its row.

## 2. Route to it at a lower priority

Lower numbers win. The first route has priority `1`, so priority `2` makes this one the backup.

1. Select **Routes**, then **New route**.
2. Choose **Collection**, **Tutorial backup (dummy)**, and `momo`.
3. Set **Priority** to `2` and select **Create**.

You cannot change a route's priority after creating it.

## 3. Send a payment

On **Tutorial checkout**, open **Testing**, get a token, and select **Collect**. Open the payment on **Transactions**.

**Provider account** is **Tutorial simulator**, the route with the better priority.

## 4. Take the primary offline

1. Select **Providers**, then **Deactivate** on **Tutorial simulator**. This takes effect immediately, with no confirmation.
2. Send another collection from the **Testing** tab.
3. Open the new payment on **Transactions**.

**Provider account** is now **Tutorial backup**. Momobase also skips an account automatically when its circuit breaker opens or its health check reports it down.

## 5. Bring the primary back

Select **Activate** on **Tutorial simulator**. The next payment goes to it again.

Fallback happens only while Momobase picks a route. Once a transaction is committed to a provider account, Momobase never sends it to another provider.

## Next

- [Monitor payments and providers](/tutorials/dashboard-monitor).
- [Routing](/guide/routing) lists every eligibility check.
