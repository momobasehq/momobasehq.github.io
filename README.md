# Momobase Documentation

[![Deploy docs to GitHub Pages](https://github.com/momobasehq/momobasehq.github.io/actions/workflows/site-pages.yml/badge.svg)](https://github.com/momobasehq/momobasehq.github.io/actions/workflows/site-pages.yml)

[Read the documentation](https://momobase.dev/).

## Develop

You need Node.js 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm run dev            # preview at http://localhost:5173
pnpm run format:check
pnpm run lint
pnpm run build
```

## Writing rules

- Write for people using Momobase, not building it. Leave out internals.
- Start task pages with **What you need**, then numbered steps, then the expected result.
- Put reference material in tables.
- Document each fact on one page and link to it from others.
