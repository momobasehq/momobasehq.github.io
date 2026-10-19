# Official providers

<div style="display:flex;gap:1rem;">

[![Go reference](https://pkg.go.dev/badge/github.com/momobasehq/providers.svg)](https://pkg.go.dev/github.com/momobasehq/providers)

[![Latest release](https://img.shields.io/github/v/release/momobasehq/providers?label=release)](https://github.com/momobasehq/providers/releases/latest)

[![Build](https://img.shields.io/github/actions/workflow/status/momobasehq/providers/ci.yml?branch=main&label=build)](https://github.com/momobasehq/providers/actions/workflows/ci.yml)

[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/momobasehq/providers/blob/main/LICENSE.txt)

</div>

[`github.com/momobasehq/providers`](https://github.com/momobasehq/providers) contains the provider adapters maintained with Momobase. [Momobase Server](/server/) already includes all of them. In your own Go program, add only the ones you register.

| Code          | Provider     | Collections        | Disbursements | Verified webhooks | Configuration keys                                                                       |
| ------------- | ------------ | ------------------ | ------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `mtn`         | MTN MoMo     | Mobile money       | Mobile money  | No                | [`mtn`](https://github.com/momobasehq/providers/blob/main/mtn/README.md)                 |
| `airtel`      | Airtel Money | Mobile money       | Mobile money  | No                | [`airtel`](https://github.com/momobasehq/providers/blob/main/airtel/README.md)           |
| `yopayments`  | Yo! Payments | Mobile money       | Mobile money  | No                | [`yopayments`](https://github.com/momobasehq/providers/blob/main/yopayments/README.md)   |
| `marzpay`     | MarzPay      | Mobile money, card | Mobile money  | Yes               | [`marzpay`](https://github.com/momobasehq/providers/blob/main/marzpay/README.md)         |
| `flutterwave` | Flutterwave  | Mobile money       | Mobile money  | Yes               | [`flutterwave`](https://github.com/momobasehq/providers/blob/main/flutterwave/README.md) |

Each README lists the provider's configuration keys, an example configuration, and a registration snippet.

::: warning Under testing
Most adapters have not yet run against a real merchant account in every market. Start in each provider's sandbox. MarzPay has no sandbox: its adapter always calls the live API. [TESTING.md](https://github.com/momobasehq/providers/blob/main/TESTING.md) explains what to test and how to report results.
:::

## What you need

- A Go program that [embeds an instance](/library/embedding).
- Go 1.25 or newer.
- A merchant or sandbox account with each provider you register.

## Register an adapter

1. Add the provider package:

    ```sh
    go get github.com/momobasehq/providers/mtn
    ```

2. Register it. The code you register under is the `provider_code` used when creating a provider account:

    ```go
    package main

    import (
    	"log"

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
    		log.Fatal(err)
    	}
    	defer func() { _ = instance.Close() }()

    	if err := instance.Run(); err != nil {
    		log.Fatal(err)
    	}
    }
    ```

3. Create a provider account for the code with the keys from its README, then test it, activate it, and add a route.

An adapter is constructed only when a provider account exists for its code, so registering unused adapters costs nothing.

## Configuration

Configuration is stored, encrypted, on the provider account. Momobase passes the account's `environment` to the adapter, and it overrides any `environment` key in the configuration. It selects the sandbox or live default for any `base_url` you leave unset.

To support a provider not listed here, [build a provider adapter](/library/providers).
