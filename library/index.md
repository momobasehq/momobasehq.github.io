# Momobase Go package

[![Go reference](https://pkg.go.dev/badge/github.com/momobasehq/momobase.svg)](https://pkg.go.dev/github.com/momobasehq/momobase)
[![Latest release](https://img.shields.io/github/v/release/momobasehq/momobase?label=release)](https://github.com/momobasehq/momobase/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/momobasehq/momobase/blob/main/LICENSE.txt)

```sh
go get github.com/momobasehq/momobase@latest
```

The library is the payment engine itself: the HTTP API, the routing and reconciliation services, the database schema, and the provider contracts. [Momobase Server](/server/) is this package with a command-line interface, environment configuration, and a dashboard wrapped around it.

Embed the library when you need adapters, hooks, or routes that a prebuilt binary cannot carry:

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

## What the host owns

The library reads no environment variables and no configuration files. A `momobase.Config` value is the only source of settings, and where those values come from is your program's decision — flags, a config file, a secret manager, or the environment.

The host also owns the executable, the container image, the process manager, and the deployment topology. That is the trade: full control, and the packaging work that comes with it. If you want the packaging done for you, [run the server](/server/) instead — [compare the two](/guide/choose).

## Next

- [Embed an instance](/library/embedding) and control its lifecycle.
- [Configure it](/library/configuration) field by field.
- [Add hooks](/library/hooks) to reject or observe payments in process.
- [Build a provider adapter](/library/providers) for a payment rail.
- Look up the [Go API](/library/go-api) and the [provider API](/library/provider-api).
