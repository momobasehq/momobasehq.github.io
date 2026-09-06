# Configure the server

Settings come from three places. A variable already set in the real environment beats the same key in `.env`, and an explicitly passed flag beats both:

```
flags  >  environment  >  .env file  >  built-in defaults
```

`.env` is read from the working directory at start-up. `.env.example` in the repository lists every variable with its default and is the file to copy:

```sh
cp .env.example .env
```

Only three settings have a flag equivalent — `--addr`, `--dashboard`, and `--dashboard-path`. Everything else is set through the environment. See [Command-line interface](/server/cli).

## Secrets

These three have no safe default. With `APP_ENV=staging` or `production` the server refuses to start until all three are replaced.

| Variable                       | Generate with             | Requirement                                         |
| ------------------------------ | ------------------------- | --------------------------------------------------- |
| `ENCRYPTION_MASTER_KEY_BASE64` | `openssl rand -base64 32` | Must decode to exactly 32 bytes                     |
| `ADMIN_OAUTH_SECRET`           | `openssl rand -hex 32`    | 32 characters or more                               |
| `APP_OAUTH_SECRET`             | `openssl rand -hex 32`    | 32 characters or more, different from the admin one |

Mint all three once, before the first deployment:

```sh
$ openssl rand -base64 32
CqTb0+/Zt7WPMv7yEDCwyzVBJ0FSuqTNW1Ry8dTDRXg=

$ openssl rand -hex 32
0d17e4b5a1e88fd93b0ad38a7c4a2c65b32f5a08d5c4e2911fd60cbf8a37e4d2

$ openssl rand -hex 32
b9f52c1de6a03847ca9d1e7f0b52a4c8317de95b6a2f40d8ec713a5f9b0c26e7
```

The values above show the shape of each one. Never reuse them.

`-base64 32` for the encryption key is a requirement, not a suggestion: `openssl rand -base64 24` produces a key that fails at start-up with `encryption key must decode to exactly 32 bytes, got 24`. The OAuth secrets are HMAC keys with no fixed length, so `-hex 32` and `-base64 32` both work.

Give the administrator and application secrets different values, so one leaked secret forges only its own audience's tokens.

::: danger Back up the encryption key with the database
Provider configuration is encrypted with `ENCRYPTION_MASTER_KEY_BASE64` before it is stored. The database alone cannot recover it. A lost key means re-entering every provider account's configuration by hand, and the key cannot be rotated in place because it decrypts what is already written.
:::

Rotating a signing secret is safe by comparison: assign the new value and restart. Every token issued under the old secret is rejected from that point, so callers reauthenticate. There is no overlap window.

## Application

| Variable               | Default                 | Description                                                       |
| ---------------------- | ----------------------- | ----------------------------------------------------------------- |
| `APP_NAME`             | `momobase`              | Name reported by runtime metadata                                 |
| `APP_ENV`              | `development`           | `staging` or `production` enables the safety checks below         |
| `APP_ADDR`             | `:9090`                 | Listen address (`--addr`)                                         |
| `APP_PUBLIC_URL`       | `http://localhost:9090` | Externally reachable base URL; must be `https://` in production   |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:9090` | Comma-separated browser origins                                   |
| `TRUSTED_PROXY_CIDRS`  | empty                   | Comma-separated proxy addresses or CIDRs trusted for forwarding   |
| `LOG_LEVEL`            | `info`                  | `debug`, `info`, `warn`, or `error`; unknown values become `info` |

`APP_ENV` is matched exactly. Any other value, including `test` or an empty string, skips the safety checks.

Leave `TRUSTED_PROXY_CIDRS` empty when nothing sits in front of the server — rate limiting then keys on the immediate peer. Behind a proxy, an empty value puts every client in one rate-limit bucket. Set it only to proxies you control: forwarded headers are forgeable by any caller.

## Database

| Variable      | Default              | Description                                        |
| ------------- | -------------------- | -------------------------------------------------- |
| `DB_TYPE`     | `sqlite`             | `sqlite`, `postgres`, or `mysql`                   |
| `DB_PATH`     | `./data/momobase.db` | SQLite only; `/data/momobase.db` in the container  |
| `DB_HOST`     | `localhost`          | PostgreSQL or MySQL host                           |
| `DB_PORT`     | `5432`               | PostgreSQL or MySQL port; set explicitly for MySQL |
| `DB_USER`     | `momobase`           | PostgreSQL or MySQL user                           |
| `DB_PASSWORD` | empty                | PostgreSQL or MySQL password                       |
| `DB_NAME`     | `momobase`           | PostgreSQL or MySQL database                       |
| `DB_SSLMODE`  | `disable`            | PostgreSQL TLS mode passed to the driver           |

An unrecognized `DB_TYPE` fails at start-up. SQLite is pure Go — there is no cgo requirement — and the server creates the parent directory of `DB_PATH`. The default path is relative and resolves against the working directory. PostgreSQL and MySQL sessions use UTC; MySQL uses `utf8mb4`.

## Tokens

| Variable                   | Default      | Description                                 |
| -------------------------- | ------------ | ------------------------------------------- |
| `ADMIN_ACCESS_TTL_MINUTES` | `15`         | Administrator access-token lifetime         |
| `ADMIN_REFRESH_TTL_HOURS`  | `24`         | Administrator refresh-token lifetime        |
| `APP_ACCESS_TTL_MINUTES`   | `30`         | Application access-token lifetime           |
| `APP_REFRESH_TTL_HOURS`    | `24`         | Application refresh-token lifetime          |
| `APP_CLIENT_ID_PREFIX`     | `app_client` | Prefix for generated application client IDs |
| `APP_CLIENT_SECRET_PREFIX` | `mb_test`    | Prefix for generated client secrets         |

Durations are whole positive integers in the unit named by the variable. A non-numeric or non-positive value fails at start-up rather than falling back to the default.

## Workers

| Variable                          | Default | Description                             |
| --------------------------------- | ------- | --------------------------------------- |
| `WORKERS_ENABLED`                 | `true`  | Master switch for every background loop |
| `HEALTH_WORKER_ENABLED`           | `true`  | Provider health checks                  |
| `HEALTH_CHECK_INTERVAL_SECONDS`   | `30`    | Health-check interval                   |
| `RECONCILIATION_WORKER_ENABLED`   | `true`  | Transaction reconciliation              |
| `RECONCILIATION_INTERVAL_SECONDS` | `60`    | Reconciliation scan interval            |
| `CLEANUP_WORKER_ENABLED`          | `true`  | Expired-session cleanup                 |
| `CLEANUP_INTERVAL_SECONDS`        | `300`   | Cleanup interval                        |

Workers run once when serving starts and then at the configured interval. The individual switches have no effect while `WORKERS_ENABLED` is `false`. Running more than one replica requires [assigning worker ownership](/server/deployment#assign-worker-ownership).

## Migrations and dashboard

| Variable            | Default      | Description                                         |
| ------------------- | ------------ | --------------------------------------------------- |
| `AUTO_MIGRATE`      | `true`       | Applies pending migrations at start-up              |
| `DASHBOARD_ENABLED` | `true`       | Serves the administration dashboard (`--dashboard`) |
| `DASHBOARD_PATH`    | `/dashboard` | URL prefix for the dashboard (`--dashboard-path`)   |

With `AUTO_MIGRATE=false` the server logs any pending migrations by name and starts without applying them. See [Control migrations](/server/deployment#control-migrations).

Booleans are parsed strictly: `true`, `false`, `1`, `0`, `t`, `f`. Anything else fails at start-up.

## Staging and production validation

Setting `APP_ENV` to `staging` or `production` rejects, at start-up:

- the default encryption key;
- OAuth secrets shorter than 32 characters or still carrying the `change-me-` prefix;
- an `APP_PUBLIC_URL` that does not begin with `https://`;
- `*` in `CORS_ALLOWED_ORIGINS`; and
- `DB_SSLMODE=disable` for any PostgreSQL host other than `db`, `localhost`, or `127.0.0.1`.

Validation messages name the underlying configuration field rather than the variable, so `Security.AdminOAuthSecret must be at least 32 non-default characters for production` refers to `ADMIN_OAUTH_SECRET`. The field names come from [the library's `Config`](/library/configuration), which the server populates from these variables.

These checks are a baseline, not a deployment policy. [Deploying the server](/server/deployment) covers the rest.
