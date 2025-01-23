# Namestone

## Prerequisites

### Node.js and Yarn
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install)

Ensure Node.js and Yarn are properly installed by running:

```bash
node --version
yarn --version
```

### Postgres

#### Local Installation

1. Download and install [Postgres](https://www.postgresql.org/download/)

2. See [Prisma guide](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database) for instructions on how to set up a local postgres database.

```bash
brew services start postgresql
```

3. Connect to the database: ```psql -h localhost -U postgres -d namestone-postgres```

#### Docker Installation

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. Verify Docker installation: ```docker --version```

3. Run the following command to start the postgres container:

```bash
docker run --name namestone-postgres -e POSTGRES_PASSWORD=namestone -d postgres
```

4. Verify the container is running: ```docker ps```

5. Connect to the database: ```psql -h localhost -U postgres -d namestone-postgres```

## Getting Started

First, install the dependencies:    

```bash
yarn install
```

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tests

### API route tests

API route tests are colocated next to the route itself, i.e. `pages/api/[network]/set-name.js` and `pages/api/[network]/set-name.test.js`.
The API route tests are ran using `jest` against a local postgres instance.

Please see `.env.test` for the test database credentials and local port.

#### Running tests

```bash
yarn test
```

#### Coverage

Coverage reports are generated in the `coverage` directory. To view the coverage report, open `coverage/index.html` in your browser.

