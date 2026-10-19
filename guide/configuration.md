# Configuration

Momobase Server reads environment variables. The Go package reads none: set the matching field on a `momobase.Config` instead.

The defaults are for development: SQLite in `./data` and placeholder secrets. Before going live, follow [Going to production](/guide/go-live).

## Server

When a setting comes from several places, the first one wins:

```text
flags  >  environment  >  .env file  >  defaults
```

Put a `.env` file in the working directory. The [server repository](https://github.com/momobasehq/server) has an `.env.example` to start from. `momobase serve` has four flags: `--addr`, `--dashboard`, `--dashboard-path`, and `--public-dir`.

Booleans accept `true`, `false`, `1`, or `0`. An invalid value stops the server at start-up.

## Go package

Start from `DefaultConfig()`, change what you need, and pass it with `WithConfig`:

```go
cfg := momobase.DefaultConfig()
cfg.App.Env = "production"
cfg.Security.EncryptionMasterKeyBase64 = secrets.EncryptionKey

instance, err := momobase.New(momobase.WithConfig(cfg), momobase.WithProvider("dummy", dummy.New))
```

Don't start from a `momobase.Config{}` literal: its zero values mean no database type, no migrations, and no workers. Durations are `time.Duration` values, such as `15 * time.Minute`.

## Application

| Variable               | `Config` field           | Default                 | Description                                                   |
| ---------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------- |
| `APP_ENV`              | `App.Env`                | `development`           | `staging` or `production` turns on the start-up safety checks |
| `APP_ADDR`             | `App.Addr`               | `:9090`                 | Listen address                                                |
| `APP_PUBLIC_URL`       | `App.PublicURL`          | `http://localhost:9090` | URL callers use to reach Momobase                             |
| `CORS_ALLOWED_ORIGINS` | `App.CORSAllowedOrigins` | `http://localhost:9090` | Browser origins allowed to call the API, comma-separated      |
| `TRUSTED_PROXY_CIDRS`  | `App.TrustedProxyCIDRs`  | empty                   | Addresses or CIDRs of proxies in front, comma-separated       |
| `PUBLIC_DIR`           | `App.PublicDir`          | `mb_public`             | Static files served at `/`, if the directory exists           |
| `APP_NAME`             | `App.Name`               | `momobase`              | Name reported in runtime metadata                             |
| `LOG_LEVEL`            | `Log.Level`              | `info`                  | `debug`, `info`, `warn`, or `error`                           |

In the container, the working directory is `/home/momobase`, so mount static files at `/home/momobase/mb_public`.

## Secrets

| Variable                       | `Config` field                       | Requirement                                     |
| ------------------------------ | ------------------------------------ | ----------------------------------------------- |
| `ENCRYPTION_MASTER_KEY_BASE64` | `Security.EncryptionMasterKeyBase64` | Decodes to exactly 32 bytes                     |
| `ADMIN_OAUTH_SECRET`           | `Security.AdminOAuthSecret`          | At least 32 characters                          |
| `APP_OAUTH_SECRET`             | `Security.AppOAuthSecret`            | At least 32 characters, unlike the admin secret |

To generate them, see [Replace the secrets](/guide/go-live#_2-replace-the-secrets). Changing an OAuth secret signs everyone out.

## Database

| Variable      | `Config` field | Default              | Description                                         |
| ------------- | -------------- | -------------------- | --------------------------------------------------- |
| `DB_TYPE`     | `DB.Type`      | `sqlite`             | `sqlite`, `postgres`, or `mysql`                    |
| `DB_PATH`     | `DB.Path`      | `./data/momobase.db` | SQLite file. In the container, `/data/momobase.db`  |
| `DB_HOST`     | `DB.Host`      | `localhost`          | PostgreSQL or MySQL host                            |
| `DB_PORT`     | `DB.Port`      | `5432`               | PostgreSQL or MySQL port. Set `3306` for MySQL      |
| `DB_USER`     | `DB.User`      | `momobase`           | PostgreSQL or MySQL user                            |
| `DB_PASSWORD` | `DB.Password`  | empty                | PostgreSQL or MySQL password                        |
| `DB_NAME`     | `DB.Name`      | `momobase`           | PostgreSQL or MySQL database                        |
| `DB_SSLMODE`  | `DB.SSLMode`   | `disable`            | PostgreSQL TLS mode. Use `require` across a network |

## Tokens

| Variable                   | `Config` field                   | Default      |
| -------------------------- | -------------------------------- | ------------ |
| `ADMIN_ACCESS_TTL_MINUTES` | `Security.AdminAccessTTL`        | `15`         |
| `ADMIN_REFRESH_TTL_HOURS`  | `Security.AdminRefreshTTL`       | `24`         |
| `APP_ACCESS_TTL_MINUTES`   | `Security.AppAccessTTL`          | `30`         |
| `APP_REFRESH_TTL_HOURS`    | `Security.AppRefreshTTL`         | `24`         |
| `APP_CLIENT_ID_PREFIX`     | `Security.AppClientIDPrefix`     | `app_client` |
| `APP_CLIENT_SECRET_PREFIX` | `Security.AppClientSecretPrefix` | `mb_test`    |

## Workers

Workers check provider health, follow up on unfinished payments, and remove expired sessions.

| Variable                          | `Config` field                   | Default |
| --------------------------------- | -------------------------------- | ------- |
| `WORKERS_ENABLED`                 | `Workers.Enabled`                | `true`  |
| `HEALTH_WORKER_ENABLED`           | `Workers.HealthEnabled`          | `true`  |
| `HEALTH_CHECK_INTERVAL_SECONDS`   | `Workers.HealthInterval`         | `30`    |
| `RECONCILIATION_WORKER_ENABLED`   | `Workers.ReconciliationEnabled`  | `true`  |
| `RECONCILIATION_INTERVAL_SECONDS` | `Workers.ReconciliationInterval` | `60`    |
| `CLEANUP_WORKER_ENABLED`          | `Workers.CleanupEnabled`         | `true`  |
| `CLEANUP_INTERVAL_SECONDS`        | `Workers.CleanupInterval`        | `300`   |

With `WORKERS_ENABLED=false`, no worker runs.

## Migrations and dashboard

| Variable            | `Config` field         | Default | Description                           |
| ------------------- | ---------------------- | ------- | ------------------------------------- |
| `AUTO_MIGRATE`      | `Features.AutoMigrate` | `true`  | Apply database migrations at start-up |
| `DASHBOARD_ENABLED` | Server only            | `true`  | Serve the dashboard                   |
| `DASHBOARD_PATH`    | Server only            | `/_`    | URL path of the dashboard             |

With `AUTO_MIGRATE=false`, Momobase logs pending migrations and starts without them. In Go, apply them with `instance.Migrate(ctx)`.
