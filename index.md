---
layout: home

hero:
    name: Momobase
    text: Open-source payments backend in 1 file
    tagline: One self-hosted API for collections and disbursements across mobile money, bank, and card providers.
    image:
        src: /logo.svg
        alt: Momobase Logo
    actions:
        - theme: brand
          text: Get started
          link: /guide/
        - theme: alt
          text: Quickstart
          link: /guide/quickstart

features:
    - icon: 📦
      title: One binary
      details: The API, the official provider adapters, and an administration dashboard. Configure it with environment variables.
      link: /guide/
    - icon: 💳
      title: One payment API
      details: Your applications use one contract, with TypeScript and Python SDKs. Momobase handles each provider's credentials, payloads, and statuses.
      link: /guide/payments
    - icon: 🔀
      title: Routing and fallback
      details: Send each payment to a provider account by service, method, country, and currency, and fall back when one is down.
      link: /guide/providers
    - icon: 🐹
      title: Extend with Go
      details: Embed Momobase in your own Go program to add payment hooks, provider adapters, and HTTP routes.
      link: /library/
---
