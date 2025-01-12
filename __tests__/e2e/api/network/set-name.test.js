const httpMocks = require("node-mocks-http");
const handler = require("../../../../pages/api/[network]/set-name").default;
const sql = require("../../../../lib/db").default;
const postgres = require("postgres");
const { execSync } = require("child_process");
require("dotenv").config({ path: ".env.test" });

const DEFAULT_NETWORK = "public_v1";
const TEST_DOMAIN = "test.eth";
const TEST_API_KEY = "test-api-key";

describe("set-name API E2E", () => {
  let res;
  let testDomainId;

  beforeAll(async () => {
    // Database setup
    const adminSql = postgres(
      "postgresql://admin:admin@localhost:5432/postgres"
    );

    try {
      // Check if database exists
      const dbExists = await adminSql`
        SELECT 1 FROM pg_database WHERE datname=${process.env.DB_NAME}
      `;

      if (dbExists.length === 0) {
        console.log(`Creating test database: ${process.env.DB_NAME}`);
        await adminSql`CREATE DATABASE ${adminSql(process.env.DB_NAME)}`;
      } else {
        console.log(`Test database ${process.env.DB_NAME} already exists`);
      }
    } finally {
      await adminSql.end();
    }

    // Run Prisma migrations
    try {
      console.log("Running Prisma migrations...");
      execSync("npx prisma validate", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      });

      execSync("npx prisma migrate dev", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      });
    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }

    // Verify database is empty
    console.log("Verifying database is empty...");

    const tables = [
      "domain",
      "subdomain",
      "subdomain_text_record",
      "subdomain_coin_type",
      "api_key",
    ];
    for (const table of tables) {
      const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
      if (count[0].count > 0) {
        throw new Error(
          `Table ${table} is not empty. Found ${count[0].count} rows.`
        );
      }
      console.log(`Verified ${table} is empty`);
    }

    console.log("Database is clean, proceeding with seed data...");

    // Insert seed data
    const [domain] = await sql`
      INSERT INTO domain (name, network, name_limit)
      VALUES (${TEST_DOMAIN}, ${DEFAULT_NETWORK}, 100)
      RETURNING id
    `;

    testDomainId = domain.id;

    // Insert API key for the domain
    await sql`
      INSERT INTO api_key (domain_id, key)
      VALUES (${testDomainId}, ${TEST_API_KEY})
    `;

    // Verify seed data was inserted correctly
    const domainCount = await sql`SELECT COUNT(*) as count FROM domain`;
    const apiKeyCount = await sql`SELECT COUNT(*) as count FROM api_key`;

    expect(domainCount.length).toBe(1);
    expect(apiKeyCount.length).toBe(1);

    console.log("Seed data verified successfully");
  });

  beforeEach(() => {
    // Reset only necessary mocks
    jest.clearAllMocks();
    res = httpMocks.createResponse();
  });

  afterAll(async () => {
    // Close the test database connection
    await sql.end();

    // Connect to postgres to drop the test database
    const adminSql = postgres(
      "postgresql://admin:admin@localhost:5432/postgres"
    );

    try {
      // Terminate all connections to the test database
      await adminSql`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = ${process.env.DB_NAME}
        AND pid <> pg_backend_pid()
      `;

      // Drop the test database
      console.log(`Dropping test database: ${process.env.DB_NAME}`);
      await adminSql`DROP DATABASE IF EXISTS ${adminSql(process.env.DB_NAME)}`;
    } catch (error) {
      console.error("Error dropping test database:", error);
      throw error;
    } finally {
      await adminSql.end();
    }
  });

  describe("API Key Validation", () => {
    test("setName_noApiKeySupplied_returns401", async () => {
      // First, create a new subdomain
      const createReq = httpMocks.createRequest({
        method: "POST",
        query: {
          network: DEFAULT_NETWORK
        },
        body: {
          domain: "non-existing.eth",
          address: "0x1234567890123456789012345678901234567890",
          name: "e2e-test",
          text_records: {
            email: "test@example.com",
            url: "https://example.com",
          },
          coin_types: {
            2147483785: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
            2147492101: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
          },
        },
      });

      await handler(createReq, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });

    test("setName_incorrectApiKey_returns401", async () => {
      // First, create a new subdomain
      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: "invalid-api-key",
        },
        query: {
            network: DEFAULT_NETWORK
          },
        body: {
          domain: "non-existing.eth",
          address: "0x1234567890123456789012345678901234567890",
          name: "e2e-test",
          text_records: {
            email: "test@example.com",
            url: "https://example.com",
          },
          coin_types: {
            2147483785: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
            2147492101: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
          },
        },
      });

      await handler(createReq, res);
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });

    test("setName_validApiKeyButNonExistingDomain_returns404", async () => {
      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: "test-api-key",
        },
        query: {
            network: DEFAULT_NETWORK
          },
        body: {
          domain: "non-existing.eth",
          address: "0x1234567890123456789012345678901234567890",
          name: "e2e-test",
          text_records: {
            email: "test@example.com",
            url: "https://example.com",
          },
          coin_types: {
            2147483785: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
            2147492101: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
          },
        },
      });

      await handler(createReq, res);
      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });
  });

  describe("creates new subdomain", () => {
    beforeEach(async () => {
      // Assert there are no subdomains, coin types, or text records
      const subDomainsForTestDomainBeforeApiCall = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subDomainsForTestDomainBeforeApiCall).toHaveLength(0);
      const coinTypesForTestDomainBeforeApiCall = await sql`
        SELECT * FROM subdomain_coin_type`;
      expect(coinTypesForTestDomainBeforeApiCall).toHaveLength(0);
      const textRecordsForTestDomainBeforeApiCall = await sql`
        SELECT * FROM subdomain_text_record`;
      expect(textRecordsForTestDomainBeforeApiCall).toHaveLength(0);
    });

    afterEach(async () => {
      // Clean up test data
      await sql`DELETE FROM domain_coin_type WHERE domain_id = ${testDomainId}`;
      await sql`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
      await sql`DELETE FROM subdomain_coin_type`;
      await sql`DELETE FROM subdomain_text_record`;
    });

    test("e2e successfully creates subdomain with all fields", async () => {
      const testSubdomain = "test-subdomain";
      const subDomainsForTestDomainBeforeApiCall = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subDomainsForTestDomainBeforeApiCall).toHaveLength(0);

      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: testSubdomain,
        },
      });

      // When the API is called
      await handler(createReq, res);

      // Then the API returns 200 and a new subdomain is created
      console.log(res._getData());
      expect(res._getStatusCode()).toBe(200);
      const subDomainsForTestDomainAfterApiCall = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subDomainsForTestDomainAfterApiCall).toHaveLength(1);
      const newSubdomain = subDomainsForTestDomainAfterApiCall[0];
      expect(newSubdomain).toMatchObject({
        name: testSubdomain,
        address: "0x1234567890123456789012345678901234567890",
      });
      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(coinTypes).toHaveLength(0);
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(textRecords).toHaveLength(0);
    });
  });
});
