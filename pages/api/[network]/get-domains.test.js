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

const SUPPORTED_NETWORKS = [
  {
    path: "public_v1",
    name: "mainnet",
    domain: DOMAIN_DATA.mainnet,
  },
  {
    path: "public_v1_sepolia",
    name: "sepolia",
    domain: DOMAIN_DATA.sepolia,
  }
];

describe("get-domains API E2E", () => {
  let domainIds = {
    mainnet: null,
    sepolia: null,
  };

  beforeAll(async () => {
    await setupTestDatabase();

    // Set up test data for each network
    for (const network of SUPPORTED_NETWORKS) {
      // Create domain
      const [domain] = await sqlForTests`
        INSERT INTO domain (
          name, 
          network, 
          address, 
          contenthash_raw
        )
        VALUES (
          ${network.domain.name}, 
          ${network.name}, 
          ${network.domain.address}, 
          ${network.domain.contenthash}
        )
        RETURNING id
      `;
      domainIds[network.name] = domain.id;

      // Add admin
      await sqlForTests`
        INSERT INTO admin (domain_id, address)
        VALUES (${domain.id}, ${TEST_ADMIN_ADDRESS})
      `;

      // Add text records
      for (const record of TEXT_RECORDS) {
        await sqlForTests`
          INSERT INTO domain_text_record (domain_id, key, value)
          VALUES (${domain.id}, ${record.key}, ${record.value})
        `;
      }

      // Add coin types
      for (const coin of COIN_TYPES) {
        await sqlForTests`
          INSERT INTO domain_coin_type (domain_id, coin_type, address)
          VALUES (${domain.id}, ${coin.coin_type}, ${coin.address})
        `;
      }
    }
  });

  afterAll(async () => {
    for (const networkName of Object.keys(domainIds)) {
      if (domainIds[networkName]) {
        // Delete in correct order to maintain foreign key constraints
        await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${domainIds[networkName]}`;
        await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${domainIds[networkName]}`;
        await sqlForTests`DELETE FROM admin WHERE domain_id = ${domainIds[networkName]}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${domainIds[networkName]}`;
      }
    }
    await teardownTestDatabase();
  });

  /**
   * Tests network validation:
   * - Empty network parameter returns 400
   * - Invalid network value returns 400
   */
  describe("Network Validation", () => {
    test("getDomains_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "",
          "admin-address": TEST_ADMIN_ADDRESS,
        },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("getDomains_invalidNetwork_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "invalid_network",
          "admin-address": TEST_ADMIN_ADDRESS,
        },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });
  });

  /**
   * Tests admin address validation:
   * - Missing admin-address parameter returns 400
   */
  describe("Admin Address Validation", () => {
    test("getDomains_missingAdminAddress_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: SUPPORTED_NETWORKS[0].path,
        },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Missing required admin-address parameter",
      });
    });
  });

  describe.each(SUPPORTED_NETWORKS)("get-domains API E2E for %s", (networkConfig) => {
    /**
     * Tests retrieving domains for admin address:
     * - Admin address returns associated domains
     * - Non-admin address returns empty array
     * - Address case-insensitivity
     */
    describe("Admin Access Control", () => {
      test("returns domains for admin address", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            "admin-address": TEST_ADMIN_ADDRESS,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].domain).toBe(networkConfig.domain.name);
        expect(responseData[0].address).toBe(networkConfig.domain.address);
        expect(responseData[0].contenthash).toBe(networkConfig.domain.contenthash);
        
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
            network: networkConfig.path,
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
            network: networkConfig.path,
            "admin-address": lowerCaseAddress,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].domain).toBe(networkConfig.domain.name);
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
              ${`test-domain-${networkConfig.name}-${i}.eth`}, 
              ${networkConfig.name}, 
              ${`0xAddress${i}${networkConfig.name}`}
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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
            network: networkConfig.path,
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

    /**
     * Tests that the endpoint properly isolates data by network
     */
    describe("Network Isolation", () => {
      // This test relies on the data created in the main beforeAll
      test("only returns domains from the specified network", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            "admin-address": TEST_ADMIN_ADDRESS,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        
        // All returned domains should be from the requested network
        responseData.forEach(domain => {
          // Check if the domain name matches the pattern for the current network
          expect(domain.domain.includes(networkConfig.name)).toBe(true);
        });
      });
    });
  });
});