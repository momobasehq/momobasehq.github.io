# Introduction

Momobase is an open-source, self-hosted payment service. Your applications send collections (money in) and disbursements (money out) to one API. Momobase sends each payment to a provider you have configured, such as MTN MoMo or Airtel Money, and tracks it until it reaches a final status.

You run Momobase yourself and keep your own contract with each provider. Momobase is not a payment provider, a merchant of record, or an order system.

::: warning Early-stage software
Momobase is under active development. Start in each provider's sandbox, and review the configuration and failure behavior before you move real money.
:::

## Run Momobase

Pick one method. Each gives you the API at `http://localhost:9090` and the dashboard at `http://localhost:9090/_/`.

### Docker

```sh
docker run -d --name momobase -p 9090:9090 -v momobase-data:/data ghcr.io/momobasehq/server:latest
docker exec momobase momobase seed-admin --email you@example.com --password 'change me'
```

The database lives in the `/data` volume. Image tags are `latest`, the full version (such as `0.4.1`), and the `0.4` and `0` prefixes, for `linux/amd64` and `linux/arm64`.

### Podman

```sh
podman run -d --name momobase -p 9090:9090 -v momobase-data:/data ghcr.io/momobasehq/server:latest
podman exec momobase momobase seed-admin --email you@example.com --password 'change me'
```

This works rootless. If `localhost:9090` resets the connection, use `127.0.0.1:9090` instead.

### Release binary

<DownloadButtons />

```sh
unzip momobase_<version>_<os>_<arch>.zip
./momobase seed-admin --email you@example.com --password 'change me'
./momobase serve
```

Each release has a `SHA256SUMS` file to check the archive against.

### Go install

```sh
go install github.com/momobasehq/server/cmd/momobase@latest
momobase seed-admin --email you@example.com --password 'change me'
momobase serve
```

`seed-admin` creates the first administrator, because the dashboard has no sign-up screen. Run `momobase --help` for every command.

## What's running

| Path                              | What it serves                                                    |
| --------------------------------- | ----------------------------------------------------------------- |
| `/_/`                             | The administration dashboard                                      |
| `/api/v1`                         | The application API: payments and transactions                    |
| `/api/admin`                      | The admin API: everything the dashboard does                      |
| `/webhooks/<provider-account-id>` | Callbacks from payment providers                                  |
| `/`                               | Files in an `mb_public` directory, or a redirect to the dashboard |

Data goes to a SQLite file, `./data/momobase.db` (`/data/momobase.db` in the container). A fresh install uses placeholder secrets. That is fine on your own machine; before anyone else can reach it, follow [Going to production](/guide/go-live).

## Server or Go package

What you installed above is **Momobase Server**: one binary with the official provider adapters and the dashboard, configured with environment variables.

The [Go package](/library/) is the same engine as a library. Use it when you need your own provider adapter, payment hooks, or HTTP routes. It has no dashboard. Both use the same API and database, so you can switch later.

## Next

- [Quickstart](/guide/quickstart): set up a provider and send a test payment in the dashboard.
- [Take payments](/guide/payments) from your backend.
