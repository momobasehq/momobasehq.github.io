# Choose your integration

Momobase ships as three things. Which you need depends on whether you are running the service, extending it, or calling it.

| You want to                                 | Use                         |
| ------------------------------------------- | --------------------------- |
| Run Momobase as a service                   | [Momobase Server](/server/) |
| Compile your own provider adapters or hooks | [The Go package](/library/) |
| Call a running instance from an application | [The TypeScript SDK](/sdk/) |

The SDK is not an alternative to the other two — it is how an application talks to whichever one you run.

## Server or library

Both run the same payment engine, the same HTTP API, and the same database schema. The server is the library with a command-line interface, environment configuration, and a dashboard wrapped around it.

|                          | [Server](/server/)                           | [Library](/library/)                   |
| ------------------------ | -------------------------------------------- | -------------------------------------- |
| Install                  | Container image or a release binary          | `go get`, then write `main()`          |
| Go toolchain             | Not needed                                   | Required                               |
| Configuration            | Environment variables and `.env`             | A `momobase.Config` value in your code |
| Provider adapters        | Only those compiled into the published build | Any adapter you register               |
| Hooks and custom routes  | Not available                                | Available                              |
| Administration dashboard | Included                                     | Not included                           |
| Executable and image     | Published for you                            | Yours to build                         |
| Upgrades                 | Pull a new tag                               | Bump the module and rebuild            |

**Start with the server.** It is the shorter path to a running instance, and the dashboard makes provisioning visible while you are learning the model. The published build registers the deterministic `dummy` provider, so you can drive a payment end to end before holding any real credentials.

**Move to the library when you hit one of its walls.** Provider adapters are compiled in, not loaded at runtime, so a rail that nobody has upstreamed means either forking the server repository and rebuilding, or embedding the library and keeping your own `main()`. Hooks and extra Fiber routes are library-only for the same reason.

Nothing is lost by starting with the server: the API, the database schema, and the configuration fields are identical, so moving to the library later is a packaging change rather than a migration.

## Next

- [Understand Momobase](/guide/) before installing anything.
- [Install the server](/server/install), or [embed the library](/library/embedding).
- [Create your first payment](/guide/first-payment) once either one is running.
