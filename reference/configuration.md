# Configuration reference

Momobase reads no environment variables and no configuration files. A `momobase.Config` value is the only source of settings, and the host application decides where its values come from.

`momobase.DefaultConfig()` returns a complete development baseline. Copy it, change what differs, and pass it to `momobase.New` with `momobase.WithConfig`:

```go
cfg := momobase.DefaultConfig()
cfg.App.Addr = ":8080"
cfg.Features.AutoMigrate = false

instance, err := momobase.New(
	momobase.WithConfig(cfg),
	momobase.WithProvider("acme", acme.New),
)
```

`New` uses `DefaultConfig()` when no `WithConfig` is supplied, so an instance starts unconfigured for local development. Every default is a development value: SQLite in `./data`, a placeholder encryption key, and placeholder token secrets. [Validation](#staging-and-production-validation) rejects all three once `App.Env` is `staging` or `production`.

`Config` is a plain struct of plain fields. There is no partial-configuration merge: a `momobase.Config{}` you build yourself gets Go zero values, not defaults, so start from `DefaultConfig()` unless you intend to set every field.

## Application

`Config.App`, type `momobase.AppConfig`.

| Field                | Type       | Default                 | Description                                                  |
| -------------------- | ---------- | ----------------------- | ------------------------------------------------------------ |
| `Name`               | `string`   | `momobase`              | Name reported by runtime metadata                            |
| `Env`                | `string`   | `development`           | Selects staging and production safety checks                 |
| `Addr`               | `string`   | `:9090`                 | Address passed to the Fiber listener                         |
| `PublicURL`          | `string`   | `http://localhost:9090` | Externally reachable base URL                                |
| `CORSAllowedOrigins` | `[]string` | `http://localhost:9090` | Browser origins allowed by CORS                              |
| `TrustedProxyCIDRs`  | `[]string` | empty                   | Proxy addresses or CIDRs trusted to supply forwarded headers |

Leave `TrustedProxyCIDRs` empty when no proxy sits in front of Momobase. When it is empty, rate limiting and request logs use the immediate peer address. Add only proxies you control because callers can forge forwarded headers.

`Env` is compared against `staging` and `production` exactly; any other value, including `test` or an empty string, skips the safety checks.

## Logging

`Config.Log`, type `momobase.LogConfig`.

| Field   | Type     | Default | Values                              |
| ------- | -------- | ------- | ----------------------------------- |
| `Level` | `string` | `info`  | `debug`, `info`, `warn`, or `error` |

Unknown log levels fall back to `info`. The default logger writes structured JSON to standard output. `momobase.WithLogger` replaces it with a host-owned `*slog.Logger`, in which case `Level` is not consulted.

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

An unrecognized `Type` fails construction. SQLite requires cgo and creates the parent directory of `Path`; the default path is relative, so it resolves against the host process's working directory. PostgreSQL sessions use UTC. MySQL uses `utf8mb4`, parses time values, and uses UTC.

`Port` defaults to the PostgreSQL port. Set it explicitly when using MySQL.

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

The three placeholder credentials are exported as `momobase.DefaultEncryptionMasterKeyBase64`, `momobase.DefaultAdminOAuthSecret`, and `momobase.DefaultAppOAuthSecret`, so a host can assert it replaced them.

### Generate the secrets

Generate all three with `openssl rand`:

```sh
$ openssl rand -base64 32
CqTb0+/Zt7WPMv7yEDCwyzVBJ0FSuqTNW1Ry8dTDRXg=

$ openssl rand -hex 32
0d17e4b5a1e88fd93b0ad38a7c4a2c65b32f5a08d5c4e2911fd60cbf8a37e4d2

$ openssl rand -hex 32
b9f52c1de6a03847ca9d1e7f0b52a4c8317de95b6a2f40d8ec713a5f9b0c26e7
```

Assign the first to `EncryptionMasterKeyBase64`, the second to `AdminOAuthSecret`, and the third to `AppOAuthSecret`:

```go
cfg.Security.EncryptionMasterKeyBase64 = "CqTb0+/Zt7WPMv7yEDCwyzVBJ0FSuqTNW1Ry8dTDRXg="
cfg.Security.AdminOAuthSecret = "0d17e4b5a1e88fd93b0ad38a7c4a2c65b32f5a08d5c4e2911fd60cbf8a37e4d2"
cfg.Security.AppOAuthSecret = "b9f52c1de6a03847ca9d1e7f0b52a4c8317de95b6a2f40d8ec713a5f9b0c26e7"
```

Read them from a secret manager in a real deployment. The values above are printed here only to show the shape of each one; never reuse them.

`openssl rand -base64 32` is the encryption key's exact requirement — 32 random bytes, base64-encoded — and anything that decodes to a different length fails construction:

```
encryption key must decode to exactly 32 bytes, got 24
```

The OAuth secrets are HMAC keys with no fixed length, so `-hex 32` and `-base64 32` both work. Each must be at least 32 characters or construction fails:

```
token secret must be at least 32 characters
```

Give the administrator and application secrets different values. One leaked secret then forges only its own audience's tokens.

Changing a signing secret invalidates tokens signed with the previous value. Losing or changing the encryption master key makes stored provider configuration unreadable, so back it up with the database.

Rotate a signing secret by assigning the new value and restarting; every issued token is rejected from that point, so callers reauthenticate. There is no dual-secret overlap window, and the encryption master key cannot be rotated this way: it decrypts existing provider configuration.

Durations are ordinary `time.Duration` values, so write them as `15 * time.Minute` rather than as a number of minutes.

## Workers

`Config.Workers`, type `momobase.WorkersConfig`.

| Field                    | Type            | Default     | Description                         |
| ------------------------ | --------------- | ----------- | ----------------------------------- |
| `Enabled`                | `bool`          | `true`      | Enables registration of all workers |
| `HealthEnabled`          | `bool`          | `true`      | Enables provider health checks      |
| `HealthInterval`         | `time.Duration` | 30 seconds  | Provider health-check interval      |
| `ReconciliationEnabled`  | `bool`          | `true`      | Enables transaction reconciliation  |
| `ReconciliationInterval` | `time.Duration` | 60 seconds  | Reconciliation scan interval        |
| `CleanupEnabled`         | `bool`          | `true`      | Enables expired-session cleanup     |
| `CleanupInterval`        | `time.Duration` | 300 seconds | Cleanup interval                    |

Workers run once when serving starts and then at the configured interval. Individual worker settings have no effect while `Enabled` is `false`.

Because the defaults enable every worker, a `Config` you assemble field by field disables all of them — another reason to start from `DefaultConfig()`.

## Features

`Config.Features`, type `momobase.FeaturesConfig`.

| Field         | Type   | Default | Description                                          |
| ------------- | ------ | ------- | ---------------------------------------------------- |
| `AutoMigrate` | `bool` | `true`  | Applies migrations while constructing a new instance |

Set `AutoMigrate` to `false` when deployment automation runs `instance.Migrate(ctx)` separately. With it disabled, `New` logs a warning naming any pending migrations rather than applying them.

## Read configuration from the environment

Momobase does not read the environment, but nothing stops a host from doing so. Read the values you care about and assign the fields:

```go
func config() (momobase.Config, error) {
	cfg := momobase.DefaultConfig()
	cfg.App.Env = "production"
	cfg.App.PublicURL = os.Getenv("PUBLIC_URL")
	cfg.App.CORSAllowedOrigins = strings.Split(os.Getenv("CORS_ORIGINS"), ",")

	cfg.DB = momobase.DatabaseConfig{
		Type:     "postgres",
		Host:     os.Getenv("PGHOST"),
		Port:     os.Getenv("PGPORT"),
		User:     os.Getenv("PGUSER"),
		Password: os.Getenv("PGPASSWORD"),
		Name:     os.Getenv("PGDATABASE"),
		SSLMode:  "require",
	}

	cfg.Security.EncryptionMasterKeyBase64 = os.Getenv("ENCRYPTION_MASTER_KEY_BASE64")
	cfg.Security.AdminOAuthSecret = os.Getenv("ADMIN_OAUTH_SECRET")
	cfg.Security.AppOAuthSecret = os.Getenv("APP_OAUTH_SECRET")

	return cfg, cfg.Validate()
}
```

The variable names, whether a `.env` file is loaded, and what an empty or malformed value means are all the host's decisions. Reach for a configuration library, flags, or a secret-manager client with the same pattern: build a `Config`, then pass it through `WithConfig`.

Call `cfg.Validate()` yourself when you want a configuration error before construction. `New` calls it regardless.

## Staging and production validation

When `App.Env` is `staging` or `production`, `Config.Validate` and therefore `momobase.New` reject:

- the default encryption key;
- OAuth secrets that are shorter than 32 characters or still carry the `change-me-` prefix;
- an `App.PublicURL` that does not begin with `https://`;
- `*` in `App.CORSAllowedOrigins`; and
- `DB.SSLMode` of `disable` for PostgreSQL hosts other than `db`, `localhost`, or `127.0.0.1`.

Validation errors name the Go field, such as `Security.AdminOAuthSecret must be at least 32 non-default characters for production`.

These checks are a baseline, not a complete deployment policy. Protect secrets, restrict network access, terminate TLS, back up the database and encryption key, and test provider failure behavior before moving money.

## Options that change configuration

| Option               | Effect                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `WithConfig(cfg)`    | Uses `cfg` instead of `DefaultConfig()`                                       |
| `WithConfigFunc(fn)` | Runs `fn` against the resolved configuration; functions run in supplied order |
| `WithAddr(addr)`     | Shorthand for a `WithConfigFunc` that sets `App.Addr`                         |

`WithConfig` is resolved before any mutator runs, so `WithAddr` and every `WithConfigFunc` apply on top of it regardless of argument order.
