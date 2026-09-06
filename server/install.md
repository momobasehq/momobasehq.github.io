# Install Momobase Server

Every install path below produces the same thing: an API on `http://localhost:9090` and a dashboard on `http://localhost:9090/dashboard/`. Pick whichever suits your platform, then [create your first payment](/guide/first-payment).

A fresh install starts on development placeholders and a local SQLite file. That is deliberate — it lets you exercise the whole system before holding any real credentials. Set the [three secrets](/server/configuration#secrets) before it is anything but a local trial.

## Download a release

<DownloadButtons />

Archives contain the `momobase` binary, the licence, and the README. Verify one against `SHA256SUMS` before running it:

```sh
sha256sum --check --ignore-missing SHA256SUMS
```

Then unpack it, create an administrator, and start serving:

```sh
unzip momobase_v0.1.0_linux_amd64.zip
./momobase seed-admin --email you@example.com --password 'change me'
./momobase serve
```

`seed-admin` runs once and fails if the address already exists. See [Command-line interface](/server/cli) for the rest.

## Docker

```sh
docker run -d \
	--name momobase \
	-p 9090:9090 \
	-v momobase-data:/data \
	ghcr.io/momobasehq/server:latest
```

The image stores its SQLite database in the `/data` volume and exposes `9090`. Seed the administrator in a second command:

```sh
docker exec momobase momobase seed-admin \
	--email you@example.com --password 'change me'
```

Published tags are `latest`, the full version (`0.1.0`), and the rolling `0.1` and `0` prefixes. Images are built for `linux/amd64` and `linux/arm64`. Note that image tags carry no `v` prefix, while release archives do.

## Docker Compose

The repository ships a PostgreSQL compose file. Clone it if that is the database you want:

```sh
git clone https://github.com/momobasehq/server.git
cd server
cp .env.example .env
```

Otherwise write your own. Only the database settings differ between the three — the image, the port, the secrets, and the `/data` volume are the same either way.

::: code-group

```yaml [SQLite]
services:
    momobase:
        image: ghcr.io/momobasehq/server:latest
        restart: unless-stopped
        ports:
            - "9090:9090"
        environment:
            APP_PUBLIC_URL: http://localhost:9090
            CORS_ALLOWED_ORIGINS: http://localhost:9090

            DB_TYPE: sqlite
            DB_PATH: /data/momobase.db

            ENCRYPTION_MASTER_KEY_BASE64: ${ENCRYPTION_MASTER_KEY_BASE64:?}
            ADMIN_OAUTH_SECRET: ${ADMIN_OAUTH_SECRET:?}
            APP_OAUTH_SECRET: ${APP_OAUTH_SECRET:?}
        volumes:
            - momobase-data:/data

volumes:
    momobase-data:
```

```yaml [PostgreSQL]
services:
    momobase:
        image: ghcr.io/momobasehq/server:latest
        restart: unless-stopped
        depends_on:
            db:
                condition: service_healthy
        ports:
            - "9090:9090"
        environment:
            APP_PUBLIC_URL: http://localhost:9090
            CORS_ALLOWED_ORIGINS: http://localhost:9090

            DB_TYPE: postgres
            DB_HOST: db
            DB_PORT: "5432"
            DB_USER: momobase
            DB_PASSWORD: ${POSTGRES_PASSWORD:?}
            DB_NAME: momobase
            DB_SSLMODE: disable

            ENCRYPTION_MASTER_KEY_BASE64: ${ENCRYPTION_MASTER_KEY_BASE64:?}
            ADMIN_OAUTH_SECRET: ${ADMIN_OAUTH_SECRET:?}
            APP_OAUTH_SECRET: ${APP_OAUTH_SECRET:?}
        volumes:
            - momobase-data:/data

    db:
        image: postgres:18-alpine
        restart: unless-stopped
        environment:
            POSTGRES_USER: momobase
            POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
            POSTGRES_DB: momobase
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U momobase -d momobase"]
            interval: 5s
            retries: 10
            start_period: 10s
        volumes:
            - postgres-data:/var/lib/postgresql/data

volumes:
    momobase-data:
    postgres-data:
```

```yaml [MySQL]
services:
    momobase:
        image: ghcr.io/momobasehq/server:latest
        restart: unless-stopped
        depends_on:
            db:
                condition: service_healthy
        ports:
            - "9090:9090"
        environment:
            APP_PUBLIC_URL: http://localhost:9090
            CORS_ALLOWED_ORIGINS: http://localhost:9090

            DB_TYPE: mysql
            DB_HOST: db
            DB_PORT: "3306"
            DB_USER: momobase
            DB_PASSWORD: ${MYSQL_PASSWORD:?}
            DB_NAME: momobase

            ENCRYPTION_MASTER_KEY_BASE64: ${ENCRYPTION_MASTER_KEY_BASE64:?}
            ADMIN_OAUTH_SECRET: ${ADMIN_OAUTH_SECRET:?}
            APP_OAUTH_SECRET: ${APP_OAUTH_SECRET:?}
        volumes:
            - momobase-data:/data

    db:
        image: mysql:8.4
        restart: unless-stopped
        environment:
            MYSQL_USER: momobase
            MYSQL_PASSWORD: ${MYSQL_PASSWORD:?}
            MYSQL_DATABASE: momobase
            MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:?}
        healthcheck:
            test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1"]
            interval: 5s
            retries: 10
            start_period: 30s
        volumes:
            - mysql-data:/var/lib/mysql

volumes:
    momobase-data:
    mysql-data:
```

:::

What differs between them:

| Variable       | SQLite              | PostgreSQL                                  | MySQL       |
| -------------- | ------------------- | ------------------------------------------- | ----------- |
| `DB_TYPE`      | `sqlite`            | `postgres`                                  | `mysql`     |
| `DB_PATH`      | `/data/momobase.db` | —                                           | —           |
| `DB_PORT`      | —                   | `5432`                                      | `3306`      |
| `DB_SSLMODE`   | —                   | `disable` locally, `require` over a network | ignored     |
| Second service | none                | `postgres:18-alpine`                        | `mysql:8.4` |

`DB_PORT` defaults to `5432`, so MySQL will not connect until you set it. `DB_SSLMODE` is read only by the PostgreSQL driver — the MySQL DSN never sees it.

SQLite is fine for a single container and runs in WAL mode, but it has one writer: use PostgreSQL or MySQL the moment a second replica needs the same data. Whichever you pick, `/data` still has to be a volume — the container's working data lives there.

The `:?` guards fail the stack rather than start it with a missing secret. Compose reads a `.env` beside the compose file, and that file is literal text — no command substitution, no quoting — so it holds the finished values:

```ini
ENCRYPTION_MASTER_KEY_BASE64=…
ADMIN_OAUTH_SECRET=…
APP_OAUTH_SECRET=…
POSTGRES_PASSWORD=…
```

Use `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` instead if you chose MySQL. [Secrets](/server/configuration#secrets) covers how to generate the three, what each one signs or encrypts, and why the encryption key has to be backed up with the database.

Then start it and seed the administrator:

```sh
docker compose up -d
docker compose run --rm momobase seed-admin \
	--email you@example.com --password 'change me'
```

## Go install

If you already have Go 1.25 or newer:

```sh
go install github.com/momobasehq/server/cmd/momobase@latest
```

This builds from source and omits the version stamp that release archives carry, so `momobase version` reports `dev`.

## Verify the install

```sh
curl --fail --silent http://localhost:9090/healthz
```

```json
{ "ok": true }
```

Then open `http://localhost:9090/dashboard/` and sign in as the administrator you seeded.

## Next

- [Create your first payment](/guide/first-payment) against the running instance.
- [Configure the server](/server/configuration) before exposing it to anything.
- [Deploy it properly](/server/deployment) with TLS, a shared database, and deliberate migrations.
