# Configure the library

A `momobase.Config` value is the only source of settings. The library reads no environment variables or files; your program fills the fields from wherever it keeps settings. [Momobase Server](/server/configuration) maps its environment variables onto these same fields.

Start from `momobase.DefaultConfig()`, change what you need, and pass it with `momobase.WithConfig`:

```go
cfg := momobase.DefaultConfig()
cfg.App.Addr = ":8080"
cfg.Features.AutoMigrate = false

instance, err := momobase.New(
	momobase.WithConfig(cfg),
	momobase.WithProvider("acme", acme.New),
)
```

- Without `WithConfig`, `New` uses `DefaultConfig()`.
- Every default is a development value: SQLite in `./data`, a placeholder encryption key, and placeholder token secrets. [Validation](#staging-and-production-validation) rejects the placeholders when `App.Env` is `staging` or `production`.
- Fields are not merged with defaults. A `momobase.Config{}` literal has Go zero values: no database type, no migrations, no workers.

Before going to production, work through the [Go live](/guide/go-live) checklist.

## Application

`Config.App`, type `momobase.AppConfig`.

| Field                | Type       | Default                 | Description                                                                 |
| -------------------- | ---------- | ----------------------- | --------------------------------------------------------------------------- |
| `Name`               | `string`   | `momobase`              | Name reported by runtime metadata                                           |
| `Env`                | `string`   | `development`           | `staging` or `production` (exact match) turns on the safety checks          |
| `Addr`               | `string`   | `:9090`                 | Listen address                                                              |
| `PublicURL`          | `string`   | `http://localhost:9090` | Externally reachable base URL; must be `https://` in staging and production |
| `CORSAllowedOrigins` | `[]string` | `http://localhost:9090` | Browser origins allowed by CORS                                             |
| `TrustedProxyCIDRs`  | `[]string` | empty                   | Proxy addresses or CIDRs trusted to send forwarded headers                  |
| `PublicDir`          | `string`   | `mb_public`             | Directory of static files served at `/`                                     |

- `TrustedProxyCIDRs`: leave empty when no proxy sits in front. Behind a proxy, list only proxies you control.
- `PublicDir`: resolved against the working directory. A missing directory is normal; `/` is then free for [your own route](/library/embedding#extend-the-fiber-application). Set `""` to serve nothing. Static files never shadow API routes. `instance.PublicDir()` returns the directory actually served, or `""`.

## Logging

`Config.Log`, type `momobase.LogConfig`.

| Field   | Type     | Default | Values                              |
| ------- | -------- | ------- | ----------------------------------- |
| `Level` | `string` | `info`  | `debug`, `info`, `warn`, or `error` |

Unknown levels become `info`. The default logger writes JSON to standard output. `momobase.WithLogger` replaces it with your own `*slog.Logger`, and `Level` is then ignored.

## Database

`Config.DB`, type `momobase.DatabaseConfig`.

| Field      | Type     | Default              | Description                              |
| ---------- | -------- | -------------------- | ---------------------------------------- |
| `Type`     | `string` | `sqlite`             | `sqlite`, `postgres`, or `mysql`         |
| `Path`     | `string` | `./data/momobase.db` | SQLite database path                     |
| `Host`     | `string` | `localhost`          | PostgreSQL or MySQL host                 |
| `Port`     | `string` | `5432`               | PostgreSQL or MySQL port                 |
| `User`     | `string` | `momobase`           | PostgreSQL or MySQL user                 |
| `Password` | `string` | empty                | PostgreSQL or MySQL password             |
| `Name`     | `string` | `momobase`           | PostgreSQL or MySQL database             |
| `SSLMode`  | `string` | `disable`            | PostgreSQL TLS mode passed to the driver |

- An unknown `Type` fails construction.
- SQLite is pure Go (no cgo). Momobase creates the parent directory of `Path`; a relative path resolves against the working directory.
- Set `Port` to `3306` for MySQL. The default is the PostgreSQL port.
- PostgreSQL and MySQL sessions use UTC. MySQL uses `utf8mb4`.

## Security and tokens

`Config.Security`, type `momobase.SecurityConfig`.

| Field                       | Type            | Default                   | Description                                   |
| --------------------------- | --------------- | ------------------------- | --------------------------------------------- |
| `EncryptionMasterKeyBase64` | `string`        | Development zero key      | Base64-encoded 32-byte AES master key         |
| `AdminOAuthSecret`          | `string`        | `change-me-admin-oauth-…` | HS256 signing secret for administrator tokens |
| `AppOAuthSecret`            | `string`        | `change-me-app-oauth-…`   | HS256 signing secret for application tokens   |
| `AdminAccessTTL`            | `time.Duration` | 15 minutes                | Administrator access-token lifetime           |
| `AdminRefreshTTL`           | `time.Duration` | 24 hours                  | Administrator refresh-token lifetime          |
| `AppAccessTTL`              | `time.Duration` | 30 minutes                | Application access-token lifetime             |
| `AppRefreshTTL`             | `time.Duration` | 24 hours                  | Application refresh-token lifetime            |
| `AppClientIDPrefix`         | `string`        | `app_client`              | Prefix for generated application client IDs   |
| `AppClientSecretPrefix`     | `string`        | `mb_test`                 | Prefix for generated client secrets           |

Durations are `time.Duration` values, for example `15 * time.Minute`.

The placeholders are exported as `momobase.DefaultEncryptionMasterKeyBase64`, `momobase.DefaultAdminOAuthSecret`, and `momobase.DefaultAppOAuthSecret`, so you can check that you replaced them.

### Supply the secrets

Replace all three before setting `App.Env` to `staging` or `production`:

```go
cfg.Security.EncryptionMasterKeyBase64 = secrets.EncryptionKey
cfg.Security.AdminOAuthSecret = secrets.AdminOAuthSecret
cfg.Security.AppOAuthSecret = secrets.AppOAuthSecret
```

| Field                       | Requirement                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `EncryptionMasterKeyBase64` | Must decode to exactly 32 bytes, or `New` fails with `encryption key must decode to exactly 32 bytes` |
| `AdminOAuthSecret`          | At least 32 characters                                                                                |
| `AppOAuthSecret`            | At least 32 characters, different from `AdminOAuthSecret`                                             |

To generate them, see [Secrets](/server/configuration#secrets). Back up the encryption key with the database: without it, stored provider configuration cannot be decrypted.

## Workers

`Config.Workers`, type `momobase.WorkersConfig`.

| Field                    | Type            | Default     | Description                    |
| ------------------------ | --------------- | ----------- | ------------------------------ |
| `Enabled`                | `bool`          | `true`      | Master switch for all workers  |
| `HealthEnabled`          | `bool`          | `true`      | Provider health checks         |
| `HealthInterval`         | `time.Duration` | 30 seconds  | Provider health-check interval |
| `ReconciliationEnabled`  | `bool`          | `true`      | Transaction reconciliation     |
| `ReconciliationInterval` | `time.Duration` | 60 seconds  | Reconciliation scan interval   |
| `CleanupEnabled`         | `bool`          | `true`      | Expired-session cleanup        |
| `CleanupInterval`        | `time.Duration` | 300 seconds | Cleanup interval               |

Workers run once when serving starts, then at each interval. The individual switches do nothing while `Enabled` is `false`. With several replicas, enable workers on exactly one.

## Features

`Config.Features`, type `momobase.FeaturesConfig`.

| Field         | Type   | Default | Description                     |
| ------------- | ------ | ------- | ------------------------------- |
| `AutoMigrate` | `bool` | `true`  | Applies migrations during `New` |

With `AutoMigrate` set to `false`, `New` logs pending migrations by name and does not apply them. Run `instance.Migrate(ctx)` yourself.

## Staging and production validation

When `App.Env` is `staging` or `production`, `Config.Validate` (called by `New`) rejects:

- the default encryption key;
- OAuth secrets shorter than 32 characters or starting with `change-me-`;
- an `App.PublicURL` that does not start with `https://`;
- `*` in `App.CORSAllowedOrigins`;
- `DB.SSLMode` set to `disable` for a PostgreSQL host other than `db`, `localhost`, or `127.0.0.1`.

Errors name the Go field, for example `Security.AdminOAuthSecret must be at least 32 non-default characters for production`.

Call `cfg.Validate()` yourself to catch errors before `New`. To change a resolved configuration with options, see [Options](/library/go-api#options).
