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
          text: Run the server
          link: /server/
        - theme: brand
          text: Embed the library
          link: /library/
        - theme: alt
          text: Understand Momobase
          link: /guide/

features:
    - icon: 📦
      title: Momobase Server
      details: A container image and release binaries for Linux, macOS, and Windows. The HTTP API, its provider adapters, and an administration dashboard in one process.
      link: /server/install
    - icon: 🐹
      title: Go package
      details: Embed the payment engine in your own program to compile in provider adapters, payment hooks, and extra routes.
      link: /library/
    - icon: 🟦
      title: TypeScript SDK
      details: A dependency-free client for both the application and administration APIs, with token refresh handled for you.
      link: /sdk/
    - icon: 💳
      title: One payment API
      details: Applications get one contract while provider adapters absorb the credentials, payloads, and status models behind it.
      link: /guide/
    - icon: ⚙️
      title: Operational by default
      details: Route by service, method, country, currency, priority, and health, then reconcile whatever is left unresolved.
      link: /guide/routing
    - icon: 🧭
      title: Not sure which to install?
      details: The server and the library run the same engine. Compare what each one gives you before committing to either.
      link: /guide/choose
---
