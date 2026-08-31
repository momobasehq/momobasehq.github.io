# Develop and test Momobase

This guide covers the repositories for the Go service and dashboard (`momobase`), SDK (`sdk`), and documentation (`momobasehq.github.io`).

## Install the toolchain

Use the Go version and toolchain declared in `go.mod`, Node.js 22 or later, pnpm 11, Git, Make, and a C compiler for SQLite.

Install optional repository tools when you need their targets:

- `golangci-lint` for `make lint`;
- `goreleaser` for release checks and snapshots; and
- `swag` for regenerating the API specification.

## Start the service

```sh
cp .env.example .env
make run
```

`make run` installs web dependencies, builds the embedded dashboard, and starts the Go service. Use the [local setup guide](/guide/getting-started) to migrate, seed an administrator, and configure the dummy provider.

## Work on a web project

Install and run the dashboard from the `momobase` repository:

```sh
pnpm -C web install --frozen-lockfile
pnpm -C web --filter @momobase/dashboard dev
```

Run the documentation from this repository:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Run `pnpm install --frozen-lockfile` and `pnpm build` from the `sdk` repository to build the SDK.

## Regenerate the API specification

Swagger annotations live beside the Go handlers. After changing an endpoint or schema, run this from a `momobase` checkout beside this repository:

```sh
swag init -g ./cmd/momobase/main.go --parseInternal --output ../momobasehq.github.io/public --outputTypes json,yaml
```

The command writes `swagger.json` and `swagger.yaml` to `public`. The VitePress API page loads `/swagger.yaml`.

## Run checks

Use the smallest check that covers your change, then run the broader suite before submitting it:

| Change | Check |
| --- | --- |
| Go formatting | `make fmt-check` |
| Go behavior | `make test` |
| Go static analysis | `make vet` and `make lint` |
| Dashboard types | `make web-typecheck` |
| SDK package | `pnpm build` in `sdk` |
| Documentation | `pnpm build` in `momobasehq.github.io` |
| API smoke path | `make smoke-api` |
| Full backend smoke path | `make smoke` |

`make quality` runs formatting checks, vet, tests, and lint. Go targets build the dashboard first because its output is embedded in every binary.

## Build a release artifact

Run `make release-check` to validate the GoReleaser configuration. Run `make snapshot` to build local release artifacts without publishing them; arm64 cross-compilation requires the toolchain noted in the Makefile.

For container changes, build the root `Dockerfile`. Its web stage builds the dashboard before the Go stage embeds it.
