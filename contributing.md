---
sidebar: false
---

# Contributing

## Repositories

| Repository                                                                   | Contents                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`momobase`](https://github.com/momobasehq/momobase)                         | The Go package: payment engine, HTTP API, migrations            |
| [`server`](https://github.com/momobasehq/server)                             | The runnable server and the dashboard                           |
| [`providers`](https://github.com/momobasehq/providers)                       | The official provider adapters                                  |
| [`sdk`](https://github.com/momobasehq/sdk)                                   | The TypeScript SDK                                              |
| [`sdk-python`](https://github.com/momobasehq/sdk-python)                     | The Python SDK                                                  |
| [`mockpay`](https://github.com/momobasehq/mockpay)                           | A local mock of the MTN MoMo and Airtel Money APIs, for testing |
| [`momobasehq.github.io`](https://github.com/momobasehq/momobasehq.github.io) | This documentation site                                         |

## Go package

You need the Go version in `go.mod`, Git, Make, and GolangCI-Lint. No C compiler is needed.

```sh
make quality   # formatting, vet, tests, and lint
```

The individual targets are `make fmt-check`, `make test`, `make coverage`, `make vet`, and `make lint`.

To preview the OpenAPI contract, install `swag` and run `make docs`. Pushing a version tag publishes `swagger.json` to `https://momobasehq.github.io/momobase/`, which the [OpenAPI explorer](/api-reference) reads.

## Server

Build the dashboard before the Go binary:

```sh
make dashboard
make quality   # fmt-check, vet, and race-detector tests
make build
```

Register or remove a compiled provider adapter in `providers/providers.go`. Pushing a `vX.Y.Z` tag builds the release archives and the container image.

## Official providers

Adapters have not all been tested against real merchant accounts. If you have one, [TESTING.md](https://github.com/momobasehq/providers/blob/main/TESTING.md) explains what to test and how to report it.

## TypeScript SDK

You need Node.js 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

## Python SDK

You need Python 3.11 or newer and [uv](https://docs.astral.sh/uv/).

```sh
uv sync
uv run ruff format
uv run ruff check
uv run pytest
uv build
```

## Documentation

You need Node.js 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm run dev            # preview at http://localhost:5173
pnpm run format:check
pnpm run lint
pnpm run build
```

Writing rules:

- Start task pages with **What you need**, then numbered steps, then the expected result.
- Put reference material in tables.
- Leave out background and design notes unless they change what the reader does.
- Document each fact on one page and link to it from others.
- Use a Mermaid diagram only when it is clearer than text.
