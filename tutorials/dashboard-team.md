# Give a teammate limited access

Every administrator holds one role, and a role is a set of permissions. In this tutorial you create a support role that can read payments and reissue credentials but change nothing else, and give it to a new teammate.

This takes about five minutes and continues from [Set up payments in the dashboard](/tutorials/dashboard-setup).

## 1. Review the built-in roles

Select **Roles**. Three system roles exist and cannot be edited:

| Role          | Grants                                                    |
| ------------- | --------------------------------------------------------- |
| `super_admin` | Everything, including permissions added by later releases |
| `operations`  | Read everything and query provider balances; no changes   |
| `read_only`   | Read everything except provider balances                  |

The administrator you seeded holds `super_admin`.

## 2. Create a support role

1. Select **New role**.
2. Enter the name `support` and the description `Read transactions and reissue credentials`. A role's name cannot be changed later.
3. Check these permissions:
    - `transactions:read`
    - `apps:read`
    - `credentials:read`
    - `credentials:update`
4. Select **Create**.

`credentials:update` allows rotating and revoking credentials, but not creating new ones.

## 3. Add the teammate

1. Select **Users**, then **New administrator**.
2. Enter the email `support@example.com`, a password, and choose the **Support** role.
3. Select **Create**.

## 4. Sign in as the teammate

Open a private browser window, so your own session stays signed in, and sign in to `http://localhost:9090/_/` as `support@example.com`.

### Checkpoint

The sidebar shows only **Transactions** and **Apps**. The screens a role cannot read are hidden. Open **Tutorial checkout**: **Rotate** is available on the credential, while **New credential** and **Edit** are disabled, with a tooltip naming the permission each needs.

## 5. Change the role

Back in your own window, select **Change role** on the teammate's row and choose **Read only**. Their next request uses the new role; they stay signed in.

To remove access entirely, select **Deactivate**. **Set password** also signs them out of every session.

## Recap

You granted a teammate exactly what their job needs. Roles take effect on the next request, so you can tighten access without waiting for anyone to sign out.

## Next

- Look up permission codes and the admin API in [Administration client](/sdk/admin-client#manage-access).
