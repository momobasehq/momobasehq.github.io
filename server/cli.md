# Command-line interface

```sh
momobase serve                              # also what a bare `momobase` does
momobase seed-admin --email … --password …
momobase version
momobase --help
```

The binary serves when given no subcommand, which is why the container image can set `momobase` as its entrypoint and `serve` as its command without the two conflicting. A mistyped subcommand is rejected rather than silently accepted as an argument.

## `serve`

Starts the HTTP API, the provider runtimes, the background workers, and — unless disabled — the dashboard. Runs until `SIGINT` or `SIGTERM`, then shuts down gracefully.

| Flag               | Overrides           | Description                              |
| ------------------ | ------------------- | ---------------------------------------- |
| `--addr`           | `APP_ADDR`          | Address the HTTP server listens on       |
| `--dashboard`      | `DASHBOARD_ENABLED` | Serve the administration dashboard       |
| `--dashboard-path` | `DASHBOARD_PATH`    | URL prefix the dashboard is served under |

Only flags you actually type take effect, so an absent flag leaves the environment value alone rather than overwriting it with a flag default. Everything else is configured through [environment variables](/server/configuration).

Flags are applied before validation, so a flag cannot smuggle in a setting the environment alone would have been rejected for.

## `seed-admin`

Creates the first administrator and exits. Nothing else can create one: the Admin API needs an administrator to authenticate as.

```sh
momobase seed-admin \
	--email you@example.com \
	--password 'change me' \
	--name 'Your Name'
```

| Flag         | Falls back to    | Default         |
| ------------ | ---------------- | --------------- |
| `--email`    | `ADMIN_EMAIL`    | required        |
| `--password` | `ADMIN_PASSWORD` | required        |
| `--name`     | `ADMIN_NAME`     | `Administrator` |

Without an email and password from either source the command fails with `seed-admin needs --email and --password`.

This command is **not idempotent** — running it twice with the same address fails on the uniqueness constraint. It connects to the configured database and applies migrations like `serve` does, but never mounts the dashboard. Create further administrators through the Admin API or the dashboard.

## `version`

Prints the version stamped at build time.

```sh
$ momobase version
v0.1.0
```

Release archives and container images carry a real version. A binary built with `go install` or `go build` reports `dev`.
