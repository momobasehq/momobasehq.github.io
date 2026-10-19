---
sidebar: false
aside: false
---

# About Momobase

Momobase is an open-source, self-hosted payment service. Applications use one API for collections and disbursements. Provider adapters handle each provider's credentials, request formats, webhooks, and statuses.

## Who it's for

Teams that run their own services and have their own contracts with payment providers:

- **Application developers** integrate one payment API.
- **Operators** manage provider accounts, routes, health, and reconciliation.
- **Provider authors** write adapters for new payment providers.

## What it handles

- Application credentials, administrators, roles, and permissions
- Idempotent collections and disbursements
- Provider accounts with encrypted credentials, health checks, and routing
- Transaction statuses, webhooks, and reconciliation
- Audit records and a full Admin API

Momobase is not a payment provider, merchant of record, or order system. You keep the contract with each provider, and your application stays the source of truth for orders.

## Credits

Momobase is mobile money built the [PocketBase](https://pocketbase.io) way. Like PocketBase, it is:

- **One self-contained binary** with an embedded administration dashboard, served at `/_/`.
- **A Go package you can extend**, with hooks and your own routes, when the binary isn't enough.
- **Simple to host**: SQLite by default, and a public folder (`mb_public`, after PocketBase's `pb_public`) for your own static files.

Thanks to [Gani Georgiev and the PocketBase contributors](https://github.com/pocketbase/pocketbase) for the idea.

## Get started

- [What is Momobase?](/guide/)
- [Quickstart](/guide/quickstart)
- [Contributing](/contributing)

::: warning Project status
Momobase is early-stage software. Review its configuration, provider adapters, and failure behavior before moving real money.
:::
