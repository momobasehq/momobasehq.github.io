# Command-line interface

```sh
momobase serve                              # the default when no command is given
momobase seed-admin --email … --password …
momobase version
momobase self-update
momobase --help
```

## `serve`

Starts the HTTP API, the provider runtimes, the background workers, the dashboard, and the [public directory](/server/configuration#migrations-dashboard-and-the-public-directory). Runs until it receives `SIGINT` or `SIGTERM`, then shuts down gracefully.

| Flag               | Overrides           | Description                            |
| ------------------ | ------------------- | -------------------------------------- |
| `--addr`           | `APP_ADDR`          | Address the HTTP server listens on     |
| `--dashboard`      | `DASHBOARD_ENABLED` | Serve the administration dashboard     |
| `--dashboard-path` | `DASHBOARD_PATH`    | URL prefix for the dashboard           |
| `--public-dir`     | `PUBLIC_DIR`        | Directory served at `/` when it exists |

A flag overrides its variable only when you pass it. Set everything else with [environment variables](/server/configuration).

## `seed-admin`

Creates the first administrator and exits. Create later administrators in the dashboard or the Admin API.

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

- Without an email and password, it fails with `seed-admin needs --email and --password`.
- Running it again with the same email fails.
- It connects to the configured database and applies migrations, like `serve`.

## `version`

Prints the version.

```sh
$ momobase version
v0.4.1
```

A binary built with `go install` or `go build` prints `dev`.

## `self-update`

Replaces the binary with the latest release from GitHub. It takes no arguments.

```sh
$ momobase self-update
updating v0.4.0 -> v0.4.1
installed v0.4.1 at /usr/local/bin/momobase; restart momobase to run it
```

It downloads `momobase_<version>_<os>_<arch>.zip` for your platform, checks it against the release's `SHA256SUMS`, and replaces the binary. If the binary is a symlink, it replaces the file the link points to.

- It does not restart the server. Restart it yourself.
- If you already run the latest release, it prints `momobase v0.4.1 is already the latest release`.
- It needs write access to the binary's directory, and checks this before downloading.
- On a `dev` build, it fails with `self-update needs a released build, and this one carries no version`.
- In a container, it fails with `this binary runs in a container: pull a newer image instead`.
