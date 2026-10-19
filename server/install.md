# Install Momobase Server

Every method below gives you the API on `http://localhost:9090` and the dashboard on `http://localhost:9090/_/`.

A fresh install uses placeholder secrets and a local SQLite file. That is fine on your own machine. Set the [three secrets](/server/configuration#secrets) before anyone else can reach it.

## What you need

- **Docker** for the Docker method, or **Docker Compose v2** for the Compose method.
- **Linux, macOS, or Windows** for the release binary.
- **Go 1.25 or newer** only for `go install`.
- An email address and password for the first administrator.

## Docker

1. Start the container:

    ```sh
    docker run -d \
    	--name momobase \
    	-p 9090:9090 \
    	-v momobase-data:/data \
    	ghcr.io/momobasehq/server:latest
    ```

    The database lives in the `/data` volume. Without the volume, it is deleted with the container.

2. Create the first administrator:

    ```sh
    docker exec momobase momobase seed-admin \
    	--email you@example.com --password 'change me'
    ```

Image tags are `latest`, the full version (for example `0.4.1`), and the `0.4` and `0` prefixes. Tags have no `v` prefix. Images are built for `linux/amd64` and `linux/arm64`.

To upgrade, pull a newer tag and recreate the container.

## Docker Compose

1. Create a `compose.yaml` for your database:

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

    The server repository also ships a PostgreSQL compose file and an `.env.example`:

    ```sh
    git clone https://github.com/momobasehq/server.git
    cd server
    cp .env.example .env
    ```

2. Create a `.env` file beside `compose.yaml` with finished values. Compose reads it as literal text, so do not use quotes or `$(...)`:

    ```ini
    ENCRYPTION_MASTER_KEY_BASE64=…
    ADMIN_OAUTH_SECRET=…
    APP_OAUTH_SECRET=…
    POSTGRES_PASSWORD=…
    ```

    Generate the three secrets as shown in [Secrets](/server/configuration#secrets). For MySQL, set `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` instead of `POSTGRES_PASSWORD`. A missing value stops the stack from starting.

3. Start the stack and create the first administrator:

    ```sh
    docker compose up -d
    docker compose run --rm momobase seed-admin \
    	--email you@example.com --password 'change me'
    ```

Database settings by engine:

| Variable     | SQLite              | PostgreSQL                                  | MySQL    |
| ------------ | ------------------- | ------------------------------------------- | -------- |
| `DB_TYPE`    | `sqlite`            | `postgres`                                  | `mysql`  |
| `DB_PATH`    | `/data/momobase.db` | —                                           | —        |
| `DB_PORT`    | —                   | `5432`                                      | `3306`   |
| `DB_SSLMODE` | —                   | `disable` locally, `require` over a network | not used |

- Set `DB_PORT=3306` for MySQL. The default is `5432`.
- Use PostgreSQL or MySQL if you will run more than one replica. SQLite allows one writer.
- Keep the `/data` volume with every engine.

## Release binary

1. Download the archive for your platform:

       <DownloadButtons />

2. Check it against `SHA256SUMS` from the same release:

    ```sh
    sha256sum --check --ignore-missing SHA256SUMS
    ```

3. Unpack it, create the first administrator, and start the server:

    ```sh
    unzip momobase_v0.4.1_linux_amd64.zip
    ./momobase seed-admin --email you@example.com --password 'change me'
    ./momobase serve
    ```

    Archives are named `momobase_<version>_<os>_<arch>.zip` and contain the `momobase` binary, the licence, and the README.

To upgrade, run `./momobase self-update` and restart the server. See [self-update](/server/cli#self-update).

## Go install

```sh
go install github.com/momobasehq/server/cmd/momobase@latest
```

Then run `momobase seed-admin` and `momobase serve` as above. A binary built this way reports its version as `dev` and cannot use `self-update`.

## Verify the install

```sh
curl --fail --silent http://localhost:9090/healthz
```

```json
{ "success": true, "data": { "ok": true } }
```

Open `http://localhost:9090/_/` and sign in as the administrator you created.

`http://localhost:9090/` redirects to the dashboard unless a `mb_public` directory exists beside the binary. See [the public directory](/server/configuration#migrations-dashboard-and-the-public-directory).

## Next

- [Follow the Quickstart](/guide/quickstart).
- [Configure the server](/server/configuration) before you expose it.
- [Deploy it](/server/deployment) for production.
