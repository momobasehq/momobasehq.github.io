---
sidebar: false
---

# Develop and test Momobase

Momobase is split across four repositories.

| Repository                                                                   | Contents                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`momobase`](https://github.com/momobasehq/momobase)                         | The Go package: payment engine, HTTP API, migrations |
| [`server`](https://github.com/momobasehq/server)                             | The runnable distribution and the dashboard          |
| [`sdk`](https://github.com/momobasehq/sdk)                                   | The TypeScript client                                |
| [`momobasehq.github.io`](https://github.com/momobasehq/momobasehq.github.io) | This documentation site                              |

## Go package

Use the Go version declared in `go.mod`, plus Git, Make, and GolangCI-Lint. SQLite is pure Go, so no C compiler is needed.

```sh
make fmt-check
make test
make coverage
make vet
make lint
```

`make quality` runs formatting, vet, tests, and lint. CI also runs shuffled whole-module coverage and the race detector.

## Server

The server pins a released `momobase` version and embeds a dashboard bundle built with pnpm, so the dashboard must be built before the Go binary.

```sh
make dashboard
make quality
make build
```

`make quality` runs `fmt-check`, `vet`, and the race-detector tests. `providers/providers.go` is the single place where a compiled adapter is registered or removed.

Tagging `vX.Y.Z` cross-compiles six `momobase_<version>_<os>_<arch>.zip` archives, publishes a multi-architecture image to `ghcr.io/momobasehq/server`, and regenerates the changelog.

## TypeScript SDK

Use Node.js 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

Releases run through `release-it`, which tags `v${version}` and publishes `momobase` to npm.

## Documentation

Use the same Node.js and pnpm versions, then run:

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run build
```

The site uses VitePress. Keep tutorials, task-focused how-to guides, conceptual explanations, and reference pages distinct in purpose. Mermaid source belongs only where a flow or relationship is clearer than prose.

Each section owns its own scope: the guide explains the model, `/server/` and `/library/` each document their own installation and configuration, `/sdk/` documents the client, and `/api/` documents the wire contract. When a fact belongs to two sections, put it in one and link from the other.

## Publish the OpenAPI contract

Swagger annotations live beside the Go handlers in `momobase`, which is where the HTTP API is defined for both the server and any program embedding the library. Pushing a semantic-version tag there generates `swagger.json` and `swagger.yaml` and publishes them to `https://momobasehq.github.io/momobase/`. The [OpenAPI explorer](/api-reference) reads that tagged contract directly.

Run `make docs` in the Go repository for a local preview when `swag` is installed.
