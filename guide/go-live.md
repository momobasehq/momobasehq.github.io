# Going to production

Everything a Momobase instance needs before it handles real money. Settings are shown as server environment variables. With the Go package, set the matching `Config` fields listed in [Configuration](/guide/configuration).

## 1. Turn on production mode

```ini
APP_ENV=production
```

Momobase then refuses to start if a secret is still a placeholder, the public URL is not `https://`, CORS allows `*`, or a remote PostgreSQL connection has TLS turned off.

## 2. Replace the secrets

```sh
openssl rand -base64 32   # ENCRYPTION_MASTER_KEY_BASE64
openssl rand -hex 32      # ADMIN_OAUTH_SECRET
openssl rand -hex 32      # APP_OAUTH_SECRET
```

Use a different value for each, and keep them out of source control.

::: danger Back up the encryption key with the database
Provider credentials are stored encrypted with `ENCRYPTION_MASTER_KEY_BASE64`. Without it, you must re-enter every provider account. You can't change the key on an existing database.
:::

## 3. Serve over HTTPS

Momobase doesn't terminate TLS. Put a TLS proxy or load balancer in front of it, then set:

| Variable               | Value                                             |
| ---------------------- | ------------------------------------------------- |
| `APP_PUBLIC_URL`       | The `https://` URL callers use                    |
| `TRUSTED_PROXY_CIDRS`  | Your proxy's addresses or CIDRs, and nothing else |
| `CORS_ALLOWED_ORIGINS` | The browser origins that call the API             |

If `TRUSTED_PROXY_CIDRS` is empty behind a proxy, every client shares one rate limit.

## 4. Choose a database

SQLite is fine for one instance. To run more than one, use PostgreSQL or MySQL. For example, with Docker Compose and PostgreSQL:

```yaml
services:
    momobase:
        image: ghcr.io/momobasehq/server:latest
        restart: unless-stopped
        depends_on:
            db:
                condition: service_healthy
        ports:
            - "9090:9090"
        env_file: .env
        environment:
            DB_TYPE: postgres
            DB_HOST: db
            DB_USER: momobase
            DB_PASSWORD: ${POSTGRES_PASSWORD:?}
            DB_NAME: momobase

    db:
        image: postgres:18-alpine
        restart: unless-stopped
        environment:
            POSTGRES_USER: momobase
            POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
            POSTGRES_DB: momobase
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U momobase -d momobase"]
            interval: 5s
            retries: 10
        volumes:
            - postgres-data:/var/lib/postgresql/data

volumes:
    postgres-data:
```

Put the settings from steps 1–3 and `POSTGRES_PASSWORD` in `.env` beside it, as plain values without quotes. For MySQL, set `DB_TYPE=mysql` and `DB_PORT=3306`. For PostgreSQL across a network, set `DB_SSLMODE=require`.

## 5. Add real providers

Create a provider account for each provider, register its webhook URL, and add routes. See [Providers and routing](/guide/providers). Then make a small real payment and check that it reaches a final status.

## 6. Run more than one instance

Skip this with a single instance.

- **Workers:** each instance with `WORKERS_ENABLED=true` runs its own health checks and payment follow-ups. Set it to `true` on exactly one instance and `false` on the rest.
- **Migrations:** set `AUTO_MIGRATE=false` on every instance. For each upgrade, start one instance with `AUTO_MIGRATE=true`, wait for it to finish, then roll out the rest.

Give each instance at least 10 seconds to shut down.

## 7. Monitor it

| Endpoint                      | Checks                         | Needs a token |
| ----------------------------- | ------------------------------ | ------------- |
| `/ping`                       | The process is alive           | No            |
| `/healthz`                    | The HTTP server is answering   | No            |
| `/api/admin/system/health`    | The database                   | Yes           |
| `/api/admin/health/providers` | Each provider account's health | Yes           |

`/ping` and `/healthz` don't check the database or providers, so alert on those separately. The dashboard's **Operations** page shows provider health and background workers.

If a payment stays `processing` or `unknown`, check that workers are running on one instance and that its provider account is active and healthy.

## 8. Back up and upgrade

Back up the database and the encryption key together, and before every upgrade. Migrations only go forward.

- **Docker:** pull a newer image tag and recreate the container.
- **Binary:** run `momobase self-update`, then restart.
- **Go package:** update the module and rebuild.
