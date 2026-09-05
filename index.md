---
layout: home

hero:
    name: Momobase
    text: Payment infrastructure you control
    tagline: One self-hosted API for collections, disbursements, routing, provider health, and reconciliation.
    image:
        src: /logo.svg
        alt: Momobase Logo
    actions:
        - theme: brand
          text: Get started
          link: /guide/getting-started
        - theme: alt
          text: API reference
          link: /api-reference
        - theme: alt
          text: TypeScript SDK
          link: /sdk/

features:
    - icon: 💳
      title: One payment API
      details: Give applications one contract while provider adapters handle credentials, payloads, and status models.
    - icon: 🏠
      title: Self-hosted
      details: Keep provider credentials, routing rules, and transaction data on infrastructure you operate.
    - icon: ⚙️
      title: Operational by default
      details: Route by service, method, country, currency, priority, and health, then reconcile unresolved transactions.
    - icon: 🚀
      title: Run your first payment
      details: Build a local Go host, provision the dummy provider, and create a collection from end to end.
      link: /guide/getting-started
    - icon: 🧩
      title: Build a provider
      details: Implement the small Go contracts that adapt an upstream payment API to Momobase.
      link: /guide/providers
    - icon: 📚
      title: Read the reference
      details: Look up configuration, Go APIs, provider contracts, HTTP conventions, and generated endpoints.
      link: /reference/configuration
---
