# Deploy a host application

Momobase is a Go package, so the application embedding it owns the executable, container image, process manager, and deployment topology.

## Configure explicitly

Use `momobase.LoadConfig()` for environment-driven hosts or construct `momobase.Config` directly and pass it through `momobase.WithConfig`. Production and staging configurations reject default secrets, insecure public URLs, wildcard CORS, and remote PostgreSQL without TLS.

The complete environment baseline lives in [`.env.example`](https://github.com/momobasehq/momobase/blob/main/.env.example). Host applications decide whether and how to load `.env` files.

## Control migrations

`Features.AutoMigrate` defaults to `true`. For controlled deployments, set it to `false` and run `instance.Migrate(ctx)` from a single migration process before serving traffic.

Back up the database and encryption key before applying a new release. Schema migrations do not provide automatic down migrations.

## Own the lifecycle

Call `instance.Serve(ctx)` when the host already manages cancellation, or `instance.Run()` for interrupt and termination signal handling. Always call `instance.Close()` after a successful `New`.

SQLite requires cgo. Applications using PostgreSQL or MySQL control their own build settings.

## Operate safely

- Keep encryption and OAuth secrets outside source control.
- Terminate TLS before the API and set the public URL to HTTPS.
- Trust forwarded client addresses only from proxies listed in `TrustedProxyCIDRs`.
- Run migrations once before rolling out multiple application replicas.
- Assign background-worker ownership deliberately when running more than one replica.
- Monitor `/ping`, `/healthz`, provider health, reconciliation, and audit logs.
