const httpMocks = require("node-mocks-http");
const handler = require("../../../../pages/api/[network]/set-name").default;
const sql = require("../../../../lib/db").default;
const postgres = require("postgres");
const { execSync } = require("child_process");
require("dotenv").config({ path: ".env.test" });

const DEFAULT_NETWORK_API = "public_v1";
const TEST_DOMAIN = "test.eth";
const TEST_API_KEY = "test-api-key";
const TEST_DEFAULT_NETWORK = "mainnet";
const DEFAULT_SUBDOMAIN_LIMIT = 100;
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
      VALUES (${TEST_DOMAIN}, ${TEST_DEFAULT_NETWORK}, ${DEFAULT_SUBDOMAIN_LIMIT})
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
          network: DEFAULT_NETWORK_API,
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
          network: DEFAULT_NETWORK_API,
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
          network: DEFAULT_NETWORK_API,
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
      await sql`DELETE FROM subdomain_coin_type`;
      await sql`DELETE FROM subdomain_text_record`;
      await sql`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
    });

    test("e2e successfully creates subdomain with no coin types or text records", async () => {
      const testSubdomain = "test-subdomain";
      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: testSubdomain,
        },
      });

      await handler(createReq, res);

      expect(res._getStatusCode()).toBe(200);
      const subdomains = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subdomains).toHaveLength(1);
      const newSubdomain = subdomains[0];
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

    test("e2e successfully creates subdomain with text records", async () => {
      const testSubdomain = "test-subdomain-text";
      const textRecordsData = {
        email: "test@example.com",
        url: "https://example.com",
        description: "Test description",
        avatar: "https://example.com/avatar.png",
        notice: "Test notice",
      };

      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: testSubdomain,
          text_records: textRecordsData,
        },
      });

      await handler(createReq, res);

      expect(res._getStatusCode()).toBe(200);
      const subdomains = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subdomains).toHaveLength(1);
      const newSubdomain = subdomains[0];
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(textRecords).toHaveLength(Object.keys(textRecordsData).length);

      // Verify each text record
      for (const record of textRecords) {
        expect(record.value).toBe(textRecordsData[record.key]);
      }
    });

    test("e2e successfully creates subdomain with coin types", async () => {
      const testSubdomain = "test-subdomain-coins";
      const coinTypesData = {
        2147483785: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF", // BTC
        2147492101: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF", // DOGE
        60: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF", // ETH
      };

      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: testSubdomain,
          coin_types: coinTypesData,
        },
      });

      await handler(createReq, res);

      expect(res._getStatusCode()).toBe(200);
      const subdomains = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subdomains).toHaveLength(1);
      const newSubdomain = subdomains[0];
      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(coinTypes).toHaveLength(Object.keys(coinTypesData).length);

      // Verify each coin type
      for (const record of coinTypes) {
        expect(record.address).toBe(coinTypesData[record.coin_type]);
      }
    });

    test("e2e successfully creates subdomain with both text records and coin types", async () => {
      const testSubdomain = "test-subdomain-full";
      const textRecordsData = {
        email: "test@example.com",
        url: "https://example.com",
      };
      const coinTypesData = {
        2147483785: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
        60: "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
      };

      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: testSubdomain,
          text_records: textRecordsData,
          coin_types: coinTypesData,
        },
      });

      await handler(createReq, res);

      expect(res._getStatusCode()).toBe(200);
      const subdomains = await sql`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
      expect(subdomains).toHaveLength(1);
      const newSubdomain = subdomains[0];
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(textRecords).toHaveLength(Object.keys(textRecordsData).length);

      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${newSubdomain.id}`;
      expect(coinTypes).toHaveLength(Object.keys(coinTypesData).length);
    });

    test("returns 400 when subdomain name is invalid", async () => {
      const createReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: "invalid!@#$%^&*()",
        },
      });

      await handler(createReq, res);
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: expect.stringContaining("Invalid ens name"),
      });
    });

    test("returns 400 when domain has reached subdomain limit", async () => {
      // First, update the domain to have a low limit
      await sql`
        UPDATE domain 
        SET name_limit = 2 
        WHERE id = ${testDomainId}
      `;

      // Create subdomains up to the limit
      for (let i = 1; i <= 2; i++) {
        const createReq = httpMocks.createRequest({
          method: "POST",
          headers: {
            authorization: TEST_API_KEY,
          },
          query: {
            network: DEFAULT_NETWORK_API,
          },
          body: {
            domain: TEST_DOMAIN,
            address: "0x1234567890123456789012345678901234567890",
            name: `test-subdomain-${i}`,
          },
        });

        const limitRes = httpMocks.createResponse();
        await handler(createReq, limitRes);
        expect(limitRes._getStatusCode()).toBe(200);
      }

      // Verify we have reached the limit
      const subdomainCount = await sql`
        SELECT *
        FROM subdomain 
        WHERE domain_id = ${testDomainId}
      `;
      expect(subdomainCount).toHaveLength(2);

      // Try to create one more subdomain
      const exceedLimitReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
          name: "test-subdomain-exceed",
        },
      });

      const exceedRes = httpMocks.createResponse();
      await handler(exceedLimitReq, exceedRes);

      // Verify we get a 400 error
      expect(exceedRes._getStatusCode()).toBe(400);
      expect(JSON.parse(exceedRes._getData())).toEqual({
        error: expect.stringContaining("Api name limit reached"),
      });

      // Reset the domain limit for other tests
      await sql`
        UPDATE domain 
        SET name_limit = ${DEFAULT_SUBDOMAIN_LIMIT}
        WHERE id = ${testDomainId}
      `;
    });
  });

  describe("updates existing subdomain", () => {
    const existingSubdomainName = "existing-subdomain";
    const preExistingSubdomainAddress =
      "0x1234567890123456789012345678901234567890";
    const preExistingEmailTextRecord = "old@example.com";
    const preExistingUrlTextRecord = "https://old.example.com";
    const preExistingEthCoinType = "0x1111111111111111111111111111111111111111";
    const preExistingBtcCoinType = "0x2222222222222222222222222222222222222222";
    let existingSubdomainId;

    beforeEach(async () => {
      const req = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          address: preExistingSubdomainAddress,
          name: existingSubdomainName,
          text_records: {
            email: preExistingEmailTextRecord,
            url: preExistingUrlTextRecord,
          },
          coin_types: {
            60: preExistingEthCoinType,
            2147483785: preExistingBtcCoinType,
          },
        },
      });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
      const result = await sql`
        SELECT * FROM subdomain WHERE name = ${existingSubdomainName}
        `;
      expect(result).toHaveLength(1);
      const newSubdomainRecord = result[0];
      existingSubdomainId = result[0].id;
      expect(newSubdomainRecord).toMatchObject({
        name: existingSubdomainName,
        address: preExistingSubdomainAddress,
      });
      // Verify text records were created
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(textRecords).toHaveLength(2);
      expect(textRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'email',
            value: preExistingEmailTextRecord
          }),
          expect.objectContaining({
            key: 'url', 
            value: preExistingUrlTextRecord
          })
        ])
      );

      // Verify coin type records were created
      const coinRecords = await sql`
        SELECT address, coin_type FROM subdomain_coin_type
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(coinRecords).toHaveLength(2);
      expect(coinRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            coin_type: "60",
            address: preExistingEthCoinType
          }),
          expect.objectContaining({
            coin_type: "2147483785",
            address: preExistingBtcCoinType
          })
        ])
      );
    });

    afterEach(async () => {
      // Clean up test data
      await sql`DELETE FROM subdomain_coin_type WHERE subdomain_id = ${existingSubdomainId}`;
      await sql`DELETE FROM subdomain_text_record WHERE subdomain_id = ${existingSubdomainId}`;
      await sql`DELETE FROM subdomain WHERE id = ${existingSubdomainId}`;
    });

    test("e2e successfully updates subdomain address only", async () => {
      const newAddress = "0x9876543210987654321098765432109876543210";
      const updateReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          name: existingSubdomainName,
          address: newAddress,
        },
      });

      const updateRes = httpMocks.createResponse();
      await handler(updateReq, updateRes);
      expect(updateRes._getStatusCode()).toBe(200);

      // Verify address was updated but records remain unchanged
      const afterUpdateSubdomain = await sql`
      SELECT * FROM subdomain WHERE id = ${existingSubdomainId}
      `;
      expect(afterUpdateSubdomain).toHaveLength(1);
      const afterUpdateSubdomainRecord = afterUpdateSubdomain[0];
      expect(afterUpdateSubdomainRecord.address).toBe(newAddress);
      // Verify no coin records exist
      const coinRecords = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(coinRecords).toHaveLength(0);
      // Verify no text records exist
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(textRecords).toHaveLength(0);
    });

    test("e2e successfully updates subdomain text records", async () => {
      const newTextRecords = {
        email: "new@example.com",
        url: "https://new.example.com",
        description: "New description",
      };

      const updateReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          name: existingSubdomainName,
          address: "0x1234567890123456789012345678901234567890",
          text_records: newTextRecords,
        },
      });

      const updateRes = httpMocks.createResponse();
      await handler(updateReq, updateRes);
      expect(updateRes._getStatusCode()).toBe(200);

      // Verify text records were updated
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY key
      `;
      expect(textRecords).toHaveLength(Object.keys(newTextRecords).length);

      for (const record of textRecords) {
        expect(record.value).toBe(newTextRecords[record.key]);
      }

      // Verify coin types were removed
      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(coinTypes).toHaveLength(0);
    });

    test("e2e successfully updates subdomain coin types", async () => {
      const newCoinTypes = {
        60: "0x3333333333333333333333333333333333333333",
        2147483785: "0x4444444444444444444444444444444444444444",
        2147492101: "0x5555555555555555555555555555555555555555",
      };

      const updateReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          name: existingSubdomainName,
          address: "0x1234567890123456789012345678901234567890",
          coin_types: newCoinTypes,
        },
      });

      const updateRes = httpMocks.createResponse();
      await handler(updateReq, updateRes);
      expect(updateRes._getStatusCode()).toBe(200);

      // Verify coin types were updated
      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY coin_type
      `;
      expect(coinTypes).toHaveLength(Object.keys(newCoinTypes).length);

      for (const record of coinTypes) {
        expect(record.address).toBe(newCoinTypes[record.coin_type]);
      }

      // Verify text records remained unchanged
      const textRecords = await sql`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
      `;
      expect(textRecords).toHaveLength(0);
    });

    test("e2e successfully updates all subdomain fields", async () => {
      const newAddress = "0x9999999999999999999999999999999999999999";
      const newTextRecords = {
        email: "complete@example.com",
        avatar: "https://new.example.com/avatar.png",
      };
      const newCoinTypes = {
        60: "0x6666666666666666666666666666666666666666",
        2147492101: "0x7777777777777777777777777777777777777777",
      };

      const updateReq = httpMocks.createRequest({
        method: "POST",
        headers: {
          authorization: TEST_API_KEY,
        },
        query: {
          network: DEFAULT_NETWORK_API,
        },
        body: {
          domain: TEST_DOMAIN,
          name: existingSubdomainName,
          address: newAddress,
          text_records: newTextRecords,
          coin_types: newCoinTypes,
        },
      });

      const updateRes = httpMocks.createResponse();
      await handler(updateReq, updateRes);
      expect(updateRes._getStatusCode()).toBe(200);

      // Verify all fields were updated
      const [updatedSubdomain] = await sql`
        SELECT * FROM subdomain WHERE id = ${existingSubdomainId}
      `;
      expect(updatedSubdomain.address).toBe(newAddress);

      const textRecords = await sql`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY key
      `;
      expect(textRecords).toHaveLength(Object.keys(newTextRecords).length);
      for (const record of textRecords) {
        expect(record.value).toBe(newTextRecords[record.key]);
      }

      const coinTypes = await sql`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY coin_type
      `;
      expect(coinTypes).toHaveLength(Object.keys(newCoinTypes).length);
      for (const record of coinTypes) {
        expect(record.address).toBe(newCoinTypes[record.coin_type]);
      }
    });
  });
});
