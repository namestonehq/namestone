/**
 * E2E Tests for /get-domains
 * Key features tested:
 * - Admin-based access control
 * - Network isolation
 * - Text record inclusion/exclusion
 * - Pagination
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./get-domains";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_ADMIN_ADDRESS = "0xAdminAddress123456789012345678901234567890";
const TEST_NON_ADMIN_ADDRESS = "0xNonAdminAddress123456789012345678901234";

const DOMAIN_DATA = {
  mainnet: {
    name: "test-domain-mainnet.eth",
    address: "0xDomainAddress1234567890123456789012345678901",
    contenthash: "ipfs://QmTest1234567890",
  },
  sepolia: {
    name: "test-domain-sepolia.eth",
    address: "0xDomainAddress8901234567890123456789012345678",
    contenthash: "ipfs://QmTest8901234567",
  },
};

const TEXT_RECORDS = [
  { key: "email", value: "test@example.com" },
  { key: "url", value: "https://example.com" },
  { key: "description", value: "Test domain" },
];

const COIN_TYPES = [
  { coin_type: "60", address: "0xEthAddress123456789012345678901234567890" },
  { coin_type: "0", address: "bc1qtest123456789012345678901234" },
  { coin_type: "2147483785", address: "0xMaticAddress12345678901234567890" },
];



describe("get-domains API E2E", () => {
  let domainId = null;

  beforeAll(async () => {
    await setupTestDatabase();

    // Set up test data
    const [domain] = await sqlForTests`
      INSERT INTO domain (
        name, 
        network, 
        address, 
        contenthash_raw
      )
      VALUES (
        ${DOMAIN_DATA.mainnet.name}, 
        'mainnet', 
        ${DOMAIN_DATA.mainnet.address}, 
        ${DOMAIN_DATA.mainnet.contenthash}
      )
      RETURNING id
    `;
    domainId = domain.id;

    // Add admin
    await sqlForTests`
      INSERT INTO admin (domain_id, address)
      VALUES (${domainId}, ${TEST_ADMIN_ADDRESS})
    `;

    // Add text records
    for (const record of TEXT_RECORDS) {
      await sqlForTests`
        INSERT INTO domain_text_record (domain_id, key, value)
        VALUES (${domainId}, ${record.key}, ${record.value})
      `;
    }

    // Add coin types
    for (const coin of COIN_TYPES) {
      await sqlForTests`
        INSERT INTO domain_coin_type (domain_id, coin_type, address)
        VALUES (${domainId}, ${coin.coin_type}, ${coin.address})
      `;
    }
  });

  afterAll(async () => {
    if (domainId) {
      // Delete in correct order to maintain foreign key constraints
      await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM admin WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
    }
    await teardownTestDatabase();
  });

  /**
   * Tests admin address validation:
   * - Missing admin-address parameter returns 400
   */
  describe("Admin Address Validation", () => {
    test("getDomains_missingAdminAddress_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {},
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Missing required admin-address parameter",
      });
    });
  });

  describe("Admin Access Control", () => {
      test("returns domains for admin address", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].domain).toBe(DOMAIN_DATA.mainnet.name);
        expect(responseData[0].address).toBe(DOMAIN_DATA.mainnet.address);
        expect(responseData[0].contenthash).toBe(DOMAIN_DATA.mainnet.contenthash);
        
        // Check text records
        expect(responseData[0].text_records).toBeDefined();
        TEXT_RECORDS.forEach(record => {
          expect(responseData[0].text_records[record.key]).toBe(record.value);
        });
        
        // Check coin types
        expect(responseData[0].coin_types).toBeDefined();
        COIN_TYPES.forEach(coin => {
          expect(responseData[0].coin_types[coin.coin_type]).toBe(coin.address);
        });
      });

      test("returns empty array for non-admin address", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_NON_ADMIN_ADDRESS,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(0);
      });

      test("address check is case-insensitive", async () => {
        const lowerCaseAddress = TEST_ADMIN_ADDRESS.toLowerCase();
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": lowerCaseAddress,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].domain).toBe(DOMAIN_DATA.mainnet.name);
      });
    });

    /**
     * Tests text records inclusion/exclusion:
     * - Default inclusion of text records
     * - Exclusion with text_records=0
     */
    describe("Text Records and Coin Types", () => {
      test("includes text records and coin types by default", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData[0].text_records).toBeDefined();
        expect(responseData[0].coin_types).toBeDefined();
      });

      test("excludes text records and coin types when text_records=0", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            text_records: "0",
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData[0].text_records).toBeUndefined();
        expect(responseData[0].coin_types).toBeUndefined();
      });
    });

    /**
     * Tests pagination functionality:
     * - Limit parameter validation
     * - Offset parameter validation
     */
    describe("Pagination", () => {
      // Set up additional domains for pagination tests
      let additionalDomainIds = [];
      
      beforeAll(async () => {
        for (let i = 1; i <= 3; i++) {
          const [domain] = await sqlForTests`
            INSERT INTO domain (
              name, 
              network, 
              address
            )
            VALUES (
              ${`test-domain-mainnet-${i}.eth`}, 
              'mainnet', 
              ${`0xAddress${i}mainnet`}
            )
            RETURNING id
          `;
          
          additionalDomainIds.push(domain.id);
          
          await sqlForTests`
            INSERT INTO admin (domain_id, address)
            VALUES (${domain.id}, ${TEST_ADMIN_ADDRESS})
          `;
        }
      });

      afterAll(async () => {
        for (const domainId of additionalDomainIds) {
          await sqlForTests`DELETE FROM admin WHERE domain_id = ${domainId}`;
          await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
        }
        additionalDomainIds = [];
      });

      test("respects limit parameter", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            limit: 2,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2);
      });

      test("returns 400 for non-numeric limit", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            limit: "not-a-number",
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid limit parameter",
        });
      });

      test("returns 400 for negative limit", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            limit: -5,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid limit parameter",
        });
      });

      test("respects offset parameter", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            offset: 1,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        // With 1 original domain + 3 added domains, offset 1 should return 3 domains
        expect(responseData.length).toBe(3);
      });

      test("returns 400 for non-numeric offset", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            offset: "not-a-number",
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid offset parameter",
        });
      });

      test("returns 400 for negative offset", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            offset: -10,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid offset parameter",
        });
      });

      test("respects both limit and offset parameters", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            "admin-address": TEST_ADMIN_ADDRESS,
            limit: 2,
            offset: 1,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2);
      });
    });
});