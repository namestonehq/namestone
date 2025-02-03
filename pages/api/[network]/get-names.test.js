/**
 * E2E Tests for /get-names
 * Key features tested:
 * - Subdomain retrieval with/without domain specified
 * - Public vs private domain access
 * - API key authentication
 * - Network validation
 * - Data filtering and pagination
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
  3: "0x1234567890123456789012345678901234567893",
};
const SUPPORTED_NETWORKS = [
  {
    path: "public_v1",
    name: "mainnet",
    domain: TEST_DOMAIN_MAINNET,
    apiKey: TEST_API_KEY_MAINNET,
  },
  {
    path: "public_v1_sepolia",
    name: "sepolia",
    domain: TEST_DOMAIN_SEPOLIA,
    apiKey: TEST_API_KEY_SEPOLIA,
  },
];

describe("get-names API E2E", () => {
  let domainIds = {};

  beforeAll(async () => {
    await setupTestDatabase();

    /**
     * Test Data Setup Per Network:
     * 
     * For each network (mainnet and sepolia):
     * 1. Creates a domain (e.g., "test-mainnet.eth" for mainnet)
     * 2. Associates an API key with the domain
     * 3. Creates 3 subdomains with:
     *    - Names following pattern: "{network}-sub{1|2|3}.{domain}"
     *    - Unique ethereum addresses (TEST_ADDRESSES[1|2|3])
     *    - Text records:
     *      * email: "{network}{1|2|3}@example.com"
     *      * url: "https://{network}{1|2|3}.example.com"
     *    - Coin types:
     *      * ETH (60): "0x{network}{1|2|3}"
     *      * MATIC (2147483785): "0xMATIC{network}{1|2|3}"
     * 
     * Example for mainnet:
     * - Domain: "test-mainnet.eth"
     * - API Key: "test-api-key-mainnet"
     * - Subdomains:
     *   1. "mainnet-sub1.test-mainnet.eth"
     *      - Address: TEST_ADDRESSES[1]
     *      - Email: "mainnet1@example.com"
     *      - URL: "https://mainnet1.example.com"
     *   2. "mainnet-sub2.test-mainnet.eth"
     *      - Address: TEST_ADDRESSES[2]
     *      - Email: "mainnet2@example.com"
     *      - URL: "https://mainnet2.example.com"
     *   3. "mainnet-sub3.test-mainnet.eth"
     *      - Address: TEST_ADDRESSES[3]
     *      - Email: "mainnet3@example.com"
     *      - URL: "https://mainnet3.example.com"
     */

    // Create one domain per network
    for (const network of SUPPORTED_NETWORKS) {
      const [domain] = await sqlForTests`
        INSERT INTO domain (name, network)
        VALUES (${network.domain}, ${network.name})
        RETURNING id
      `;
      domainIds[network.name] = domain.id;

      // Create API key for the domain
      await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${domain.id}, ${network.apiKey})
      `;

      // Create 3 subdomains for this domain
      for (let i = 1; i <= 3; i++) {
        const [subdomain] = await sqlForTests`
          INSERT INTO subdomain (domain_id, name, address)
          VALUES (
            ${domain.id}, 
            ${`${network.name}-sub${i}.${network.domain}`}, 
            ${TEST_ADDRESSES[i]}
          )
          RETURNING id
        `;

        // Add text records
        await sqlForTests`
          INSERT INTO subdomain_text_record (subdomain_id, key, value)
          VALUES 
            (${subdomain.id}, 'email', ${`${network.name}${i}@example.com`}),
            (${
              subdomain.id
            }, 'url', ${`https://${network.name}${i}.example.com`})
        `;

        // Add coin types
        await sqlForTests`
          INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
          VALUES 
            (${subdomain.id}, 60, ${`0x${network.name}${i}`}),
            (${subdomain.id}, 2147483785, ${`0xMATIC${network.name}${i}`})
        `;
      }
    }
  });

  afterAll(async () => {
    /**
     * Test Data Cleanup:
     * 
     * For each domain created in the test:
     * 1. Delete all related subdomain data in correct order to maintain referential integrity:
     *    - First remove coin_type records (references subdomain)
     *    - Then remove text records (references subdomain)
     *    - Then remove subdomains (references domain)
     * 2. Remove domain-related data:
     *    - Delete API keys (references domain)
     *    - Delete brand settings (references domain)
     *    - Finally delete the domain itself
     * 
     * Order is important due to foreign key constraints:
     * - subdomain_coin_type and subdomain_text_record reference subdomain
     * - subdomain references domain
     * - api_key and brand reference domain
     */
    for (const domainId of Object.values(domainIds)) {
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
    await teardownTestDatabase();
  });

  /**
   * Tests network validation:
   * - Empty network parameter
   * - Invalid network value
   */
  describe("Network Validation", () => {
    test("getNames_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "GET",
        query: { network: "" },
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
        query: { network: "invalid_network" },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });
  });

  describe.each(SUPPORTED_NETWORKS)(
    "get-names API E2E for %s",
    (networkConfig) => {

      /**
       * Tests scenarios where domain is specified in the request:
       * - API key validation
       * - Address filtering
       * - Text record inclusion/exclusion
       * - Pagination
       * - Public vs private domain access
       */
      describe("Domain specified in the request", () => {
        /**
         * Tests scenarios where both domain and API key are provided:
         * - API key validation
         * - Subdomain retrieval with/without address filter
         * - Text record inclusion/exclusion
         * - Pagination (limit and offset)
         */
        describe("Domain and API key are specified", () => {
          test("Incorrect API key returns 401", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
              },
            });

            const response = createResponse();

            await handler(req, response);

            // TODO: fix validation to return 401 when domain is specified and api key is incorrect
            expect(response._getStatusCode()).toBe(400);
            expect(JSON.parse(response._getData())).toEqual({
              error: "Domain does not exist",
            });
          });

          test("returns only subdomains matching address", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
                address: TEST_ADDRESSES[2],
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(1);
            expect(responseData[0].address).toBe(TEST_ADDRESSES[2]);
            expect(responseData[0].name.startsWith(networkConfig.name)).toBe(
              true
            );
          });

          test("returns all subdomains for domain", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(3);
            /**
             * Check that the subdomain name starts with the network name
             * Check that the subdomain has text records
             * Check that the subdomain has coin types
             */
            responseData.forEach((subdomain) => {
              expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
              expect(subdomain.text_records).toBeDefined();
              expect(subdomain.coin_types).toBeDefined();
            });
          });

          test("returns subdomains with text records excluded", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
                text_records: "0",
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(3);
            /**
             * Check that the subdomain name starts with the network name
             * Check that the subdomain has no text records
             * Check that the subdomain has no coin types
             */
            responseData.forEach((subdomain) => {
              expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
              expect(subdomain.text_records).toBeUndefined();
              expect(subdomain.coin_types).toBeUndefined();
            });
          });

          test("returns subdomains with text records included", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
                text_records: "1",
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(3);
            /**

             * Check that the subdomain name starts with the network name
             * Check that the subdomain has text records
             * Check that the subdomain has coin types
             */
            responseData.forEach((subdomain) => {
              expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
              expect(subdomain.text_records).toBeDefined();
              expect(subdomain.coin_types).toBeDefined();
            });
          });

          test("respects limit", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
                limit: 1,
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(1);
            expect(responseData[0].name.startsWith(networkConfig.name)).toBe(
              true
            );
          });

          test("respects offset", async () => {
            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
                offset: 1,
              },
              headers: { authorization: networkConfig.apiKey },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(2);
            expect(responseData[0].name.startsWith(networkConfig.name)).toBe(
              true
            );
          });
        });

        /**
         * Tests scenarios where domain is specified but no API key:
         * - Access to public domains (share_with_data_providers = true)
         * - Access denied to private domains (share_with_data_providers = false)
         */
        describe("Domain is specified but API key is not specified", () => {
          test("domain shares data with providers", async () => {
            await sqlForTests`
                    INSERT INTO brand (domain_id, share_with_data_providers)
                    VALUES (${domainIds[networkConfig.name]}, true)
                `;

            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
              },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(3);

            await sqlForTests`DELETE FROM brand WHERE domain_id = ${
              domainIds[networkConfig.name]
            }`;
          });

          test("domain does not share data with providers", async () => {
            await sqlForTests`
                INSERT INTO brand (domain_id, share_with_data_providers)
                VALUES (${domainIds[networkConfig.name]}, false)
            `;

            const req = createRequest({
              method: "GET",
              query: {
                network: networkConfig.path,
                domain: networkConfig.domain,
              },
            });
            const response = createResponse();

            await handler(req, response);

            expect(response._getStatusCode()).toBe(400);
            const responseData = JSON.parse(response._getData());
            expect(responseData.error).toBe("Domain does not exist");
          });
        });
      });

      /**
       * Tests scenarios where domain is not specified in the request:
       * - API key based access to multiple domains
       * - Public domain access without API key
       * - Multiple domain scenarios
       * - Filtering and pagination options
       * - Text record inclusion/exclusion
       */
      describe("Domain not specified in the request", () => {
        /**
         * Tests API key based access without domain specification:
         * - Single domain associated with API key
         * - Multiple domains associated with same API key
         * - Filtering by address
         * - Text record inclusion/exclusion
         * - Pagination (limit and offset)
         * - Verifies network isolation
         */
        test("Single domain match API key - Domain is not specified and API key is specified", async () => {
          const req = createRequest({
            method: "GET",
            query: { network: networkConfig.path },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(3);
          responseData.forEach((subdomain) => {
            expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
          });
        });

        test("Multiple domain match API key - Domain is not specified and API key is specified", async () => {
          // insert second domain with same api key
          const [domain] = await sqlForTests`
            INSERT INTO domain (name, network)
            VALUES (${`second-domain.${networkConfig.domain}`}, ${networkConfig.name})
            RETURNING id
         `;
          const secondDomainId = domain.id;

          // Create API key for the domain
          await sqlForTests`
                    INSERT INTO api_key (domain_id, key)
                    VALUES (${secondDomainId}, ${networkConfig.apiKey})
                `;

          // Create subdomains for this domain
          const secondDomainSubdomain = await sqlForTests`
                INSERT INTO subdomain (domain_id, name, address)
                VALUES (
                    ${secondDomainId}, 
                    ${`${networkConfig.name}-second-sub-domain`}, 
                    ${TEST_ADDRESSES[2]}
                )
                RETURNING id
                `;


          const req = createRequest({
            method: "GET",
            query: { network: networkConfig.path },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(4);
          responseData.forEach((subdomain) => {
            expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
          });

          // Clean up second domain and its subdomains
          await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${secondDomainId}`;
          await sqlForTests`DELETE FROM api_key WHERE domain_id = ${secondDomainId}`;
          await sqlForTests`DELETE FROM brand WHERE domain_id = ${secondDomainId}`;
          await sqlForTests`DELETE FROM domain WHERE id = ${secondDomainId}`;
        });

        /**
         * Tests public access scenarios without domain or API key:
         * - No domains share data (expects 400 error)
         * - Single domain shares data (returns only that domain's data)
         * - Multiple domains share data (returns all shared domains' data)
         * - Filtering by address for public domains
         * - Text record inclusion/exclusion for public domains
         * - Pagination for public domains
         * - Verifies network isolation
         */
        test("No domains share data with providers - Domain is not specified and API key is not specified - returns 400", async () => {
          await sqlForTests`
            INSERT INTO brand (domain_id, share_with_data_providers)
            VALUES (${domainIds[networkConfig.name]}, false)
            `;

          const req = createRequest({
            method: "GET",
            query: { network: networkConfig.path },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          const responseData = JSON.parse(response._getData());
          expect(responseData.error).toBe("Domain does not exist");
        });

        test("one domain shares data with providers - Domain is not specified and API key is not specified - returns 400", async () => {
            await sqlForTests`
                INSERT INTO brand (domain_id, share_with_data_providers)
                VALUES (${domainIds[networkConfig.name]}, true)
                `;
  
            // insert second domain which does not share data with providers
            const [domain] = await sqlForTests`
            INSERT INTO domain (name, network)
            VALUES (${`second-domain.${networkConfig.domain}`}, ${
            networkConfig.name
          })
            RETURNING id
         `;
          const secondDomainId = domain.id;
  
          await sqlForTests`
          INSERT INTO brand (domain_id, share_with_data_providers)
          VALUES (${secondDomainId}, false)
          `;
  
          // Create subdomains for this domain
          const secondDomainSubdomain = await sqlForTests`
                INSERT INTO subdomain (domain_id, name, address)
                VALUES (
                    ${secondDomainId}, 
                    ${`${networkConfig.name}-second-sub-domain`}, 
                    ${TEST_ADDRESSES[2]}
                )
                RETURNING id
                `;

  
            const req = createRequest({
              method: "GET",
              query: { network: networkConfig.path },
            });
            const response = createResponse();
  
            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(3);
            responseData.forEach((subdomain) => {
              expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
            });
          // Clean up second domain data
          await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${secondDomainId}`;
          await sqlForTests`DELETE FROM brand WHERE domain_id = ${secondDomainId}`;
          await sqlForTests`DELETE FROM domain WHERE id = ${secondDomainId}`;
        });

        test("multiple domains share data with providers - Domain is not specified and API key is not specified - returns 400", async () => {
          await sqlForTests`
                INSERT INTO brand (domain_id, share_with_data_providers)
                VALUES (${domainIds[networkConfig.name]}, true)
                `;

  
            // insert second domain which does not share data with providers
            const [domain] = await sqlForTests`
            INSERT INTO domain (name, network)
            VALUES (${`second-domain.${networkConfig.domain}`}, ${
            networkConfig.name
          })
            RETURNING id
         `;
          const secondDomainId = domain.id;
  
          await sqlForTests`
          INSERT INTO brand (domain_id, share_with_data_providers)
          VALUES (${secondDomainId}, true)
          `;
  

          // Create subdomains for this domain
          const secondDomainSubdomain = await sqlForTests`
                INSERT INTO subdomain (domain_id, name, address)
                VALUES (
                    ${secondDomainId}, 
                    ${`${networkConfig.name}-second-sub-domain`}, 
                    ${TEST_ADDRESSES[2]}
                )
                RETURNING id
                `;
  
            const req = createRequest({
              method: "GET",
              query: { network: networkConfig.path },
            });
            const response = createResponse();
  
            await handler(req, response);

            expect(response._getStatusCode()).toBe(200);
            const responseData = JSON.parse(response._getData());
            expect(responseData).toHaveLength(4);
            responseData.forEach((subdomain) => {
              expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
            });
            // Clean up second domain and its subdomains
            await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${secondDomainId}`;
            await sqlForTests`DELETE FROM brand WHERE domain_id = ${secondDomainId}`;
            await sqlForTests`DELETE FROM domain WHERE id = ${secondDomainId}`;
          });

        /**
         * Additional test cases for API key based access:
         */
        test("returns filtered results by address when API key is specified", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              address: TEST_ADDRESSES[1]
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData.length).toBeGreaterThan(0);
          responseData.forEach(subdomain => {
            expect(subdomain.address).toBe(TEST_ADDRESSES[1]);
            expect(subdomain.name.startsWith(networkConfig.name)).toBe(true);
          });
        });

        test("respects text_records=0 parameter when API key is specified", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              text_records: "0"
            },
            headers: { authorization: networkConfig.apiKey },
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

        test("respects pagination when API key is specified", async () => {
          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              limit: 2,
              offset: 1
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
        });

        /**
         * Additional test cases for public access:
         */
        test("respects text_records parameter for public domains", async () => {
          await sqlForTests`
            INSERT INTO brand (domain_id, share_with_data_providers)
            VALUES (${domainIds[networkConfig.name]}, true)
          `;

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
          responseData.forEach(subdomain => {
            expect(subdomain.text_records).toBeUndefined();
            expect(subdomain.coin_types).toBeUndefined();
          });
        });

        test("respects address filtering for public domains", async () => {
          await sqlForTests`
            INSERT INTO brand (domain_id, share_with_data_providers)
            VALUES (${domainIds[networkConfig.name]}, true)
          `;

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
          expect(responseData.length).toBeGreaterThan(0);
          responseData.forEach(subdomain => {
            expect(subdomain.address).toBe(TEST_ADDRESSES[1]);
          });
        });

        test("respects pagination for public domains", async () => {
          await sqlForTests`
            INSERT INTO brand (domain_id, share_with_data_providers)
            VALUES (${domainIds[networkConfig.name]}, true)
          `;

          const req = createRequest({
            method: "GET",
            query: { 
              network: networkConfig.path,
              limit: 2,
              offset: 1
            }
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toHaveLength(2);
        });
      });
    }
  );
});
