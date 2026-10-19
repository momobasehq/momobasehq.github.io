# Tutorials

Short, hands-on lessons. Each one runs against a local server and the `dummy` provider, so no money moves.

## Use Momobase

These run in the administration dashboard. Do the first one first: the others reuse the application, provider account, and route it creates.

| Tutorial                                                       | You learn                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Set up payments in the dashboard](/tutorials/dashboard-setup) | Applications, credentials, provider accounts, routes, test payment |
| [Add a backup provider](/tutorials/dashboard-fallback)         | Failing over between provider accounts with route priority         |
| [Monitor payments and providers](/tutorials/dashboard-monitor) | Where to look when a payment or provider misbehaves                |
| [Give a teammate limited access](/tutorials/dashboard-team)    | Administrators, roles, and permissions                             |

## Build with Momobase

These add code. The SDK and webhook tutorials need [Set up payments in the dashboard](/tutorials/dashboard-setup) first. The two hook tutorials build their own Go program and use the [Quickstart](/guide/quickstart) instead.

| Tutorial                                                            | You learn                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Take payments from a Node.js backend](/tutorials/sdk-checkout)     | The TypeScript SDK, idempotency, and waiting for an outcome |
| [Settle a pending payment with a webhook](/tutorials/webhook)       | Settling a payment with a signed provider webhook           |
| [Reject large payments with a hook](/tutorials/payment-limit)       | Rejecting payments in Go before routing                     |
| [Notify your backend of payment changes](/tutorials/notify-backend) | Pushing status changes to another service from Go           |

Prefer the command line? The [Quickstart](/guide/quickstart) does the dashboard setup with `curl`.
