# Tutorials

Short, hands-on lessons. Each one teaches one part of Momobase by doing it, against a local server and the deterministic `dummy` provider, so no money moves.

## Use Momobase

These run entirely in the administration dashboard. Start with the first one: the others build on the app, provider account, and route it creates.

| Tutorial                                                       | You learn                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| [Set up payments in the dashboard](/tutorials/dashboard-setup) | Apps, credentials, provider accounts, routes, test payments |
| [Add a backup provider](/tutorials/dashboard-fallback)         | How route priority fails over between provider accounts     |
| [Monitor payments and providers](/tutorials/dashboard-monitor) | Where to look when a payment or provider misbehaves         |
| [Give a teammate limited access](/tutorials/dashboard-team)    | Administrators, roles, and permissions                      |

## Build with Momobase

These add code. They assume you have finished [Set up payments in the dashboard](/tutorials/dashboard-setup), except where a tutorial builds its own program.

| Tutorial                                                            | You learn                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Take payments from a Node.js backend](/tutorials/sdk-checkout)     | The TypeScript SDK, idempotency, and waiting for an outcome |
| [Settle a pending payment with a webhook](/tutorials/webhook)       | How a signed provider callback moves a payment forward      |
| [Reject large payments with a hook](/tutorials/payment-limit)       | Enforcing your own policy in Go, before routing             |
| [Notify your backend of payment changes](/tutorials/notify-backend) | Pushing status changes to another service from Go           |

Prefer the command line? [Create your first payment](/guide/first-payment) does the dashboard setup with `curl` instead.
