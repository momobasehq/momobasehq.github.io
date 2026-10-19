# Give a teammate limited access

Create a support role that can read payments and reissue credentials, and give it to a new administrator.

## What you need

- The setup from [Set up payments in the dashboard](/tutorials/dashboard-setup).
- About five minutes.

## 1. Review the built-in roles

Select **Roles**. Every administrator holds one role, and a role is a set of permissions. These system roles cannot be edited:

| Role          | Grants                                                    |
| ------------- | --------------------------------------------------------- |
| `super_admin` | Everything, including permissions added by later releases |
| `operations`  | Read everything and query provider balances; no changes   |
| `read_only`   | Read everything except provider balances                  |

The administrator you seeded holds `super_admin`.

## 2. Create a support role

1. Select **New role**.
2. Enter the name `support` and the description `Read transactions and reissue credentials`. You cannot rename a role later.
3. Check these permissions:
    - `transactions:read`
    - `apps:read`
    - `credentials:read`
    - `credentials:update`
4. Select **Create**.

`credentials:update` allows rotating and revoking credentials, not creating them.

## 3. Add the teammate

1. Select **Users**, then **New administrator**.
2. Enter the email `support@example.com`, a password, and choose the **Support** role.
3. Select **Create**.

## 4. Sign in as the teammate

Open a private browser window and sign in to `http://localhost:9090/_/` as `support@example.com`.

The sidebar shows only **Transactions** and **Apps**. Open **Tutorial checkout**: **Rotate** is available on the credential, while **New credential** and **Edit** are disabled, with a tooltip naming the permission each needs.

## 5. Change the role

In your own window, select **Change role** on the teammate's row and choose **Read only**. The change applies to their next request; they stay signed in.

To remove access, select **Deactivate**. **Set password** also signs them out of every session.

## Next

- Manage administrators and roles from code with an [SDK](/sdk/).
- Look up the Admin API in the [OpenAPI explorer](/api-reference).
