# Develop and test Momobase

Momobase is split across the Go package (`momobase`), TypeScript client (`sdk`), and documentation (`momobasehq.github.io`) repositories.

## Go package

Use the Go version declared in `go.mod`, Git, Make, a C compiler for SQLite, and GolangCI-Lint.

```sh
make fmt-check
make test
make coverage
make vet
make lint
```

`make quality` runs formatting, vet, tests, and lint. CI also runs shuffled whole-module coverage and the race detector.

## TypeScript SDK

Use Node.js 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run build
```

## Documentation

Use the same Node.js and pnpm versions, then run:

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run build
```

## Publish the OpenAPI contract

Swagger annotations live beside the Go handlers. Pushing a semantic-version tag in `momobase` generates `swagger.json` and `swagger.yaml`, then publishes them to `https://momobasehq.github.io/momobase/`. The API reference reads that tagged contract directly.

Run `make docs` in the Go repository for a local preview when `swag` is installed.
