/**
 * E2E Tests for /set-name
 * Key features tested:
 * - Subdomain creation and updates
 * - Parameter validation
 * - API key authentication
 * - Domain validation
 * - Text record management
 * - Coin type record management
 * - Subdomain limits
 */

/**
 * Set up mocks before imports
 *
 * This is a workaround to mock the database module to use the `TEST_DATABASE_URL` environment variable
 * instead of the `POSTGRES_URI` environment variable.
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./set-name";
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

describe("set-name API E2E", () => {
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
    test("setName_noNetworkSupplied_returns400", async () => {
      const createReq = createRequest({
        method: "POST",
        query: {
          network: "",
        },
        body: {
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
      let response = createResponse();

      await handler(createReq, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("setName_nonValidNetwork_returns400", async () => {
      const createReq = createRequest({
        method: "POST",
        query: {
          network: "non_valid_network",
        },
        body: {
          domain: "nonexistingdomain.eth",
          name: "test",
          address: "0x1234567890123456789012345678901234567890",
        },
      });
      let response = createResponse();

      await handler(createReq, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
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
    "set-name API E2E for %s",
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
        await sqlForTests`DELETE FROM subdomain_coin_type`;
        await sqlForTests`DELETE FROM subdomain_text_record`;
        await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM api_key WHERE domain_id = ${testDomainId}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${testDomainId}`;
      });

      /**
       * Tests missing required parameters:
       * - No address supplied
       * - No name supplied
       * - No domain supplied
       */
      describe("Missing required parameters validation", () => {
        test("setName_noNameSupplied_returns400", async () => {
          const createReq = createRequest({
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

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Missing name",
          });
        });

        test("setName_noDomainSupplied_returns400", async () => {
          const createReq = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              address: "0x1234567890123456789012345678901234567890",
              name: "e2e-test",
            },
          });
          const response = createResponse();

          await handler(createReq, response);

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
        test("setName_noApiKeySupplied_returns401", async () => {
          const createReq = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
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
          const response = createResponse();

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("setName_incorrectApiKey_returns401", async () => {
          const createReq = createRequest({
            method: "POST",
            headers: {
              authorization: "invalid-api-key",
            },
            query: {
              network: networkConfig.path,
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
          const response = createResponse();

          await handler(createReq, response);
          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("setName_validApiKeyButNonExistingDomain_returns404", async () => {
          const createReq = createRequest({
            method: "POST",
            headers: {
              authorization: "test-api-key",
            },
            query: {
              network: networkConfig.path,
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
          const response = createResponse();

          await handler(createReq, response);
          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });
      });

      /**
       * Tests creation of new subdomains:
       * - Basic subdomain with only address
       * - Subdomain with text records
       * - Subdomain with coin types
       * - Subdomain with both text records and coin types
       * - Invalid subdomain name handling
       * - Subdomain limit enforcement
       */
      describe("creates new subdomain", () => {
        beforeEach(async () => {
          // Assert there are no subdomains, coin types, or text records
          const subDomainsForTestDomainBeforeApiCall = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
          expect(subDomainsForTestDomainBeforeApiCall).toHaveLength(0);
          const coinTypesForTestDomainBeforeApiCall = await sqlForTests`
        SELECT * FROM subdomain_coin_type`;
          expect(coinTypesForTestDomainBeforeApiCall).toHaveLength(0);
          const textRecordsForTestDomainBeforeApiCall = await sqlForTests`
        SELECT * FROM subdomain_text_record`;
          expect(textRecordsForTestDomainBeforeApiCall).toHaveLength(0);
        });

        afterEach(async () => {
          // Clean up test data
          await sqlForTests`DELETE FROM subdomain_coin_type`;
          await sqlForTests`DELETE FROM subdomain_text_record`;
          await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
        });

        test("e2e successfully creates subdomain with no coin types or text records", async () => {
          const testSubdomain = "test-subdomain";
          const createReq = createRequest({
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
              name: testSubdomain,
            },
          });
          const response = createResponse();

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(200);
          const subdomains = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
          expect(subdomains).toHaveLength(1);
          const newSubdomain = subdomains[0];
          expect(newSubdomain).toMatchObject({
            name: testSubdomain,
            address: "0x1234567890123456789012345678901234567890",
          });

          const coinTypes = await sqlForTests`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${newSubdomain.id}`;
          expect(coinTypes).toHaveLength(0);

          const textRecords = await sqlForTests`
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

          const createReq = createRequest({
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
              name: testSubdomain,
              text_records: textRecordsData,
            },
          });
          const response = createResponse();

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(200);
          const subdomains = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
          expect(subdomains).toHaveLength(1);
          const newSubdomain = subdomains[0];
          const textRecords = await sqlForTests`
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

          const createReq = createRequest({
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
              name: testSubdomain,
              coin_types: coinTypesData,
            },
          });
          const response = createResponse();

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(200);
          const subdomains = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
          expect(subdomains).toHaveLength(1);
          const newSubdomain = subdomains[0];
          const coinTypes = await sqlForTests`
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

          const createReq = createRequest({
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
              name: testSubdomain,
              text_records: textRecordsData,
              coin_types: coinTypesData,
            },
          });
          const response = createResponse();

          await handler(createReq, response);

          expect(response._getStatusCode()).toBe(200);
          const subdomains = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE domain_id = ${testDomainId}`;
          expect(subdomains).toHaveLength(1);
          const newSubdomain = subdomains[0];
          const textRecords = await sqlForTests`
        SELECT * FROM subdomain_text_record
        WHERE subdomain_id = ${newSubdomain.id}`;
          expect(textRecords).toHaveLength(Object.keys(textRecordsData).length);

          const coinTypes = await sqlForTests`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${newSubdomain.id}`;
          expect(coinTypes).toHaveLength(Object.keys(coinTypesData).length);
        });

        test("returns 400 when subdomain name is invalid", async () => {
          const createReq = createRequest({
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
              name: "invalid!@#$%^&*()",
            },
          });
          const response = createResponse();

          await handler(createReq, response);
          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: expect.stringContaining("Invalid ens name"),
          });
        });

        test("returns 400 when domain has reached subdomain limit", async () => {
          // First, update the domain to have a low limit
          await sqlForTests`
        UPDATE domain 
        SET name_limit = 2 
        WHERE id = ${testDomainId}
      `;

          // Create subdomains up to the limit
          for (let i = 1; i <= 2; i++) {
            const createReq = createRequest({
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
                name: `test-subdomain-${i}`,
              },
            });

            const limitRes = createResponse();
            await handler(createReq, limitRes);
            expect(limitRes._getStatusCode()).toBe(200);
          }

          // Verify we have reached the limit
          const subdomainCount = await sqlForTests`
        SELECT *
        FROM subdomain 
        WHERE domain_id = ${testDomainId}
      `;
          expect(subdomainCount).toHaveLength(2);

          // Try to create one more subdomain
          const exceedLimitReq = createRequest({
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
              name: "test-subdomain-exceed",
            },
          });

          const exceedRes = createResponse();
          await handler(exceedLimitReq, exceedRes);

          // Verify we get a 400 error
          expect(exceedRes._getStatusCode()).toBe(400);
          expect(JSON.parse(exceedRes._getData())).toEqual({
            error: expect.stringContaining("Api name limit reached"),
          });

          // Reset the domain limit for other tests
          await sqlForTests`
        UPDATE domain 
        SET name_limit = ${DEFAULT_SUBDOMAIN_LIMIT}
        WHERE id = ${testDomainId}
      `;
        });
      });

      /**
       * Tests updating existing subdomains:
       * - Address-only updates
       * - Text record updates
       * - Coin type updates
       * - Full subdomain updates (all fields)
       * - Record removal and replacement
       */
      describe("updates existing subdomain", () => {
        const existingSubdomainName = "existing-subdomain";
        const preExistingSubdomainAddress =
          "0x1234567890123456789012345678901234567890";
        const preExistingEmailTextRecord = "old@example.com";
        const preExistingUrlTextRecord = "https://old.example.com";
        const preExistingEthCoinType =
          "0x1111111111111111111111111111111111111111";
        const preExistingBtcCoinType =
          "0x2222222222222222222222222222222222222222";
        let existingSubdomainId;

        beforeEach(async () => {
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
          const response = createResponse();
          await handler(req, response);
          expect(response._getStatusCode()).toBe(200);
          const result = await sqlForTests`
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
          const textRecords = await sqlForTests`
            SELECT * FROM subdomain_text_record 
            WHERE subdomain_id = ${existingSubdomainId}
          `;
          expect(textRecords).toHaveLength(2);
          expect(textRecords).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                key: "email",
                value: preExistingEmailTextRecord,
              }),
              expect.objectContaining({
                key: "url",
                value: preExistingUrlTextRecord,
              }),
            ])
          );

          // Verify coin type records were created
          const coinRecords = await sqlForTests`
            SELECT address, coin_type FROM subdomain_coin_type
            WHERE subdomain_id = ${existingSubdomainId}
          `;
          expect(coinRecords).toHaveLength(2);
          expect(coinRecords).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                coin_type: "60",
                address: preExistingEthCoinType,
              }),
              expect.objectContaining({
                coin_type: "2147483785",
                address: preExistingBtcCoinType,
              }),
            ])
          );
        });

        afterEach(async () => {
          // Clean up test data
          await sqlForTests`DELETE FROM subdomain_coin_type WHERE subdomain_id = ${existingSubdomainId}`;
          await sqlForTests`DELETE FROM subdomain_text_record WHERE subdomain_id = ${existingSubdomainId}`;
          await sqlForTests`DELETE FROM subdomain WHERE id = ${existingSubdomainId}`;
        });

        test("e2e successfully updates subdomain address only", async () => {
          const beforeUpdateSubdomain = await sqlForTests`
            SELECT * FROM subdomain 
            WHERE name = ${existingSubdomainName}
          `;
          const newAddress = "0x9876543210987654321098765432109876543210";
          const updateReq = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              name: existingSubdomainName,
              address: newAddress,
            },
          });

          const updateRes = createResponse();
          await handler(updateReq, updateRes);
          expect(updateRes._getStatusCode()).toBe(200);

          // Verify address was updated but records remain unchanged
          const afterUpdateSubdomain = await sqlForTests`
            SELECT * FROM subdomain 
            WHERE name = ${existingSubdomainName}
          `;
          expect(afterUpdateSubdomain).toHaveLength(1);
          const afterUpdateSubdomainRecord = afterUpdateSubdomain[0];
          expect(afterUpdateSubdomainRecord.address).toBe(newAddress);
          // Verify no coin records exist
          const coinRecords = await sqlForTests`
            SELECT * FROM subdomain_coin_type 
            WHERE subdomain_id = ${existingSubdomainId}
          `;
          expect(coinRecords).toHaveLength(0);
          // Verify no text records exist
          const textRecords = await sqlForTests`
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

          const updateReq = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              name: existingSubdomainName,
              address: "0x1234567890123456789012345678901234567890",
              text_records: newTextRecords,
            },
          });

          const updateRes = createResponse();
          await handler(updateReq, updateRes);
          expect(updateRes._getStatusCode()).toBe(200);

          // Verify text records were updated
          const textRecords = await sqlForTests`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY key
      `;
          expect(textRecords).toHaveLength(Object.keys(newTextRecords).length);

          for (const record of textRecords) {
            expect(record.value).toBe(newTextRecords[record.key]);
          }

          // Verify coin types were removed
          const coinTypes = await sqlForTests`
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

          const updateReq = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              name: existingSubdomainName,
              address: "0x1234567890123456789012345678901234567890",
              coin_types: newCoinTypes,
            },
          });

          const updateRes = createResponse();
          await handler(updateReq, updateRes);
          expect(updateRes._getStatusCode()).toBe(200);

          // Verify coin types were updated
          const coinTypes = await sqlForTests`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY coin_type
      `;
          expect(coinTypes).toHaveLength(Object.keys(newCoinTypes).length);

          for (const record of coinTypes) {
            expect(record.address).toBe(newCoinTypes[record.coin_type]);
          }

          // Verify text records remained unchanged
          const textRecords = await sqlForTests`
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

          const updateReq = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              name: existingSubdomainName,
              address: newAddress,
              text_records: newTextRecords,
              coin_types: newCoinTypes,
            },
          });

          const updateRes = createResponse();
          await handler(updateReq, updateRes);
          expect(updateRes._getStatusCode()).toBe(200);

          // Verify all fields were updated
          const [updatedSubdomain] = await sqlForTests`
        SELECT * FROM subdomain WHERE id = ${existingSubdomainId}
      `;
          expect(updatedSubdomain.address).toBe(newAddress);

          const textRecords = await sqlForTests`
        SELECT * FROM subdomain_text_record 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY key
      `;
          expect(textRecords).toHaveLength(Object.keys(newTextRecords).length);
          for (const record of textRecords) {
            expect(record.value).toBe(newTextRecords[record.key]);
          }

          const coinTypes = await sqlForTests`
        SELECT * FROM subdomain_coin_type 
        WHERE subdomain_id = ${existingSubdomainId}
        ORDER BY coin_type
      `;
          expect(coinTypes).toHaveLength(Object.keys(newCoinTypes).length);
          for (const record of coinTypes) {
            expect(record.address).toBe(newCoinTypes[record.coin_type]);
          }
        });

        test("e2e successfully updates subdomain with empty address", async () => {
          // First, ensure the subdomain has a non-empty address
          await sqlForTests`
            UPDATE subdomain 
            SET address = '0x1234567890123456789012345678901234567890'
            WHERE id = ${existingSubdomainId}
          `;

          // Update with empty address
          const updateReq = createRequest({
            method: "POST",
            headers: {
              authorization: TEST_API_KEY,
            },
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: TEST_DOMAIN,
              name: existingSubdomainName,
              address: "", // Empty address
              text_records: {
                email: "empty@example.com",
              },
            },
          });

          const updateRes = createResponse();
          await handler(updateReq, updateRes);
          expect(updateRes._getStatusCode()).toBe(200);

          // Verify address was updated to empty string
          const [updatedSubdomain] = await sqlForTests`
            SELECT * FROM subdomain WHERE id = ${existingSubdomainId}
          `;
          expect(updatedSubdomain.address).toBe("");

          // Verify text records were updated
          const textRecords = await sqlForTests`
            SELECT * FROM subdomain_text_record 
            WHERE subdomain_id = ${existingSubdomainId}
          `;
          expect(textRecords).toHaveLength(1);
          expect(textRecords[0].key).toBe("email");
          expect(textRecords[0].value).toBe("empty@example.com");
        });
      });
    }
  );
});
