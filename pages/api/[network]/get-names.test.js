/**
 * E2E Tests for /get-names
 * Key features tested:
 * - Domain not specified scenarios:
 *   * API key based access
 *   * Public access (no API key)
 * - Address filtering
 * - Text record inclusion/exclusion
 * - Pagination
 * - Data sharing settings
 * - Network isolation
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./get-names";
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

describe("get-names API E2E", () => {
  let domainIds = {
    mainnet: {},
    sepolia: {}
  };

  beforeAll(async () => {
    await setupTestDatabase();

    /**
     * Test Data Setup Per Network:
     * 
     * For each network (mainnet and sepolia), creates 3 domains:
     * 1. Primary domain (with API key):
     *    - Name pattern: "test-{network}.eth"
     *    - Has API key
     *    - share_with_data_providers = false
     * 
     * 2. Public domain:
     *    - Name pattern: "public-{network}.eth"
     *    - No API key
     *    - share_with_data_providers = true
     * 
     * 3. Private domain:
     *    - Name pattern: "private-{network}.eth"
     *    - No API key
     *    - share_with_data_providers = false
     * 
     * Each domain has 3 subdomains with:
     * - Names following pattern: "{domain-type}-{network}-sub{1|2|3}.{domain}"
     * - Unique ethereum addresses (TEST_ADDRESSES[1|2|3])
     * - Text records:
     *   * email: "{domain-type}-{network}{1|2|3}@example.com"
     *   * url: "https://{domain-type}-{network}{1|2|3}.example.com"
     * - Coin type records:
     *   * ETH (60): "0xETH-{domain-type}-{network}{1|2|3}"
     *   * BTC (0): "bc1-{domain-type}-{network}{1|2|3}"
     *   * MATIC (2147483785): "0xMATIC-{domain-type}-{network}{1|2|3}"
     */
    for (const network of SUPPORTED_NETWORKS) {
      // 1. Create primary domain (with API key)
      const [primaryDomain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${network.domain}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name].primary = primaryDomain.id;

      await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${primaryDomain.id}, ${network.apiKey})
      `;

      await sqlForTests`
        INSERT INTO brand (domain_id, share_with_data_providers)
        VALUES (${primaryDomain.id}, false)
      `;

      // 2. Create public domain
      const [publicDomain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${`public-${network.name}.eth`}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name].public = publicDomain.id;

      await sqlForTests`
        INSERT INTO brand (domain_id, share_with_data_providers)
        VALUES (${publicDomain.id}, true)
      `;

      // 3. Create private domain
      const [privateDomain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${`private-${network.name}.eth`}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name].private = privateDomain.id;

      await sqlForTests`
        INSERT INTO brand (domain_id, share_with_data_providers)
        VALUES (${privateDomain.id}, false)
      `;

      // Create subdomains for each domain
      for (const domainType of ['primary', 'public', 'private']) {
        const domainId = domainIds[network.name][domainType];
        
        for (let i = 1; i <= 3; i++) {
          const [subdomain] = await sqlForTests`
            INSERT INTO subdomain (domain_id, name, address)
            VALUES (
              ${domainId}, 
              ${`${domainType}-${network.name}-sub${i}.${network.domain}`}, 
              ${TEST_ADDRESSES[i]}
            )
            RETURNING id
          `;

          // Add text records
          await sqlForTests`
            INSERT INTO subdomain_text_record (subdomain_id, key, value)
            VALUES 
              (${subdomain.id}, 'email', ${`${domainType}-${network.name}${i}@example.com`}),
              (${subdomain.id}, 'url', ${`https://${domainType}-${network.name}${i}.example.com`})
          `;

          // Add coin type records
          await sqlForTests`
            INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
            VALUES 
              (${subdomain.id}, 60, ${`0xETH-${domainType}-${network.name}${i}`}),
              (${subdomain.id}, 0, ${`bc1-${domainType}-${network.name}${i}`}),
              (${subdomain.id}, 2147483785, ${`0xMATIC-${domainType}-${network.name}${i}`})
          `;
        }
      }
    }
  });

  afterAll(async () => {
    /**
     * Test Data Cleanup:
     * 
     * For each network and each domain type (primary, public, private):
     * 1. Delete all related subdomain data in correct order:
     *    - First remove coin type records (references subdomain)
     *    - Then remove text records (references subdomain)
     *    - Then remove subdomains (references domain)
     * 2. Remove domain-related data:
     *    - Delete API keys (only for primary domains)
     *    - Delete brand settings
     *    - Finally delete the domain itself
     */
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
        await sqlForTests`DELETE FROM brand WHERE domain_id = ${domainId}`;
        await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
      }
    }
    await teardownTestDatabase();
  });

  /**
   * Tests network validation:
   * - Empty network parameter returns 400
   * - Invalid network value returns 400
   * - Ensures consistent error messages
   */
  describe("Network Validation", () => {
    test("getNames_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "",
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

    test("getNames_invalidNetwork_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: {
          network: "invalid_network",
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

  describe.each(SUPPORTED_NETWORKS)("get-names API E2E for %s", (networkConfig) => {
    /**
     * Tests scenarios where domain is not specified and API key is provided.
     * Verifies:
     * - Retrieval of all subdomains from domains associated with API key
     * - Multiple domain access when sharing same API key
     * - Address filtering (single and multiple addresses)
     * - Text records and coin types inclusion/exclusion
     * - Pagination (limit and offset)
     * - Network isolation (only returns data from correct network)
     */
    describe("Domain not specified with API key", () => {
      test("retrieves all subdomains for API key's domains", async () => {
        const req = createRequest({
          method: "GET",
          query: { network: networkConfig.path },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3); // 3 subdomains from primary domain
        responseData.forEach(subdomain => {
          expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
          expect(subdomain.text_records).toBeDefined();
          expect(subdomain.text_records.email).toBeDefined();
          expect(subdomain.text_records.url).toBeDefined();
          expect(subdomain.coin_types).toBeDefined();
          expect(subdomain.coin_types["60"]).toMatch(new RegExp(`0xETH-primary-${networkConfig.name}`));
          expect(subdomain.coin_types["0"]).toMatch(new RegExp(`bc1-primary-${networkConfig.name}`));
          expect(subdomain.coin_types["2147483785"]).toMatch(new RegExp(`0xMATIC-primary-${networkConfig.name}`));
        });
      });

      test("filters by single address", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            address: TEST_ADDRESSES[1]
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].address).toBe(TEST_ADDRESSES[1]);
        expect(responseData[0].name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
      });

      test("filters by multiple addresses", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            address: `${TEST_ADDRESSES[1]},${TEST_ADDRESSES[2]}`
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2);
        responseData.forEach(subdomain => {
          expect([TEST_ADDRESSES[1], TEST_ADDRESSES[2]].includes(subdomain.address)).toBe(true);
          expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
        });
      });

      test("excludes text records when text_records=0", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            text_records: "0"
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3);
        responseData.forEach(subdomain => {
          expect(subdomain.text_records).toBeUndefined();
          expect(subdomain.coin_types).toBeUndefined();
          expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
        });
      });

      describe("Address filtering", () => {
        /**
         * Tests address filtering functionality:
         * - Single address filtering
         * - Multiple address filtering
         * - Empty results when no matches
         * - Correct network isolation
         */
        test("filters by single address", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              address: TEST_ADDRESSES[1]
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
          expect(responseData[0].address).toBe(TEST_ADDRESSES[1]);
          expect(responseData[0].name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
        });

        test("filters by multiple addresses", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              address: `${TEST_ADDRESSES[1]},${TEST_ADDRESSES[2]}`
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect([TEST_ADDRESSES[1], TEST_ADDRESSES[2]].includes(subdomain.address)).toBe(true);
            expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
          });
        });
      });

      describe("Text records and coin types", () => {
        /**
         * Tests record management:
         * - Default inclusion of records
         * - Exclusion with text_records=0
         * - Proper formatting of records
         * - Network-specific record values
         */
        test("includes text records and coin types by default", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeDefined();
            expect(subdomain.coin_types).toBeDefined();
          });
        });

        test("excludes text records and coin types when text_records=0", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              text_records: "0"
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeUndefined();
            expect(subdomain.coin_types).toBeUndefined();
          });
        });
      });

      describe("Pagination", () => {
        /**
         * Tests pagination functionality:
         * - Limit parameter behavior (0 means return all items)
         * - Offset parameter behavior
         * - Combined limit and offset
         * - Edge cases:
         *   * Invalid parameter formats (non-numeric)
         *   * Negative values (returns 400)
         *   * Zero limit (returns all results)
         *   * Extremely large values
         */
        test("respects limit parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 2
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
        });

        test("limit=0 returns all results", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 0
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3); // Should get all records
        });

        test("returns 400 for non-numeric limit", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
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
              limit: -5
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
              offset: -10
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

        test("handles offset larger than data set by returning empty array", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              offset: 1000
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(0);
        });

        test("respects both limit and offset parameters", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 1,
              offset: 1
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
        });
      });

      test("retrieves subdomains from multiple domains when they share API key", async () => {
        // Add API key to private domain
        await sqlForTests`
          INSERT INTO api_key (domain_id, key)
          VALUES (${domainIds[networkConfig.name].private}, ${networkConfig.apiKey})
        `;

        const req = createRequest({
          method: "GET",
          query: { network: networkConfig.path },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        
        // Should get 6 subdomains (3 from primary + 3 from private domain)
        expect(responseData).toHaveLength(6);
        
        // Verify we get subdomains from both domains
        const primaryDomainCount = responseData.filter(subdomain => 
          subdomain.name.startsWith(`primary-${networkConfig.name}`)
        ).length;
        const privateDomainCount = responseData.filter(subdomain => 
          subdomain.name.startsWith(`private-${networkConfig.name}`)
        ).length;
        
        expect(primaryDomainCount).toBe(3);
        expect(privateDomainCount).toBe(3);

        responseData.forEach(subdomain => {
          // Verify domain prefix
          const domainType = subdomain.name.startsWith(`primary-${networkConfig.name}`) ? 'primary' : 'private';
          
          // Check coin types match the domain type
          expect(subdomain.coin_types).toBeDefined();
          expect(subdomain.coin_types["60"]).toMatch(new RegExp(`0xETH-${domainType}-${networkConfig.name}`));
          expect(subdomain.coin_types["0"]).toMatch(new RegExp(`bc1-${domainType}-${networkConfig.name}`));
          expect(subdomain.coin_types["2147483785"]).toMatch(new RegExp(`0xMATIC-${domainType}-${networkConfig.name}`));
        });

        // Clean up the additional API key
        await sqlForTests`
          DELETE FROM api_key 
          WHERE domain_id = ${domainIds[networkConfig.name].private}
        `;
      });

      test("filters by address across multiple domains sharing API key", async () => {
        // Add API key to private domain
        await sqlForTests`
          INSERT INTO api_key (domain_id, key)
          VALUES (${domainIds[networkConfig.name].private}, ${networkConfig.apiKey})
        `;

        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            address: TEST_ADDRESSES[1]
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        
        // Should get 2 subdomains (1 from each domain with TEST_ADDRESSES[1])
        expect(responseData).toHaveLength(2);
        responseData.forEach(subdomain => {
          expect(subdomain.address).toBe(TEST_ADDRESSES[1]);
          // Verify subdomains come from different domains
          expect(
            subdomain.name.startsWith(`primary-${networkConfig.name}`) || 
            subdomain.name.startsWith(`private-${networkConfig.name}`)
          ).toBe(true);
        });

        // Clean up the additional API key
        await sqlForTests`
          DELETE FROM api_key 
          WHERE domain_id = ${domainIds[networkConfig.name].private}
        `;
      });
    });

    /**
     * Tests scenarios where domain is not specified and no API key is provided.
     * Verifies:
     * - Only returns data from domains that share with providers
     * - Address filtering for public domains
     * - Text records and coin types for public domains
     * - Pagination for public access
     * - Error handling when no public domains exist
     * - Network isolation for public access
     */
    describe("Domain not specified without API key", () => {
      test("returns only subdomains from public domains", async () => {
        const req = createRequest({
          method: "GET",
          query: { network: networkConfig.path }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3);
        responseData.forEach(subdomain => {
          expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          // Check text records
          expect(subdomain.text_records).toBeDefined();
          expect(subdomain.text_records.email).toBeDefined();
          expect(subdomain.text_records.url).toBeDefined();
          // Check coin types
          expect(subdomain.coin_types).toBeDefined();
          expect(subdomain.coin_types["60"]).toMatch(new RegExp(`0xETH-public-${networkConfig.name}`));
          expect(subdomain.coin_types["0"]).toMatch(new RegExp(`bc1-public-${networkConfig.name}`));
          expect(subdomain.coin_types["2147483785"]).toMatch(new RegExp(`0xMATIC-public-${networkConfig.name}`));
        });
      });

      test("filters by single address for public domains", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            address: TEST_ADDRESSES[1]
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(1);
        expect(responseData[0].address).toBe(TEST_ADDRESSES[1]);
        expect(responseData[0].name.startsWith(`public-${networkConfig.name}`)).toBe(true);
      });

      test("filters by multiple addresses for public domains", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            address: `${TEST_ADDRESSES[1]},${TEST_ADDRESSES[2]}`
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(2);
        responseData.forEach(subdomain => {
          expect([TEST_ADDRESSES[1], TEST_ADDRESSES[2]].includes(subdomain.address)).toBe(true);
          expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
        });
      });

      test("excludes text records when text_records=0 for public domains", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            text_records: "0"
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3);
        responseData.forEach(subdomain => {
          expect(subdomain.text_records).toBeUndefined();
          expect(subdomain.coin_types).toBeUndefined();
          expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
        });
      });

      describe("Pagination for public domains", () => {
        test("respects limit parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              limit: 2
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });

        test("respects offset parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              offset: 1
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });

        test("respects both limit and offset parameters", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              limit: 1,
              offset: 1
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
          expect(responseData[0].name.startsWith(`public-${networkConfig.name}`)).toBe(true);
        });
      });

      test("returns 400 when no domains share data with providers", async () => {
        // Temporarily set public domain to not share data
        await sqlForTests`
          UPDATE brand 
          SET share_with_data_providers = false 
          WHERE domain_id = ${domainIds[networkConfig.name].public}
        `;

        const req = createRequest({
          method: "GET",
          query: { network: networkConfig.path }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Domain does not exist"
        });

        // Reset public domain sharing setting
        await sqlForTests`
          UPDATE brand 
          SET share_with_data_providers = true 
          WHERE domain_id = ${domainIds[networkConfig.name].public}
        `;
      });
    });

    /**
     * Tests scenarios where domain is specified and API key is provided.
     * Verifies:
     * - Retrieval of subdomains for specific domain
     * - API key authorization
     * - Address filtering within domain
     * - Text records and coin types management
     * - Pagination within domain
     * - Error cases (invalid API key, non-existent domain)
     * - Network isolation for domain-specific access
     */
    describe("Domain specified with API key", () => {
      test("retrieves all subdomains for specified domain", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: networkConfig.domain
          },
          headers: { authorization: networkConfig.apiKey }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3);
        responseData.forEach(subdomain => {
          expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
          expect(subdomain.text_records).toBeDefined();
          expect(subdomain.text_records.email).toBeDefined();
          expect(subdomain.text_records.url).toBeDefined();
          expect(subdomain.coin_types).toBeDefined();
          expect(subdomain.coin_types["60"]).toMatch(new RegExp(`0xETH-primary-${networkConfig.name}`));
          expect(subdomain.coin_types["0"]).toMatch(new RegExp(`bc1-primary-${networkConfig.name}`));
          expect(subdomain.coin_types["2147483785"]).toMatch(new RegExp(`0xMATIC-primary-${networkConfig.name}`));
        });
      });

      describe("Address filtering", () => {
        /**
         * Tests address filtering functionality:
         * - Single address filtering
         * - Multiple address filtering
         * - Empty results when no matches
         * - Correct network isolation
         */
        test("filters by single address", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              address: TEST_ADDRESSES[1]
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
          expect(responseData[0].address).toBe(TEST_ADDRESSES[1]);
          expect(responseData[0].name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
        });

        test("filters by multiple addresses", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              address: `${TEST_ADDRESSES[1]},${TEST_ADDRESSES[2]}`
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect([TEST_ADDRESSES[1], TEST_ADDRESSES[2]].includes(subdomain.address)).toBe(true);
            expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
          });
        });
      });

      describe("Text records and coin types", () => {
        /**
         * Tests record management:
         * - Default inclusion of records
         * - Exclusion with text_records=0
         * - Proper formatting of records
         * - Network-specific record values
         */
        test("includes text records and coin types by default", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeDefined();
            expect(subdomain.coin_types).toBeDefined();
          });
        });

        test("excludes text records and coin types when text_records=0", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              text_records: "0"
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeUndefined();
            expect(subdomain.coin_types).toBeUndefined();
          });
        });
      });

      describe("Pagination", () => {
        /**
         * Tests pagination functionality:
         * - Limit parameter behavior (0 means return all items)
         * - Offset parameter behavior
         * - Combined limit and offset
         * - Edge cases:
         *   * Invalid parameter formats (non-numeric)
         *   * Negative values (returns 400)
         *   * Zero limit (returns all results)
         *   * Extremely large values
         */
        test("respects limit parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 2
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
        });

        test("limit=0 returns all results", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 0
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3); // Should get all records
        });

        test("returns 400 for non-numeric limit", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
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
              limit: -5
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
              offset: -10
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

        test("handles offset larger than data set by returning empty array", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              offset: 1000
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(0);
        });

        test("respects both limit and offset parameters", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain,
              limit: 1,
              offset: 1
            },
            headers: { authorization: networkConfig.apiKey }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
        });
      });

      describe("Error cases", () => {
        /**
         * Tests error handling:
         * - Invalid API keys
         * - Non-existent domains
         * - Invalid parameters
         * - Proper error messages
         */
        test("returns 401 with invalid API key", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain
            },
            headers: { authorization: "invalid-key" }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Domain does not exist"
          });
        });

        test("returns 400 for non-existent domain", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: "nonexistent.eth"
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400;
          expect(JSON.parse(response._getData())).toEqual({
            error: "Domain does not exist"
          });
        });
      });
    });

    /**
     * Tests scenarios where domain is specified but no API key is provided.
     * Verifies:
     * - Access to public domains without API key
     * - Denial of access to private domains
     * - Address filtering for public domain access
     * - Text records and coin types for public domains
     * - Pagination for public domain access
     * - Multiple public domains scenarios
     * - Network isolation for public domain access
     */
    describe("Domain specified without API key", () => {
      test("returns subdomains for public domain", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: `public-${networkConfig.name}.eth`
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(200);
        const responseData = JSON.parse(response._getData());
        expect(responseData).toHaveLength(3);
        responseData.forEach(subdomain => {
          expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          expect(subdomain.text_records).toBeDefined();
          expect(subdomain.text_records.email).toBeDefined();
          expect(subdomain.text_records.url).toBeDefined();
          expect(subdomain.coin_types).toBeDefined();
          expect(subdomain.coin_types["60"]).toMatch(new RegExp(`0xETH-public-${networkConfig.name}`));
          expect(subdomain.coin_types["0"]).toMatch(new RegExp(`bc1-public-${networkConfig.name}`));
          expect(subdomain.coin_types["2147483785"]).toMatch(new RegExp(`0xMATIC-public-${networkConfig.name}`));
        });
      });

      test("returns 400 when accessing private domain without API key", async () => {
        const req = createRequest({
          method: "GET",
          query: { 
            network: networkConfig.path,
            domain: `private-${networkConfig.name}.eth`
          }
        });
        const response = createResponse();

        await handler(req, response);

        expect(response._getStatusCode()).toBe(400);
        expect(JSON.parse(response._getData())).toEqual({
          error: "Domain does not exist"
        });
      });

      describe("Address filtering", () => {
        /**
         * Tests address filtering functionality:
         * - Single address filtering
         * - Multiple address filtering
         * - Empty results when no matches
         * - Correct network isolation
         */
        test("filters by single address for public domain", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              address: TEST_ADDRESSES[1]
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
          expect(responseData[0].address).toBe(TEST_ADDRESSES[1]);
          expect(responseData[0].name.startsWith(`public-${networkConfig.name}`)).toBe(true);
        });

        test("filters by multiple addresses for public domain", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              address: `${TEST_ADDRESSES[1]},${TEST_ADDRESSES[2]}`
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect([TEST_ADDRESSES[1], TEST_ADDRESSES[2]].includes(subdomain.address)).toBe(true);
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });
      });

      describe("Text records and coin types", () => {
        /**
         * Tests record management:
         * - Default inclusion of records
         * - Exclusion with text_records=0
         * - Proper formatting of records
         * - Network-specific record values
         */
        test("excludes text records and coin types when text_records=0", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              text_records: "0"
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeUndefined();
            expect(subdomain.coin_types).toBeUndefined();
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });
      });

      describe("Pagination", () => {
        /**
         * Tests pagination functionality:
         * - Limit parameter behavior
         * - Offset parameter behavior
         * - Combined limit and offset
         * - Edge cases:
         *   * Zero limit/offset
         *   * Negative limit/offset
         *   * Extremely large values
         */
        test("respects limit parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              limit: 2
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });

        test("respects offset parameter", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              offset: 1
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });

        test("respects both limit and offset parameters", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              limit: 1,
              offset: 1
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(1);
          expect(responseData[0].name.startsWith(`public-${networkConfig.name}`)).toBe(true);
        });

        test("handles zero limit as no limit specified", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              limit: 0
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3);
        });

        // test("treats negative limit as zero and returns empty array", async () => {
        //   const req = createRequest({
        //     method: "GET",
        //     query: { 
        //       network: networkConfig.path,
        //       domain: `public-${networkConfig.name}.eth`,
        //       limit: -1
        //     }
        //   });
        //   const response = createResponse();

        //   await handler(req, response);

        //   expect(response._getStatusCode()).toBe(200);
        //   const responseData = JSON.parse(response._getData());
        //   expect(responseData).toHaveLength(0);
        // });

        // test("treats negative offset as zero", async () => {
        //   const req = createRequest({
        //     method: "GET",
        //     query: { 
        //       network: networkConfig.path,
        //       domain: `public-${networkConfig.name}.eth`,
        //       offset: -1
        //     }
        //   });
        //   const response = createResponse();

        //   await handler(req, response);

        //   expect(response._getStatusCode()).toBe(200);
        //   const responseData = JSON.parse(response._getData());
        //   expect(responseData).toHaveLength(3); // Should get all records as offset is treated as 0
        // });

        test("handles offset larger than data set by returning empty array", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`,
              offset: 1000
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(0);
        });
      });

      describe("Multiple public domains scenario", () => {
        /**
         * Tests behavior with multiple public domains:
         * - Domain-specific data isolation
         * - Proper data sharing settings
         * - Access control
         * - Network isolation
         */
        beforeEach(async () => {
          // Temporarily set primary domain to share data
          await sqlForTests`
            UPDATE brand 
            SET share_with_data_providers = true 
            WHERE domain_id = ${domainIds[networkConfig.name].primary}
          `;
        });

        afterEach(async () => {
          // Reset primary domain sharing setting
          await sqlForTests`
            UPDATE brand 
            SET share_with_data_providers = false 
            WHERE domain_id = ${domainIds[networkConfig.name].primary}
          `;
        });

        test("returns subdomains only for requested domain even if multiple domains are public", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: `public-${networkConfig.name}.eth`
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`public-${networkConfig.name}`)).toBe(true);
          });
        });

        test("can access primary domain subdomains when it's public", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              domain: networkConfig.domain
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3);
          responseData.forEach(subdomain => {
            expect(subdomain.name.startsWith(`primary-${networkConfig.name}`)).toBe(true);
          });
        });
      });
    });
  });
});
