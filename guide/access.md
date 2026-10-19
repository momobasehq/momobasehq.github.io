# Access control

Applications sign in with credentials limited by scopes. People sign in as administrators limited by roles.

## Application credentials

Each credential belongs to one application. Create, rotate, and revoke them on the application's **Credentials** tab.

| Scope                  | Allows                              |
| ---------------------- | ----------------------------------- |
| `collections:create`   | Create collections                  |
| `disbursements:create` | Create disbursements                |
| `transactions:read`    | Read the application's transactions |
| `*`                    | Everything above                    |

Listing payment methods needs no scope.

- The client secret is shown only once. If you lose it, rotate the credential.
- Revoking a credential, or disabling its application, takes effect immediately, even for unexpired tokens.
- Give each backend its own credential with only the scopes it needs.

## Administrators and roles

Every administrator holds one role, and a role is a set of permissions. The first administrator, created with `seed-admin`, holds `super_admin`. These built-in roles can't be edited:

| Role          | Grants                                                    |
| ------------- | --------------------------------------------------------- |
| `super_admin` | Everything, including permissions added by later releases |
| `operations`  | Read everything and query provider balances; no changes   |
| `read_only`   | Read everything except provider balances                  |

To give someone less, create a role:

1. Select **Roles**, then **New role**. You can't rename it later.
2. Check its permissions, such as `transactions:read` and `credentials:update`, and select **Create**.
3. Select **Users**, then **New administrator**, and choose the role.

The dashboard shows each administrator only what their role allows. A role change applies to their next request. To remove access, select **Deactivate**; **Set password** also signs them out everywhere.

## Token lifetimes

Access tokens last 15 minutes for administrators and 30 for applications. Refresh tokens last 24 hours. The SDKs refresh them for you. To change these, see [Configuration](/guide/configuration#tokens).
