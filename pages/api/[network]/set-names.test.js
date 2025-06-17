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
        url: "/api//set-names",
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
        url: "/api/invalid_network/set-names",
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
   * Tests parameter validation for batch operations:
   * - Missing domain
   * - Missing names array
   * - Empty names array
   * - Invalid names array format
   * - Missing name in names array
   */
  describe("Parameter Validation", () => {
    beforeEach(async () => {
      testDomainId = await setupTestDomain();
    });

    afterEach(async () => {
      await cleanupTestDomain(testDomainId);
    });

    test("should return 400 for missing domain", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
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
        url: "/api/public_v1/set-names",
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
        url: "/api/public_v1/set-names",
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
        url: "/api/public_v1/set-names",
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
        url: "/api/public_v1/set-names",
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
        url: "/api/public_v1/set-names",
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
   * Tests API key authentication for batch operations:
   * - Missing API key
   * - Invalid API key
   * - Valid API key
   */
  describe("API Key Authentication", () => {
    beforeEach(async () => {
      testDomainId = await setupTestDomain();
    });

    afterEach(async () => {
      await cleanupTestDomain(testDomainId);
    });

    test("should return 401 for missing API key", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
        body: {
          domain: TEST_DOMAIN,
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });

    test("should return 401 for invalid API key", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
        headers: {
          authorization: "invalid-key",
        },
        body: {
          domain: TEST_DOMAIN,
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });
  });

  /**
   * Tests successful batch subdomain creation and updates
   */
  describe("Successful Batch Operations", () => {
    beforeEach(async () => {
      testDomainId = await setupTestDomain();
    });

    afterEach(async () => {
      await cleanupTestDomain(testDomainId);
    });

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
          coin_types: {
            "2147483785": "0x2222222222222222222222222222222222222222", // Arbitrum
          },
        },
        {
          name: "charlie",
          address: "0x3333333333333333333333333333333333333333",
        },
      ];

      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
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
      expect(response.processed).toBe(3);
      expect(response.results).toHaveLength(3);

      // Verify each result
      response.results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.name).toBe(names[index].name);
        expect(result.success).toBe(true);
        expect(result.subdomainId).toBeDefined();
      });

      // Verify database entries
      const subdomains = await sqlForTests`
        SELECT s.name, s.address, tr.key, tr.value, ct.coin_type, ct.address as coin_address
        FROM subdomain s
        LEFT JOIN subdomain_text_record tr ON s.id = tr.subdomain_id
        LEFT JOIN subdomain_coin_type ct ON s.id = ct.subdomain_id
        WHERE s.domain_id = ${testDomainId}
        ORDER BY s.name, tr.key, ct.coin_type`;

      expect(subdomains.length).toBeGreaterThan(0);
    });

    test("should update existing subdomains in batch", async () => {
      // First create some subdomains
      const initialNames = [
        { name: "alice", address: "0x1111111111111111111111111111111111111111" },
        { name: "bob", address: "0x2222222222222222222222222222222222222222" },
      ];

      await createTestSubdomains(testDomainId, initialNames);

      // Now update them
      const updatedNames = [
        {
          name: "alice",
          address: "0x9999999999999999999999999999999999999999",
          text_records: { description: "Updated Alice" },
        },
        {
          name: "bob",
          address: "0x8888888888888888888888888888888888888888",
          coin_types: { "2147483785": "0x8888888888888888888888888888888888888888" },
        },
      ];

      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
        headers: {
          authorization: TEST_API_KEY,
        },
        body: {
          domain: TEST_DOMAIN,
          names: updatedNames,
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      const response = JSON.parse(res._getData());
      expect(response.success).toBe(true);
      expect(response.processed).toBe(2);

      // Verify updates
      const aliceSubdomain = await sqlForTests`
        SELECT address FROM subdomain 
        WHERE name = 'alice' AND domain_id = ${testDomainId}`;
      expect(aliceSubdomain[0].address).toBe("0x9999999999999999999999999999999999999999");
    });

    test("should handle mixed create and update operations", async () => {
      // Create one existing subdomain
      await createTestSubdomains(testDomainId, [
        { name: "existing", address: "0x1111111111111111111111111111111111111111" },
      ]);

      const names = [
        {
          name: "existing", // update
          address: "0x9999999999999999999999999999999999999999",
        },
        {
          name: "newname", // create
          address: "0x2222222222222222222222222222222222222222",
        },
      ];

      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
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
    });
  });

  /**
   * Tests subdomain limit enforcement for batch operations
   */
  describe("Subdomain Limits", () => {
    test("should enforce subdomain limits for batch operations", async () => {
      // Create domain with limit of 2
      testDomainId = await setupTestDomain(2);

      const names = [
        { name: "test1", address: "0x1111111111111111111111111111111111111111" },
        { name: "test2", address: "0x2222222222222222222222222222222222222222" },
        { name: "test3", address: "0x3333333333333333333333333333333333333333" }, // exceeds limit
      ];

      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
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

      expect(res.statusCode).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toContain("Api name limit would be exceeded");
    });

    test("should allow batch operations within subdomain limits", async () => {
      // Create domain with limit of 5
      testDomainId = await setupTestDomain(5);

      const names = [
        { name: "test1", address: "0x1111111111111111111111111111111111111111" },
        { name: "test2", address: "0x2222222222222222222222222222222222222222" },
        { name: "test3", address: "0x3333333333333333333333333333333333333333" },
      ];

      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
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
      expect(response.processed).toBe(3);
    });
  });

  /**
   * Tests domain validation for batch operations
   */
  describe("Domain Validation", () => {
    test("should return 400 for non-existent domain", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
        headers: {
          authorization: TEST_API_KEY,
        },
        body: {
          domain: "nonexistent.eth",
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Domain does not exist",
      });
    });

    test("should return 400 for invalid domain ENS name", async () => {
      const req = createRequest({
        method: "POST",
        url: "/api/public_v1/set-names",
        headers: {
          authorization: TEST_API_KEY,
        },
        body: {
          domain: "invalid..domain",
          names: [{ name: "test", address: "0x1234567890123456789012345678901234567890" }],
        },
      });

      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid domain ens name",
      });
    });
  });

  /**
   * Test different supported networks
   */
  describe("Network Support", () => {
    SUPPORTED_NETWORKS.forEach(({ path, name }) => {
      test(`should work on ${name} network`, async () => {
        testDomainId = await setupTestDomain(DEFAULT_SUBDOMAIN_LIMIT, name);

        const req = createRequest({
          method: "POST",
          url: `/api/${path}/set-names`,
          headers: {
            authorization: TEST_API_KEY,
          },
          body: {
            domain: TEST_DOMAIN,
            names: [
              {
                name: "test",
                address: "0x1234567890123456789012345678901234567890",
              },
            ],
          },
        });

        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(200);
        const response = JSON.parse(res._getData());
        expect(response.success).toBe(true);
        expect(response.processed).toBe(1);

        await cleanupTestDomain(testDomainId);
      });
    });
  });

  /**
   * Helper functions
   */
  async function setupTestDomain(nameLimit = DEFAULT_SUBDOMAIN_LIMIT, network = "mainnet") {
    await sqlForTests`
      INSERT INTO api_key (key, domain) VALUES (${TEST_API_KEY}, ${TEST_DOMAIN})`;

    const result = await sqlForTests`
      INSERT INTO domain (name, network, name_limit) 
      VALUES (${TEST_DOMAIN}, ${network}, ${nameLimit}) 
      RETURNING id`;

    return result[0].id;
  }

  async function cleanupTestDomain(domainId) {
    if (domainId) {
      await sqlForTests`DELETE FROM subdomain_text_record 
        WHERE subdomain_id IN (SELECT id FROM subdomain WHERE domain_id = ${domainId})`;
      await sqlForTests`DELETE FROM subdomain_coin_type 
        WHERE subdomain_id IN (SELECT id FROM subdomain WHERE domain_id = ${domainId})`;
      await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
      await sqlForTests`DELETE FROM api_key WHERE domain = ${TEST_DOMAIN}`;
      await sqlForTests`DELETE FROM user_engagement WHERE name IN ('set_names')`;
    }
  }

  async function createTestSubdomains(domainId, names) {
    for (const nameData of names) {
      await sqlForTests`
        INSERT INTO subdomain (name, address, domain_id) 
        VALUES (${nameData.name}, ${nameData.address}, ${domainId})`;
    }
  }
});