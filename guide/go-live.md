# Go live

Everything a Momobase instance needs before it handles real money. Each setting is listed twice: the environment variable for [Momobase Server](/server/configuration), and the `Config` field for the [Go package](/library/configuration).

## Checklist

1. [Set the environment to production](#_1-set-the-environment-to-production)
2. [Replace the three secrets](#_2-replace-the-three-secrets), and back up the encryption key
3. [Serve over HTTPS behind a proxy](#_3-serve-over-https-behind-a-proxy)
4. [Choose a database](#_4-choose-a-database), and back it up
5. [Add real provider accounts](#_5-add-real-provider-accounts)
6. [Run workers on exactly one instance](#_6-run-workers-on-exactly-one-instance)
7. [Migrate before rolling out replicas](#_7-migrate-before-rolling-out-replicas)
8. [Monitor health](#_8-monitor-health)

## 1. Set the environment to production

| Server    | Go package | Value        |
| --------- | ---------- | ------------ |
| `APP_ENV` | `App.Env`  | `production` |

With `production` (or `staging`), Momobase refuses to start if a secret is still a placeholder, the public URL is not `https://`, CORS allows `*`, or a remote PostgreSQL connection has TLS disabled.

## 2. Replace the three secrets

| Server variable / Go field                                             | Rule                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| `ENCRYPTION_MASTER_KEY_BASE64`<br>`Security.EncryptionMasterKeyBase64` | Must decode to exactly 32 bytes                         |
| `ADMIN_OAUTH_SECRET`<br>`Security.AdminOAuthSecret`                    | At least 32 characters                                  |
| `APP_OAUTH_SECRET`<br>`Security.AppOAuthSecret`                        | At least 32 characters, different from the admin secret |

Generate them:

```sh
openssl rand -base64 32   # ENCRYPTION_MASTER_KEY_BASE64
openssl rand -hex 32      # ADMIN_OAUTH_SECRET
openssl rand -hex 32      # APP_OAUTH_SECRET
```

Keep all three out of source control.

::: danger Back up the encryption key with the database
Provider credentials are stored encrypted with this key. Without it, the database can't decrypt them, and you must re-enter every provider account. The key cannot be rotated in place.
:::

## 3. Serve over HTTPS behind a proxy

Momobase does not terminate TLS. Put a TLS proxy or load balancer in front of it, then set:

| Server                 | Go package               | Value                                             |
| ---------------------- | ------------------------ | ------------------------------------------------- |
| `APP_PUBLIC_URL`       | `App.PublicURL`          | The `https://` URL callers use                    |
| `TRUSTED_PROXY_CIDRS`  | `App.TrustedProxyCIDRs`  | Your proxy's addresses or CIDRs, and nothing else |
| `CORS_ALLOWED_ORIGINS` | `App.CORSAllowedOrigins` | The browser origins that call the API, never `*`  |

If `TRUSTED_PROXY_CIDRS` is empty behind a proxy, every client shares one rate limit.

## 4. Choose a database

| Instances     | Database                     |
| ------------- | ---------------------------- |
| One           | SQLite, PostgreSQL, or MySQL |
| More than one | PostgreSQL or MySQL          |

| Server        | Go package    | Value                                             |
| ------------- | ------------- | ------------------------------------------------- |
| `DB_TYPE`     | `DB.Type`     | `sqlite`, `postgres`, or `mysql`                  |
| `DB_HOST`     | `DB.Host`     | PostgreSQL or MySQL host                          |
| `DB_PORT`     | `DB.Port`     | Defaults to `5432`. Set `3306` for MySQL          |
| `DB_USER`     | `DB.User`     | Database user                                     |
| `DB_PASSWORD` | `DB.Password` | Database password                                 |
| `DB_NAME`     | `DB.Name`     | Database name                                     |
| `DB_SSLMODE`  | `DB.SSLMode`  | `require` for PostgreSQL over a network           |
| `DB_PATH`     | `DB.Path`     | SQLite file. In the container, keep it on `/data` |

Back up the database together with the encryption key.

## 5. Add real provider accounts

For each provider:

1. Get API credentials from the provider. Start with its sandbox.
2. Create a provider account with those credentials and a `webhook_secret`, then test and activate it. The provider's README lists its configuration keys: see [Official providers](/library/official-providers).
3. Register `<APP_PUBLIC_URL>/webhooks/<provider-account-id>` as the provider's callback URL.
4. Create a route for each service and payment method the account should handle.
5. Make a small real payment and confirm it reaches a final status.

## 6. Run workers on exactly one instance

| Server            | Go package        | Value                                         |
| ----------------- | ----------------- | --------------------------------------------- |
| `WORKERS_ENABLED` | `Workers.Enabled` | `true` on one instance, `false` on all others |

Workers check provider health, reconcile unresolved payments, and clean up expired sessions. With one instance, leave the default `true`. If the instance running workers goes down, turn workers on for another one.

## 7. Migrate before rolling out replicas

| Server         | Go package             | Value                                                                        |
| -------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `AUTO_MIGRATE` | `Features.AutoMigrate` | `true` for one instance; `false` for replicas, migrating once before rollout |

Back up the database and encryption key before each upgrade. Migrations only go forward. See [Control migrations](/server/deployment#control-migrations).

## 8. Monitor health

| Endpoint                      | Checks                                | Needs a token |
| ----------------------------- | ------------------------------------- | ------------- |
| `/ping`                       | The process is alive                  | No            |
| `/healthz`                    | The API is ready                      | No            |
| `/api/admin/system/health`    | Database and runtime                  | Yes           |
| `/api/admin/health/providers` | Each provider account and its circuit | Yes           |

Alert on provider health separately: `/ping` and `/healthz` don't call providers. [Operate the server](/server/operations) covers what to do when a check fails.
