# How to Contribute to NameStone

### Prerequisites

#### Node.js and Yarn

- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install)

Ensure Node.js and Yarn are properly installed by running:

```bash
node --version
yarn --version
```

#### Postgres

You can install Postgres in a number of ways.

##### Local Installation

1. Download and install [Postgres](https://www.postgresql.org/download/)

2. See [Prisma guide](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database) for instructions on how to set up a local postgres database.

```bash
brew services start postgresql
```

3. Connect to the database: `psql -h localhost -U postgres -d namestone-postgres`

##### Docker Installation

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. Verify Docker installation: `docker --version`

3. Run the following command to start the postgres container:

```bash
docker run --name namestone-postgres -e POSTGRES_PASSWORD=namestone -d postgres
```

4. Verify the container is running: `docker ps`

5. Connect to the database: `psql -h localhost -U postgres -d namestone-postgres`

### Development Setup

To get it running, follow the steps below:

1. Install dependencies:

```bash
yarn install
```

2. Configure environment variables:

Start by copying the example environment file to a new file called `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your own values.

(Optional) Get a WalletConnect Project ID:
If you plan to use WalletConnect features:

- Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Sign up or log in
- Create a new project
- Copy the Project ID
- Add it to your `.env` file as `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

3. Push the database migrations to the database:

```bash
npx prisma db push
```

### Optional: Seed the database

To seed the database with test data, run:

```bash
node ./prisma/seed.js
```

The seed scripts create the following domains and API keys:

| Network | Domain             | API Key                     |
| ------- | ------------------ | --------------------------- |
| mainnet | test-mainnet.eth   | test-api-key-mainnet        |
| mainnet | second-mainnet.eth | second-test-api-key-mainnet |
| sepolia | test-sepolia.eth   | test-api-key-sepolia        |
| sepolia | second-sepolia.eth | second-test-api-key-sepolia |

Each domain includes:

- Multiple subdomains with text records and coin types:
  - Primary domains: test1, test2, test3, rob, robert, alice
  - Secondary domains: other1, other2, other3, rob-other, ronald, anna
- Brand settings (shareWithDataProviders enabled/disabled)
- Network-specific configuration

You can use these credentials to test the API endpoints locally. For example:

```bash
curl -X GET "http://localhost:3000/api/public_v1/get-names?domain=test-mainnet.eth" \
  -H "Authorization: test-api-key-mainnet"
```

#### Running the development server

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to interact with the application or make API requests.

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
