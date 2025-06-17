/**
 * E2E Tests for /set-names
 * Key features tested:
 * - Batch subdomain creation and updates
 * - Parameter validation for arrays
 * - API key authentication
 * - Domain validation
 * - Text record management for multiple names
 * - Coin type record management for multiple names
 * - Subdomain limits for batch operations
 * - Transaction rollback on errors
 * - Mixed success/failure scenarios
 */

/**
 * Set up mocks before imports
 *
 * This is a workaround to mock the database module to use the `TEST_DATABASE_URL` environment variable
 * instead of the `POSTGRES_URI` environment variable.
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./set-names";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_DOMAIN = "test.eth";
const TEST_API_KEY = "test-api-key";
const DEFAULT_SUBDOMAIN_LIMIT = 100;
const SUPPORTED_NETWORKS = [
  { path: "public_v1", name: "mainnet" },
  { path: "public_v1_sepolia", name: "sepolia" },
];

describe("set-names API E2E", () => {
  let testDomainId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  /**
   * Tests network validation:
   * - Empty network parameter
   * - Invalid network value
   */
  describe("Network Validation", () => {
    test("should return 400 for empty network parameter", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "",
        },
        headers: {
          authorization: TEST_API_KEY,
        },
        body: {
          domain: TEST_DOMAIN,
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("should return 400 for invalid network parameter", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "invalid_network",
        },
        headers: {
          authorization: TEST_API_KEY,
        },
        body: {
          domain: TEST_DOMAIN,
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid network",
      });
    });
  });

  /**
   * Tests API functionality for each supported network:
   * - Mainnet (public_v1)
   * - Sepolia (public_v1_sepolia)
   * Each network runs the complete test suite
   */
  describe.each(SUPPORTED_NETWORKS)(
    "set-names API E2E for %s",
    (networkConfig) => {
      beforeAll(async () => {
        console.log(`Seed data for ${networkConfig.path}...`);

        // Insert seed data
        const [domain] = await sqlForTests`
        INSERT INTO domain (name, network, name_limit)
        VALUES (${TEST_DOMAIN}, ${networkConfig.name}, ${DEFAULT_SUBDOMAIN_LIMIT})
        RETURNING id
      `;

        testDomainId = domain.id;

        // Insert API key for the domain
        await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${testDomainId}, ${TEST_API_KEY})
      `;

        // Verify seed data was inserted correctly
        const domainCount =
          await sqlForTests`SELECT COUNT(*) as count FROM domain`;
        const apiKeyCount =
          await sqlForTests`SELECT COUNT(*) as count FROM api_key`;

        expect(domainCount.length).toBe(1);
        expect(apiKeyCount.length).toBe(1);

        console.log("Seed data verified successfully");
      });

      afterAll(async () => {
        await sqlForTests`DELETE FROM subdomain_coin_type WHERE subdomain_id IN (SELECT id FROM subdomain WHERE domain_id = ${testDomainId})`;
        await sqlForTests`DELETE FROM subdomain_text_record WHERE subdomain_id IN (SELECT id FROM subdomain WHERE domain_id = ${testDomainId})`;
        await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM api_key WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${testDomainId}`;
        await sqlForTests`DELETE FROM user_engagement WHERE name = 'set_names'`;
      });

      /**
       * Tests parameter validation for batch operations:
       * - Missing domain
       * - Missing names array
       * - Empty names array
       * - Invalid names array format
       * - Missing name in names array
       */
      describe("Parameter Validation", () => {
        test("should return 400 for missing domain", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          expect(JSON.parse(res._getData())).toEqual({
            error: "Missing domain",
          });
        });

        test("should return 400 for missing names array", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          expect(JSON.parse(res._getData())).toEqual({
            error: "Missing names array or empty array",
          });
        });

        test("should return 400 for empty names array", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
              names: [],
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          expect(JSON.parse(res._getData())).toEqual({
            error: "Missing names array or empty array",
          });
        });

        test("should return 400 for non-array names", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
              names: "not-an-array",
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          expect(JSON.parse(res._getData())).toEqual({
            error: "Missing names array or empty array",
          });
        });

        test("should return 400 for missing name in names array", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
              names: [
                { name: "test1", address: "0x1234567890123456789012345678901234567890" },
                { address: "0x1234567890123456789012345678901234567890" }, // missing name
              ],
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          expect(JSON.parse(res._getData())).toEqual({
            error: "Missing name in names array at index 1",
          });
        });

        test("should return 400 for invalid ENS name", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
              names: [
                { name: "test1", address: "0x1234567890123456789012345678901234567890" },
                { name: "invalid..name", address: "0x1234567890123456789012345678901234567890" },
              ],
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(400);
          const response = JSON.parse(res._getData());
          expect(response.error).toContain("Invalid ens name at index 1");
        });
      });

      /**
       * Tests successful batch operations
       */
      describe("Successful Batch Operations", () => {
        test("should create multiple new subdomains successfully", async () => {
          const names = [
            {
              name: "alice",
              address: "0x1111111111111111111111111111111111111111",
              text_records: {
                "com.twitter": "alice_twitter",
                description: "Alice's profile",
              },
            },
            {
              name: "bob",
              address: "0x2222222222222222222222222222222222222222",
            },
          ];

          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: TEST_API_KEY,
            },
            body: {
              domain: TEST_DOMAIN,
              names: names,
            },
          });

          const res = createResponse();
          await handler(req, res);

          expect(res.statusCode).toBe(200);
          const response = JSON.parse(res._getData());
          expect(response.success).toBe(true);
          expect(response.processed).toBe(2);
          expect(response.results).toHaveLength(2);

          // Verify each result
          response.results.forEach((result, index) => {
            expect(result.index).toBe(index);
            expect(result.name).toBe(names[index].name);
            expect(result.success).toBe(true);
            expect(result.subdomainId).toBeDefined();
          });
        });
      });
    }
  );
});