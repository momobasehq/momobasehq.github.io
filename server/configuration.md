# Configure the server

The server reads its settings from environment variables. When the same setting comes from several places, the first one wins:

```
flags  >  environment  >  .env file  >  built-in defaults
```

To use a `.env` file, put it in the working directory. Start from `.env.example` in the server repository, which lists every variable with its default:

```sh
cp .env.example .env
```

Four settings also have a flag: `--addr`, `--dashboard`, `--dashboard-path`, and `--public-dir`. See [Command-line interface](/server/cli).

## Secrets

You must set these three before the server is reachable by anyone but you. With `APP_ENV=staging` or `production`, the server refuses to start until all three are set.

| Variable                       | Generate with             | Requirement                                             |
| ------------------------------ | ------------------------- | ------------------------------------------------------- |
| `ENCRYPTION_MASTER_KEY_BASE64` | `openssl rand -base64 32` | Must decode to exactly 32 bytes                         |
| `ADMIN_OAUTH_SECRET`           | `openssl rand -hex 32`    | At least 32 characters                                  |
| `APP_OAUTH_SECRET`             | `openssl rand -hex 32`    | At least 32 characters, different from the admin secret |

Generate each value once:

```sh
openssl rand -base64 32   # ENCRYPTION_MASTER_KEY_BASE64
openssl rand -hex 32      # ADMIN_OAUTH_SECRET
openssl rand -hex 32      # APP_OAUTH_SECRET
```

A key of the wrong length fails at start-up with `encryption key must decode to exactly 32 bytes, got 24`.

::: danger Back up the encryption key with the database
Provider account configuration is encrypted with `ENCRYPTION_MASTER_KEY_BASE64`. If you lose the key, you must re-enter every provider account's configuration. You cannot change the key on an existing database.
:::

To rotate `ADMIN_OAUTH_SECRET` or `APP_OAUTH_SECRET`, set the new value and restart. All existing tokens stop working, and callers must sign in again.

## Application

| Variable               | Default                 | Description                                                                                                                  |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`             | `momobase`              | Name reported by runtime metadata                                                                                            |
| `APP_ENV`              | `development`           | `staging` or `production` turns on the [start-up checks](#staging-and-production-validation). Any other value turns them off |
| `APP_ADDR`             | `:9090`                 | Listen address (`--addr`)                                                                                                    |
| `APP_PUBLIC_URL`       | `http://localhost:9090` | URL that callers use to reach the server; must be `https://` in production                                                   |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:9090` | Comma-separated browser origins allowed to call the API                                                                      |
| `TRUSTED_PROXY_CIDRS`  | empty                   | Comma-separated addresses or CIDRs of proxies in front of the server                                                         |
| `LOG_LEVEL`            | `info`                  | `debug`, `info`, `warn`, or `error`; unknown values become `info`                                                            |

Set `TRUSTED_PROXY_CIDRS` when the server is behind a proxy or load balancer, and list only proxies you control. Leave it empty when nothing is in front of the server. If you leave it empty behind a proxy, every client shares one rate limit.

## Database

| Variable      | Default              | Description                                       |
| ------------- | -------------------- | ------------------------------------------------- |
| `DB_TYPE`     | `sqlite`             | `sqlite`, `postgres`, or `mysql`                  |
| `DB_PATH`     | `./data/momobase.db` | SQLite file; `/data/momobase.db` in the container |
| `DB_HOST`     | `localhost`          | PostgreSQL or MySQL host                          |
| `DB_PORT`     | `5432`               | PostgreSQL or MySQL port; set `3306` for MySQL    |
| `DB_USER`     | `momobase`           | PostgreSQL or MySQL user                          |
| `DB_PASSWORD` | empty                | PostgreSQL or MySQL password                      |
| `DB_NAME`     | `momobase`           | PostgreSQL or MySQL database                      |
| `DB_SSLMODE`  | `disable`            | PostgreSQL TLS mode; use `require` over a network |

`DB_PATH` is relative to the working directory, and the server creates its parent directory. An unknown `DB_TYPE` fails at start-up.

## Tokens

| Variable                   | Default      | Description                                 |
| -------------------------- | ------------ | ------------------------------------------- |
| `ADMIN_ACCESS_TTL_MINUTES` | `15`         | Administrator access-token lifetime         |
| `ADMIN_REFRESH_TTL_HOURS`  | `24`         | Administrator refresh-token lifetime        |
| `APP_ACCESS_TTL_MINUTES`   | `30`         | Application access-token lifetime           |
| `APP_REFRESH_TTL_HOURS`    | `24`         | Application refresh-token lifetime          |
| `APP_CLIENT_ID_PREFIX`     | `app_client` | Prefix for generated application client IDs |
| `APP_CLIENT_SECRET_PREFIX` | `mb_test`    | Prefix for generated client secrets         |

Lifetimes are whole positive numbers. Any other value fails at start-up.

## Workers

| Variable                          | Default | Description                            |
| --------------------------------- | ------- | -------------------------------------- |
| `WORKERS_ENABLED`                 | `true`  | Turns all background workers on or off |
| `HEALTH_WORKER_ENABLED`           | `true`  | Provider health checks                 |
| `HEALTH_CHECK_INTERVAL_SECONDS`   | `30`    | Health-check interval                  |
| `RECONCILIATION_WORKER_ENABLED`   | `true`  | Transaction reconciliation             |
| `RECONCILIATION_INTERVAL_SECONDS` | `60`    | Reconciliation interval                |
| `CLEANUP_WORKER_ENABLED`          | `true`  | Expired-session cleanup                |
| `CLEANUP_INTERVAL_SECONDS`        | `300`   | Cleanup interval                       |

With `WORKERS_ENABLED=false`, the individual switches do nothing. If you run more than one replica, enable workers on exactly one. See [Assign worker ownership](/server/deployment#assign-worker-ownership).

## Migrations, dashboard, and the public directory

| Variable            | Default     | Description                                              |
| ------------------- | ----------- | -------------------------------------------------------- |
| `AUTO_MIGRATE`      | `true`      | Applies pending migrations at start-up                   |
| `DASHBOARD_ENABLED` | `true`      | Serves the administration dashboard (`--dashboard`)      |
| `DASHBOARD_PATH`    | `/_`        | URL prefix for the dashboard (`--dashboard-path`)        |
| `PUBLIC_DIR`        | `mb_public` | Directory of static files served at `/` (`--public-dir`) |

- `PUBLIC_DIR` is relative to the working directory. Put any static site in it, such as a landing page or a checkout. Its files cannot replace `/api`, `/webhooks`, or the dashboard path. A path with no matching file returns 404.
- When `PUBLIC_DIR` does not exist, `/` redirects to the dashboard. With the dashboard also turned off, `/` returns 404.
- With `AUTO_MIGRATE=false`, the server logs pending migrations and starts without applying them. See [Control migrations](/server/deployment#control-migrations).

Booleans accept only `true`, `false`, `1`, `0`, `t`, and `f`. Anything else fails at start-up.

## Staging and production validation

With `APP_ENV` set to `staging` or `production`, the server refuses to start if any of these are true:

- `ENCRYPTION_MASTER_KEY_BASE64` is the default key.
- An OAuth secret is shorter than 32 characters or starts with `change-me-`.
- `APP_PUBLIC_URL` does not start with `https://`.
- `CORS_ALLOWED_ORIGINS` contains `*`.
- `DB_SSLMODE=disable` with a PostgreSQL host other than `db`, `localhost`, or `127.0.0.1`.

Error messages use the [Go `Config`](/library/configuration) field name, not the variable name. For example, `Security.AdminOAuthSecret must be at least 32 non-default characters for production` refers to `ADMIN_OAUTH_SECRET`.

These checks are a minimum. Use the [go-live checklist](/guide/go-live) before taking real payments.
