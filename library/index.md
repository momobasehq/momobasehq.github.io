# Momobase Go package

<div style="display:flex;gap:1rem;">

[![Go reference](https://pkg.go.dev/badge/github.com/momobasehq/momobase.svg)](https://pkg.go.dev/github.com/momobasehq/momobase)

[![Latest release](https://img.shields.io/github/v/release/momobasehq/momobase?label=release)](https://github.com/momobasehq/momobase/releases/latest)

[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/momobasehq/momobase/blob/main/LICENSE.txt)

</div>

The Go package is the Momobase payment engine: the HTTP API, routing, reconciliation, the database schema, and the provider contracts. Embed it in your own Go program when you need provider adapters, hooks, or HTTP routes that the prebuilt [server](/server/) does not include. Otherwise, run the server — [compare the two](/guide/choose).

## What you need

- Go 1.25 or newer.
- The module `github.com/momobasehq/momobase`.
- At least one provider adapter to register, such as the built-in `dummy` simulator or an [official provider](/library/official-providers).

## Install

```sh
go get github.com/momobasehq/momobase@latest
```

## Run an instance

```go
instance, err := momobase.New(
	momobase.WithProvider("acme", acme.New),
)
if err != nil {
	log.Fatal(err)
}
defer func() { _ = instance.Close() }()

if err := instance.Run(); err != nil {
	log.Fatal(err)
}
```

## What your program provides

- **Configuration.** The package reads no environment variables or files. Pass a `momobase.Config` value, filled from wherever you keep settings. See [Configuration](/library/configuration).
- **Packaging and deployment.** You build and run the executable or container image yourself.

## Next

- [Embed an instance](/library/embedding) and control its lifecycle.
- [Configure it](/library/configuration) field by field.
- [Add hooks](/library/hooks) to reject or observe payments.
- [Build a provider adapter](/library/providers) for a payment rail.
- Look up the [Go API](/library/go-api) and the [provider API](/library/provider-api).
