# TypeScript SDK

`momobase` is a typed client for the Momobase application and administration APIs. Use it when a TypeScript service or trusted web application should call Momobase without managing HTTP envelopes and access-token refresh directly.

## Choose a client

| Client                | Use it for                                                                       | Credential                                                  |
| --------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `MomobaseClient`      | Listing payment methods, creating payments, and reading application transactions | Application client ID and secret                            |
| `MomobaseAdminClient` | Managing operators, applications, providers, routes, and system data             | Administrator email and password, or an existing token pair |

Both clients use the global `fetch()` implementation available in modern browsers and Node.js. They return the `data` value from Momobase response envelopes and throw `MomobaseAPIError` for unsuccessful HTTP responses.

::: warning Keep application secrets on a trusted server
`MomobaseClient` holds an application client secret. Do not include that secret in a public browser or mobile bundle. Call it from a backend-for-frontend or another trusted service.
:::

## Authentication behavior

Both clients authenticate lazily on the first API call. They cache access and refresh tokens in memory, refresh shortly before expiry, share one refresh operation across concurrent requests, and retry one request after an HTTP `401`.

`MomobaseClient` can authenticate again with its fixed client credential. `MomobaseAdminClient` can fall back to password authentication only when email and password were configured.

## Package exports

The package exports:

- `MomobaseClient` and `MomobaseAdminClient`;
- `MomobaseAPIError`;
- API request, response, session, and resource types;
- `AdminPermissions`, `AppScopes`, and `PermissionWildcard`; and
- `permitted`, which checks a permission list and honors the wildcard.

Use the exported constants when building permission-aware interfaces, but retrieve the server's permission catalogue when an interface must support newer server permissions.

## Continue

- [Install and configure the SDK](/sdk/installation).
- [Create and query payments](/sdk/application-client).
- [Manage Momobase](/sdk/admin-client).
- [Understand sessions and token refresh](/sdk/sessions).
- [Handle errors and cancellation](/sdk/errors).

For endpoints not wrapped by the SDK, use the [API reference](/api-reference).
