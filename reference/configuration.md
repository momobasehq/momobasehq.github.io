# Configuration reference

Momobase reads configuration from environment variables when `momobase.New` is called without `momobase.WithConfig`. `momobase.LoadConfig` exposes the same loading behavior to host applications.

## Application

| Environment variable   | Go field                 | Default                 | Description                                                                  |
| ---------------------- | ------------------------ | ----------------------- | ---------------------------------------------------------------------------- |
| `APP_NAME`             | `App.Name`               | `momobase`              | Name reported by runtime metadata                                            |
| `APP_ENV`              | `App.Env`                | `development`           | Environment used for staging and production safety checks                    |
| `APP_ADDR`             | `App.Addr`               | `:9090`                 | Address passed to the Fiber listener                                         |
| `APP_PUBLIC_URL`       | `App.PublicURL`          | `http://localhost:9090` | Externally reachable base URL                                                |
| `CORS_ALLOWED_ORIGINS` | `App.CORSAllowedOrigins` | `http://localhost:9090` | Comma-separated browser origins allowed by CORS                              |
| `TRUSTED_PROXY_CIDRS`  | `App.TrustedProxyCIDRs`  | empty                   | Comma-separated proxy addresses or CIDRs trusted to supply `X-Forwarded-For` |

Leave `TRUSTED_PROXY_CIDRS` empty when no proxy sits in front of Momobase. When it is empty, rate limiting and request logs use the immediate peer address. Add only proxies you control because callers can forge forwarded headers.

## Logging

| Environment variable | Go field    | Default | Values                              |
| -------------------- | ----------- | ------- | ----------------------------------- |
| `LOG_LEVEL`          | `Log.Level` | `info`  | `debug`, `info`, `warn`, or `error` |

Unknown log levels fall back to `info`. The default logger writes structured JSON to standard output. `momobase.WithLogger` replaces it with a host-owned `*slog.Logger`.

## Database

| Environment variable | Go field      | Default              | Description                              |
| -------------------- | ------------- | -------------------- | ---------------------------------------- |
| `DB_TYPE`            | `DB.Type`     | `sqlite`             | `sqlite`, `postgres`, or `mysql`         |
| `DB_PATH`            | `DB.Path`     | `./data/momobase.db` | SQLite database path                     |
| `DB_HOST`            | `DB.Host`     | `localhost`          | PostgreSQL or MySQL host                 |
| `DB_PORT`            | `DB.Port`     | `5432`               | PostgreSQL or MySQL port                 |
| `DB_USER`            | `DB.User`     | `momobase`           | PostgreSQL or MySQL user                 |
| `DB_PASSWORD`        | `DB.Password` | empty                | PostgreSQL or MySQL password             |
| `DB_NAME`            | `DB.Name`     | `momobase`           | PostgreSQL or MySQL database             |
| `DB_SSLMODE`         | `DB.SSLMode`  | `disable`            | PostgreSQL TLS mode passed to the driver |

SQLite requires cgo and creates the parent directory of `DB_PATH`. PostgreSQL sessions use UTC. MySQL uses `utf8mb4`, parses time values, and uses UTC.

`DB_PORT` defaults to the PostgreSQL port. Set it explicitly when using MySQL.

## Security and tokens

| Environment variable           | Go field                             | Default                        | Description                                   |
| ------------------------------ | ------------------------------------ | ------------------------------ | --------------------------------------------- |
| `ENCRYPTION_MASTER_KEY_BASE64` | `Security.EncryptionMasterKeyBase64` | Development-only zero key      | Base64-encoded 32-byte AES master key         |
| `ADMIN_OAUTH_SECRET`           | `Security.AdminOAuthSecret`          | `change-me-admin-oauth-secret` | HS256 signing secret for administrator tokens |
| `APP_OAUTH_SECRET`             | `Security.AppOAuthSecret`            | `change-me-app-oauth-secret`   | HS256 signing secret for application tokens   |
| `ADMIN_ACCESS_TTL_MINUTES`     | `Security.AdminAccessTTL`            | `15`                           | Administrator access-token lifetime           |
| `ADMIN_REFRESH_TTL_HOURS`      | `Security.AdminRefreshTTL`           | `24`                           | Administrator refresh-token lifetime          |
| `APP_ACCESS_TTL_MINUTES`       | `Security.AppAccessTTL`              | `30`                           | Application access-token lifetime             |
| `APP_REFRESH_TTL_HOURS`        | `Security.AppRefreshTTL`             | `24`                           | Application refresh-token lifetime            |
| `APP_CLIENT_ID_PREFIX`         | `Security.AppClientIDPrefix`         | `app_client`                   | Prefix for generated application client IDs   |
| `APP_CLIENT_SECRET_PREFIX`     | `Security.AppClientSecretPrefix`     | `mb_test`                      | Prefix for generated client secrets           |

Generate an encryption key with:

```sh
openssl rand -base64 32
```

OAuth secrets must contain at least 32 non-whitespace characters. The built-in OAuth placeholders are intentionally too short, so set both values even in development. Changing a signing secret invalidates tokens signed with the previous value. Losing or changing the encryption master key makes stored provider configuration unreadable, so back it up with the database.

## Workers

| Environment variable              | Go field                         | Default | Unit    | Description                         |
| --------------------------------- | -------------------------------- | ------- | ------- | ----------------------------------- |
| `WORKERS_ENABLED`                 | `Workers.Enabled`                | `true`  | —       | Enables registration of all workers |
| `HEALTH_WORKER_ENABLED`           | `Workers.HealthEnabled`          | `true`  | —       | Enables provider health checks      |
| `HEALTH_CHECK_INTERVAL_SECONDS`   | `Workers.HealthInterval`         | `30`    | seconds | Provider health-check interval      |
| `RECONCILIATION_WORKER_ENABLED`   | `Workers.ReconciliationEnabled`  | `true`  | —       | Enables transaction reconciliation  |
| `RECONCILIATION_INTERVAL_SECONDS` | `Workers.ReconciliationInterval` | `60`    | seconds | Reconciliation scan interval        |
| `CLEANUP_WORKER_ENABLED`          | `Workers.CleanupEnabled`         | `true`  | —       | Enables expired-session cleanup     |
| `CLEANUP_INTERVAL_SECONDS`        | `Workers.CleanupInterval`        | `300`   | seconds | Cleanup interval                    |

Workers run once when serving starts and then at the configured interval. Individual worker settings have no effect while `WORKERS_ENABLED=false`.

## Features

| Environment variable | Go field               | Default | Description                                          |
| -------------------- | ---------------------- | ------- | ---------------------------------------------------- |
| `AUTO_MIGRATE`       | `Features.AutoMigrate` | `true`  | Applies migrations while constructing a new instance |

Set `AUTO_MIGRATE=false` when deployment automation runs `instance.Migrate(ctx)` separately.

## Parsing rules

- Boolean values use Go's `strconv.ParseBool` forms. Invalid explicit values stop startup.
- Duration variables accept positive integers in the unit named by the variable. Zero, negative, and non-integer values stop startup.
- Comma-separated lists are trimmed and empty entries are removed.
- Empty environment variables use their defaults. Use explicit Go configuration when an empty string must be significant.

## Staging and production validation

When `APP_ENV` is `staging` or `production`, startup rejects:

- the default encryption key;
- default or shorter-than-32-character OAuth secrets;
- an `APP_PUBLIC_URL` that does not begin with `https://`;
- wildcard CORS origins; and
- `DB_SSLMODE=disable` for PostgreSQL hosts other than `db`, `localhost`, or `127.0.0.1`.

These checks are a baseline, not a complete deployment policy. Protect secrets, restrict network access, terminate TLS, back up the database and encryption key, and test provider failure behavior before moving money.

## Configure in Go

The root package exports aliases for every configuration group:

```go
cfg, err := momobase.LoadConfig()
if err != nil {
	return err
}

cfg.App.Addr = ":8080"
cfg.Features.AutoMigrate = false

instance, err := momobase.New(
	momobase.WithConfig(cfg),
	momobase.WithProvider("acme", acme.New),
)
```

Use `WithConfigFunc` for a small ordered override. All supplied mutators run after the resolved `WithConfig` value or environment configuration.
