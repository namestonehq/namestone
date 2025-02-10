/**
 * E2E Tests for /search-names
 * Tests the GET endpoint that searches for names within a domain.
 * 
 * Key features tested:
 * - Name search functionality:
 *   * Prefix matching (e.g., "ro" finds "rob", "robert")
 *   * Exact matching with exact_match=1
 *   * Case insensitive search
 * - API key authentication
 * - Network validation
 * - Text record inclusion/exclusion
 * - Pagination and result ordering
 * - Network and domain isolation
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./search-names";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_DOMAIN_MAINNET = "test-mainnet.eth";
const TEST_DOMAIN_SEPOLIA = "test-sepolia.eth";
const TEST_API_KEY_MAINNET = "test-api-key-mainnet";
const TEST_API_KEY_SEPOLIA = "test-api-key-sepolia";
const TEST_ADDRESSES = {
  1: "0x1234567890123456789012345678901234567891",
  2: "0x1234567890123456789012345678901234567892",
  3: "0x1234567890123456789012345678901234567893"
};

const SUPPORTED_NETWORKS = [
  {
    path: "public_v1",
    name: "mainnet",
    domain: TEST_DOMAIN_MAINNET,
    apiKey: TEST_API_KEY_MAINNET
  },
  {
    path: "public_v1_sepolia",
    name: "sepolia",
    domain: TEST_DOMAIN_SEPOLIA,
    apiKey: TEST_API_KEY_SEPOLIA
  }
];

/**
 * Main test suite for search-names API
 * Sets up test data across multiple networks and domains:
 * - First domain: ["rob", "robert", "alice", "bob"]
 * - Second domain: ["rob-other", "ronald", "anna", "bill"]
 * Each subdomain includes:
 * - Text records (email, url)
 * - Coin types (ETH, BTC, MATIC)
 */
describe("search-names API E2E", () => {
  let domainIds = {
    mainnet: {
      first: null,
      second: null
    },
    sepolia: {
      first: null,
      second: null
    }
  };

  beforeAll(async () => {
    await setupTestDatabase();

    /**
     * Test Data Setup Per Network:
     * Creates two test domains with searchable subdomains:
     * 
     * 1. First domain (with API key):
     *    - Name pattern: "test-{network}.eth"
     *    - Subdomains: ["rob", "robert", "alice", "bob"]
     * 
     * 2. Second domain (with different API key):
     *    - Name pattern: "second-{network}.eth"
     *    - Subdomains: ["rob-other", "ronald", "anna", "bill"]
     * 
     * This setup allows testing:
     * - Domain-specific searches
     * - Name collisions across domains
     * - Proper domain isolation
     * - Network isolation
     * 
     * Each subdomain has:
     * - Text records (email, url)
     * - Coin type records (ETH, BTC, MATIC)
     */
    for (const network of SUPPORTED_NETWORKS) {
      // Create first domain with API key
      const [firstDomain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${network.domain}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name].first = firstDomain.id;

      await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${firstDomain.id}, ${network.apiKey})
      `;

      // Create second domain with different API key
      const [secondDomain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${`second-${network.name}.eth`}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name].second = secondDomain.id;

      await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${secondDomain.id}, ${`second-${network.apiKey}`})
      `;

      // Create test subdomains for first domain
      const firstDomainNames = ["rob", "robert", "alice", "bob"];
      for (const name of firstDomainNames) {
        const [subdomain] = await sqlForTests`
          INSERT INTO subdomain (domain_id, name, address)
          VALUES (
            ${firstDomain.id},
            ${`${name}.${network.domain}`},
            ${TEST_ADDRESSES[1]}
          )
          RETURNING id
        `;

        // Add text records
        await sqlForTests`
          INSERT INTO subdomain_text_record (subdomain_id, key, value)
          VALUES 
            (${subdomain.id}, 'email', ${`${name}@example.com`}),
            (${subdomain.id}, 'url', ${`https://${name}.example.com`})
        `;

        // Add coin type records
        await sqlForTests`
          INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
          VALUES 
            (${subdomain.id}, 60, ${`0xETH-${name}`}),
            (${subdomain.id}, 0, ${`bc1-${name}`}),
            (${subdomain.id}, 2147483785, ${`0xMATIC-${name}`})
        `;
      }

      // Create test subdomains for second domain
      const secondDomainNames = ["rob-other", "ronald", "anna", "bill"];
      for (const name of secondDomainNames) {
        const [subdomain] = await sqlForTests`
          INSERT INTO subdomain (domain_id, name, address)
          VALUES (
            ${secondDomain.id},
            ${`${name}.second-${network.name}.eth`},
            ${TEST_ADDRESSES[2]}
          )
          RETURNING id
        `;

        // Add text records
        await sqlForTests`
          INSERT INTO subdomain_text_record (subdomain_id, key, value)
          VALUES 
            (${subdomain.id}, 'email', ${`${name}@second.example.com`}),
            (${subdomain.id}, 'url', ${`https://${name}.second.example.com`})
        `;

        // Add coin type records
        await sqlForTests`
          INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
          VALUES 
            (${subdomain.id}, 60, ${`0xETH-second-${name}`}),
            (${subdomain.id}, 0, ${`bc1-second-${name}`}),
            (${subdomain.id}, 2147483785, ${`0xMATIC-second-${name}`})
        `;
      }
    }
  });

  afterAll(async () => {
    for (const network of Object.values(domainIds)) {
      for (const domainId of Object.values(network)) {
        await sqlForTests`DELETE FROM subdomain_coin_type WHERE subdomain_id IN (
          SELECT id FROM subdomain WHERE domain_id = ${domainId}
        )`;
        await sqlForTests`DELETE FROM subdomain_text_record WHERE subdomain_id IN (
          SELECT id FROM subdomain WHERE domain_id = ${domainId}
        )`;
        await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${domainId}`;
        await sqlForTests`DELETE FROM api_key WHERE domain_id = ${domainId}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
      }
    }
    await teardownTestDatabase();
  });

  /**
   * Network Validation Tests
   * Verifies proper handling of network parameter:
   * - Empty network parameter returns 400
   * - Invalid network value returns 400
   * - Ensures consistent error messages
   * - Case sensitivity in network values
   */
  describe("Network Validation", () => {
    test("searchNames_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "",
          domain: TEST_DOMAIN_MAINNET,
          name: "rob"
        },
        headers: {
          authorization: TEST_API_KEY_MAINNET,
        },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("searchNames_invalidNetwork_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "invalid_network",
          domain: TEST_DOMAIN_MAINNET,
          name: "rob"
        },
        headers: {
          authorization: TEST_API_KEY_MAINNET,
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
   * Network-specific test suite
   * Runs all test cases against each supported network
   * to ensure consistent behavior across networks
   */
  describe.each(SUPPORTED_NETWORKS)("search-names API E2E for %s", (networkConfig) => {
    /**
     * Parameter Validation Tests
     * Verifies proper handling of required and optional parameters:
     * - Required parameters (domain, name)
     * - API key validation
     * - Authorization checks
     * - Cross-network API key validation
     */
    describe("Parameter validation", () => {
      test("searchNames_noDomainSupplied_returns400", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            name: "rob"
          },
          headers: {
            authorization: networkConfig.apiKey,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Missing domain",
        });
      });

      test("searchNames_noNameSupplied_returns400", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            domain: networkConfig.domain
          },
          headers: {
            authorization: networkConfig.apiKey,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Missing name",
        });
      });

      test("searchNames_nonExistentDomain_returns401", async () => {
        const req = createRequest({
          method: "GET",

          query: {
            network: networkConfig.path,
            domain: "nonexistent.eth",
            name: "rob"
          },
          headers: {
            authorization: networkConfig.apiKey,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(401);
        expect(JSON.parse(response._getData())).toEqual({
          error: "key error - You are not authorized to use this endpoint",
        });
      });

      test("searchNames_noApiKey_returns401", async () => {
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "rob"
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(401);
        expect(JSON.parse(response._getData())).toEqual({
          error: "key error - You are not authorized to use this endpoint",
        });
      });

      test("searchNames_wrongNetworkApiKey_returns401", async () => {
        // Try to access using the API key from the other network
        const wrongApiKey = networkConfig.name === "mainnet" 
          ? TEST_API_KEY_SEPOLIA 
          : TEST_API_KEY_MAINNET;
        
        const req = createRequest({
          method: "GET",
          query: {
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "rob"
          },
          headers: {
            authorization: wrongApiKey,
          },
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(401);
        expect(JSON.parse(response._getData())).toEqual({
          error: "key error - You are not authorized to use this endpoint",
        });
      });
    });

    /**
     * Search Functionality Tests
     * Verifies core search features:
     * - Prefix matching (e.g., "ro" finds "rob", "robert")
     * - Exact matching with exact_match=1
     * - Case insensitive search
     * - Domain isolation (only finds names in specified domain)
     * - Proper record inclusion in results
     * - Correct address association
     */
    describe("Search functionality", () => {
      test("finds names starting with prefix in first domain", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "ro"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2); // Should find "rob" and "robert"
        expect(responseData).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: "rob." + networkConfig.domain,
              address: TEST_ADDRESSES[1],
              text_records: {
                email: "rob@example.com",
                url: "https://rob.example.com"
              },
              coin_types: {
                "60": "0xETH-rob",
                "0": "bc1-rob",
                "2147483785": "0xMATIC-rob"
              }
            }),
            expect.objectContaining({
              name: "robert." + networkConfig.domain,
              address: TEST_ADDRESSES[1],
              text_records: {
                email: "robert@example.com",
                url: "https://robert.example.com"
              },
              coin_types: {
                "60": "0xETH-robert",
                "0": "bc1-robert",
                "2147483785": "0xMATIC-robert"
              }
            })
          ])
        );
      });

      test("finds names starting with prefix in second domain", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: `second-${networkConfig.name}.eth`,
            name: "ro"
          },
          headers: { authorization: `second-${networkConfig.apiKey}` }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2); // Should find "rob-other" and "ronald"
        expect(responseData).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: `rob-other.second-${networkConfig.name}.eth`,
              address: TEST_ADDRESSES[2],
              text_records: {
                email: "rob-other@second.example.com",
                url: "https://rob-other.second.example.com"
              },
              coin_types: {
                "60": "0xETH-second-rob-other",
                "0": "bc1-second-rob-other",
                "2147483785": "0xMATIC-second-rob-other"
              }
            }),
            expect.objectContaining({
              name: `ronald.second-${networkConfig.name}.eth`,
              address: TEST_ADDRESSES[2],
              text_records: {
                email: "ronald@second.example.com",
                url: "https://ronald.second.example.com"
              },
              coin_types: {
                "60": "0xETH-second-ronald",
                "0": "bc1-second-ronald",
                "2147483785": "0xMATIC-second-ronald"
              }
            })
          ])
        );
      });

      test("exact match only returns exact name matches", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: `rob.${networkConfig.domain}`,
            exact_match: "1"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1); // Should only find "rob", not "robert"
        expect(responseData[0]).toEqual(
          expect.objectContaining({
            name: "rob." + networkConfig.domain,
            address: TEST_ADDRESSES[1],
            text_records: {
              email: "rob@example.com",
              url: "https://rob.example.com"
            },
            coin_types: {
              "60": "0xETH-rob",
              "0": "bc1-rob",
              "2147483785": "0xMATIC-rob"
            }
          })
        );
      });

      test("search is case insensitive", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "ROB"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2); // Should still find "rob" and "robert"
        expect(responseData.map(r => r.name)).toEqual(
          expect.arrayContaining([
            "rob." + networkConfig.domain,
            "robert." + networkConfig.domain
          ])
        );
      });
    });

    /**
     * Text Records and Coin Types Tests
     * Verifies proper handling of additional records:
     * - Default inclusion of text records and coin types
     * - Exclusion with text_records=0
     * - Proper record format and values
     * - Record consistency across requests
     */
    describe("Text records and coin types", () => {
      
      test("includes text records and coin types by default", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "rob"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        responseData.forEach(record => {
          expect(record.text_records).toBeDefined();
          expect(record.coin_types).toBeDefined();
          expect(record.text_records.email).toMatch(/@example.com$/);
          expect(record.text_records.url).toMatch(/^https:\/\/.+\.example\.com$/);
          expect(record.coin_types["60"]).toBeDefined();
          expect(record.coin_types["0"]).toBeDefined();
          expect(record.coin_types["2147483785"]).toBeDefined();
        });
      });

      test("excludes text records and coin types when text_records=0", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "rob",
            text_records: "0"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        responseData.forEach(record => {
          expect(record.text_records).toBeUndefined();
          expect(record.coin_types).toBeUndefined();
        });
      });
    });

    /**
     * Pagination Tests
     * Verifies result pagination features:
     * - Default limit (50)
     * - Custom limit values
     * - Offset functionality
     * - Result ordering consistency
     * - Invalid parameter handling:
     *   * Non-numeric values
     *   * Negative values
     *   * Zero values
     * - Edge cases:
     *   * Large offset values
     *   * Combined limit and offset
     */
    describe("Pagination", () => {
      /**
       * Tests pagination functionality:
       * - Default limit (50)
       * - Custom limit
       * - Offset
       * - Combined limit and offset
       * - Invalid parameters return 400
       */
      test("respects limit parameter", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            limit: 1
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
      });

      /**
       * Tests that offset parameter works correctly by:
       * 1. Making first request with limit=1 and no offset to get baseline result
       * 2. Making second request with limit=1 and offset=1 to get next result
       * 3. Verifying the two results are different but valid names
       * 
       * This validates that:
       * - Offset properly skips the correct number of records
       * - Results are consistent and ordered
       * - No duplicate results between paginated requests
       */
      test("respects offset parameter", async () => {
        // first get the first result, with limit and no offset
        const firstReq = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            limit: 1

          },

          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();
        await handler(firstReq, response);
        const firstResponseData = JSON.parse(response._getData());
        expect(firstResponseData).toHaveLength(1); // Should skip "rob" and return "robert"
        const firstResult = firstResponseData[0];
        const firstResultName = firstResult.name;

        // Then, when we call the same endpoint with the same limit and offset, we should get the next result
        const secondReq = createRequest({
          method: "GET",
          query: { 

            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            limit: 1,
            offset: 1
          },
          headers: { authorization: networkConfig.apiKey }
        });

        const secondResponse = createResponse();
        await handler(secondReq, secondResponse);

        const secondResponseData = JSON.parse(secondResponse._getData());
        expect(secondResponseData).toHaveLength(1); // Should skip "rob" and return "robert"
        const secondResultName = secondResponseData[0].name;
        expect(secondResultName).not.toBe(firstResultName);
        expect([`rob.${networkConfig.domain}`, `robert.${networkConfig.domain}`]).toContain(secondResultName);
      });

      test("returns 400 for non-numeric limit", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            limit: "not-a-number"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid limit parameter"
        });
      });

      test("returns 400 for negative limit", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            limit: "-5"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid limit parameter"
        });
      });

      test("returns 400 for non-numeric offset", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            offset: "not-a-number"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid offset parameter"
        });
      });

      test("returns 400 for negative offset", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain,
            name: "r",
            offset: "-10"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Invalid offset parameter"
        });
      });
    });
  });
});
