/**
 * E2E Tests for /set-domain
 * Key features tested:
 * - Domain updates
 * - Parameter validation
 * - API key authentication
 * - Text record management
 * - Coin type record management
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./set-domain";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_DOMAIN = "test.eth";
const TEST_API_KEY = "test-api-key";
const SUPPORTED_NETWORKS = [
  { path: "public_v1", name: "mainnet" },
  { path: "public_v1_sepolia", name: "sepolia" },
];

describe("set-domain API E2E", () => {
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
    test("setDomain_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "",
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
        },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("setDomain_nonValidNetwork_returns400", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "non_valid_network",
        },
        body: {
          domain: TEST_DOMAIN,
          address: "0x1234567890123456789012345678901234567890",
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
   * Tests API functionality for each supported network
   */
  describe.each(SUPPORTED_NETWORKS)(
    "set-domain API E2E for %s",
    (networkConfig) => {
      beforeAll(async () => {
        console.log(`Setting up seed data for ${networkConfig.path}...`);

        // Insert seed data
        const [domain] = await sqlForTests`
          INSERT INTO domain (name, network)
          VALUES (${TEST_DOMAIN}, ${networkConfig.name})
          RETURNING id
        `;

        testDomainId = domain.id;

        // Insert API key for the domain
        await sqlForTests`
          INSERT INTO api_key (domain_id, key)
          VALUES (${testDomainId}, ${TEST_API_KEY})
        `;

        // Verify seed data was inserted correctly
        const domainCount = await sqlForTests`SELECT * FROM domain`;
        const apiKeyCount = await sqlForTests`SELECT * FROM api_key`;

        expect(domainCount.length).toBe(1);
        expect(apiKeyCount.length).toBe(1);

        console.log("Seed data verified successfully");
      });

      afterAll(async () => {
        await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM api_key WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${testDomainId}`;
      });

      /**
       * Tests missing required parameters:
       * - No domain supplied
       */
      describe("Missing required parameters validation", () => {
        test("setDomain_noDomainSupplied_returns400", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              address: "0x1234567890123456789012345678901234567890",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Missing domain",
          });
        });
      });

      /**
       * Tests API key validation:
       * - Missing API key
       * - Invalid API key
       * - Valid API key with non-existing domain
       */
      describe("API Key Validation", () => {
        test("setDomain_noApiKeySupplied_returns401", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: "0x1234567890123456789012345678901234567890",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("setDomain_incorrectApiKey_returns401", async () => {
          const req = createRequest({
            method: "POST",
            headers: {
              authorization: "invalid-api-key",
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: "0x1234567890123456789012345678901234567890",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        // TODO: fix `set-domain` to first check if the domain is even in the database before checking the API key
        // OR have a custom error thrown from inside `checkApiKey` to better inform the user
        test("setDomain_nonExistingDomain_returns400", async () => {
          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: "nonexisting.eth",
              address: "0x1234567890123456789012345678901234567890",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Domain does not exist. Please use /enable-domain.",
          });
        });
      });

      /**
       * Tests domain updates:
       * - Basic domain update with only address
       * - Update with text records
       * - Update with coin types
       * - Update with both text records and coin types
       * - Invalid domain name handling
       */
      describe("updates domain", () => {
        beforeEach(async () => {
          // Verify initial state
          const domain = await sqlForTests`
            SELECT * FROM domain WHERE id = ${testDomainId}
          `;
          expect(domain).toHaveLength(1);

          // Clear any existing records
          await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${testDomainId}`;
          await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${testDomainId}`;

          const textRecords = await sqlForTests`
            SELECT * FROM domain_text_record WHERE domain_id = ${testDomainId}
          `;
          expect(textRecords).toHaveLength(0);

          const coinTypes = await sqlForTests`
            SELECT * FROM domain_coin_type WHERE domain_id = ${testDomainId}
          `;
          expect(coinTypes).toHaveLength(0);
        });

        test("e2e successfully updates domain with address only", async () => {
          const newAddress = "0x9876543210987654321098765432109876543210";
          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: newAddress,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const [updatedDomain] = await sqlForTests`
            SELECT * FROM domain WHERE id = ${testDomainId}
          `;
          expect(updatedDomain.address).toBe(newAddress);
        });

        test("e2e successfully updates domain with text records", async () => {
          const textRecordsData = {
            email: "test@example.com",
            url: "https://example.com",
            description: "Test description",
            avatar: "https://example.com/avatar.png",
            notice: "Test notice",
          };

          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              text_records: textRecordsData,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const textRecords = await sqlForTests`
            SELECT * FROM domain_text_record 
            WHERE domain_id = ${testDomainId}
            ORDER BY key
          `;
          expect(textRecords).toHaveLength(Object.keys(textRecordsData).length);
          for (const record of textRecords) {
            expect(record.value).toBe(textRecordsData[record.key]);
          }
        });

        test("e2e successfully updates domain with coin types", async () => {
          const coinTypesData = {
            60: "0x1111111111111111111111111111111111111111",
            2147483785: "0x2222222222222222222222222222222222222222",
            2147492101: "0x3333333333333333333333333333333333333333",
          };

          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              coin_types: coinTypesData,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const coinTypes = await sqlForTests`
            SELECT * FROM domain_coin_type 
            WHERE domain_id = ${testDomainId}
            ORDER BY coin_type
          `;
          expect(coinTypes).toHaveLength(Object.keys(coinTypesData).length);
          for (const record of coinTypes) {
            expect(record.address).toBe(coinTypesData[record.coin_type]);
          }
        });

        test("e2e successfully updates all domain fields", async () => {
          const newAddress = "0x9999999999999999999999999999999999999999";
          const textRecordsData = {
            email: "complete@example.com",
            avatar: "https://example.com/new-avatar.png",
          };
          const coinTypesData = {
            60: "0x4444444444444444444444444444444444444444",
            2147483785: "0x5555555555555555555555555555555555555555",
          };

          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: newAddress,
              text_records: textRecordsData,
              coin_types: coinTypesData,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);

          // Verify domain update
          const [updatedDomain] = await sqlForTests`
            SELECT * FROM domain WHERE id = ${testDomainId}
          `;
          expect(updatedDomain.address).toBe(newAddress);

          // Verify text records
          const textRecords = await sqlForTests`
            SELECT * FROM domain_text_record 
            WHERE domain_id = ${testDomainId}
            ORDER BY key
          `;
          expect(textRecords).toHaveLength(Object.keys(textRecordsData).length);
          for (const record of textRecords) {
            expect(record.value).toBe(textRecordsData[record.key]);
          }

          // Verify coin types
          const coinTypes = await sqlForTests`
            SELECT * FROM domain_coin_type 
            WHERE domain_id = ${testDomainId}
            ORDER BY coin_type
          `;
          expect(coinTypes).toHaveLength(Object.keys(coinTypesData).length);
          for (const record of coinTypes) {
            expect(record.address).toBe(coinTypesData[record.coin_type]);
          }
        });

        test("returns 400 when domain name is invalid", async () => {
          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: "invalid!@#$%^&*()",
              address: "0x1234567890123456789012345678901234567890",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Invalid ens name",
          });
        });

        test("successfully updates domain with contenthash", async () => {
          const ipfsHash =
            "ipfs://QmTKB75Y73zhNbD3Y73xeXGjYrZHmaXXNxoZqGCagu7r8u";
          const encodedHash = encodeContenthash(ipfsHash);

          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: "0x1234567890123456789012345678901234567890",
              contenthash: ipfsHash,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          expect(JSON.parse(response._getData())).toEqual({
            success: true,
          });

          // Verify contenthash was updated in database
          const updatedDomain = await sqlForTests`
            SELECT * FROM domain 
            WHERE id = ${testDomainId}
          `;
          expect(updatedDomain[0].contenthash).toBe(encodedHash);
          expect(updatedDomain[0].contenthash_raw).toBe(ipfsHash);
        });

        /**
         * TODO: discuss lines 46-48 with team because that code path is not reached even if contenthash is empty string
         *   if (contenthash === "") {
         *     contenthash = null;
         *   }
         *
         */
        test("successfully updates domain with contenthash as empty string", async () => {
          const req = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              address: "0x1234567890123456789012345678901234567890",
              contenthash: "",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          expect(JSON.parse(response._getData())).toEqual({
            success: true,
          });

          // Verify contenthash was updated in database
          const updatedDomain = await sqlForTests`
            SELECT * FROM domain 
            WHERE id = ${testDomainId}
          `;
          expect(updatedDomain[0].contenthash).toBe(null);
          expect(updatedDomain[0].contenthash_raw).toBe(null);
        });
      });
    }
  );
});
