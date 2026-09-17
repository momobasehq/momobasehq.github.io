# Official providers

[`github.com/momobasehq/providers`](https://github.com/momobasehq/providers) is the set of provider adapters maintained alongside Momobase. Each adapter is its own package, so an application compiles only the providers it registers.

```sh
go get github.com/momobasehq/providers/mtn
```

Each provider documents its own configuration keys, an example configuration, and its registration snippet. Those documents live in the repository and are updated with the adapters, so they are the authoritative reference:

| Provider     | Collections        | Disbursements | Verified webhooks | Documentation                                                                            |
| ------------ | ------------------ | ------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| MTN MoMo     | Mobile money       | Mobile money  | No                | [`mtn`](https://github.com/momobasehq/providers/blob/main/mtn/README.md)                 |
| Airtel Money | Mobile money       | Mobile money  | No                | [`airtel`](https://github.com/momobasehq/providers/blob/main/airtel/README.md)           |
| Yo! Payments | Mobile money       | Mobile money  | No                | [`yopayments`](https://github.com/momobasehq/providers/blob/main/yopayments/README.md)   |
| MarzPay      | Mobile money, card | Mobile money  | Yes               | [`marzpay`](https://github.com/momobasehq/providers/blob/main/marzpay/README.md)         |
| Flutterwave  | Mobile money       | Mobile money  | Yes               | [`flutterwave`](https://github.com/momobasehq/providers/blob/main/flutterwave/README.md) |

## Register an adapter

Registration is the same as for any adapter. The name a provider is registered under is the provider code an operator selects when creating a provider account:

```go
package main

import (
	"github.com/momobasehq/momobase"
	"github.com/momobasehq/providers/airtel"
	"github.com/momobasehq/providers/mtn"
)

func main() {
	instance, err := momobase.New(
		momobase.WithProvider("mtn", mtn.New),
		momobase.WithProvider("airtel", airtel.New),
	)
	if err != nil {
		panic(err)
	}
	defer instance.Close()
}
```

Registering an adapter costs nothing at runtime. It is constructed only when an operator creates a provider account for its code, and configured only from that account.

[Momobase Server](/server/) ships with all of these registered already, so an operator only has to create the provider account.

## Configuration

Provider account configuration is stored in Momobase and passed to the adapter when it starts. `environment` is supplied by Momobase and is authoritative — it selects the sandbox or live defaults for any `base_url` left unset.

Keys differ per provider; see the documentation column above.

## Testing and contributions

Most of these adapters have not been exercised against a real merchant account in every market they target. [TESTING.md](https://github.com/momobasehq/providers/blob/main/TESTING.md) explains what most needs testing and how to report results.

To write an adapter for a provider that is not listed, see [Build a provider adapter](/library/providers).
