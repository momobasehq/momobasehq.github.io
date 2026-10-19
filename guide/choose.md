# Choose your integration

| You want to                                                                         | Use                                                 |
| ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| Run Momobase as a service                                                           | [Momobase Server](/server/)                         |
| Build Momobase into a Go program, with your own provider adapters, hooks, or routes | [Go package](/library/)                             |
| Call Momobase from your application                                                 | [An SDK](/sdk/) or the [HTTP API](/api/conventions) |

Your application uses an SDK or the HTTP API with either the server or the Go package.

## Server or Go package

Both run the same engine, HTTP API, and database schema. You can switch later without migrating data.

|                                 | [Server](/server/)                                                                                                  | [Go package](/library/)                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Install                         | Container image or release binary                                                                                   | `go get`, then write `main()`          |
| You need                        | Docker, or nothing for the binary                                                                                   | Go 1.25 or newer                       |
| Configuration                   | Environment variables or a `.env` file                                                                              | A `momobase.Config` value in your code |
| Provider adapters               | `dummy` plus the [official providers](/library/official-providers): MTN, Airtel, Yo! Payments, MarzPay, Flutterwave | Any adapter you register               |
| Payment hooks and custom routes | No                                                                                                                  | Yes                                    |
| Administration dashboard        | Included                                                                                                            | Not included                           |
| Upgrades                        | Pull a new image or run `momobase self-update`                                                                      | Update the module and rebuild          |

**Start with the server** unless you need something only the Go package offers: a provider that isn't built in, [payment hooks](/library/hooks), or [extra HTTP routes](/library/embedding#extend-the-fiber-application).

## Next

- [Quickstart](/guide/quickstart) with the server.
- [Embed an instance](/library/embedding) with the Go package.
