---
layout: home

hero:
    name: Momobase
    text: Payment infrastructure you control
    tagline: One self-hosted API for collections and disbursements across mobile money, bank, and card providers.
    image:
        src: /logo.svg
        alt: Momobase Logo
    actions:
        - theme: brand
          text: Quickstart
          link: /guide/quickstart
        - theme: alt
          text: What is Momobase?
          link: /guide/
        - theme: alt
          text: Choose your integration
          link: /guide/choose

features:
    - icon: 📦
      title: Run the server
      details: One binary or container image with the API, the official provider adapters, and an administration dashboard. Configure it with environment variables.
      link: /server/install
    - icon: 🐹
      title: Embed the Go package
      details: Build Momobase into your own Go program to add provider adapters, payment hooks, and HTTP routes.
      link: /library/
    - icon: 🧩
      title: Call it from your app
      details: TypeScript and Python SDKs for the payment and administration APIs. They handle tokens for you.
      link: /sdk/
    - icon: 💳
      title: One payment API
      details: Your applications use one contract. Provider adapters handle each provider's credentials, payloads, and statuses.
      link: /guide/
    - icon: 🔀
      title: Routing and fallback
      details: Send each payment to a provider account by service, method, country, currency, priority, and health.
      link: /guide/routing
    - icon: ✅
      title: Go live
      details: One checklist of everything a production instance needs.
      link: /guide/go-live
---
