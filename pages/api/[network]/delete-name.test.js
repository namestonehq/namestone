/**
 * E2E Tests for /delete-name
 * Tests the POST endpoint that deletes a subdomain from a domain.
 *
 * Key features tested:
 * - Subdomain deletion
 * - API key authentication
 * - Network validation
 * - Domain validation
 * - Record cleanup (text records, coin types)
 * - Network and domain isolation
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./delete-name";
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

describe("delete-name API E2E", () => {
  let domainIds = {
    mainnet: {
      first: null,
      second: null,
    },
    sepolia: {
      first: null,
      second: null,
    },
  };

  beforeAll(async () => {
    await setupTestDatabase();

    /**
     * Test Data Setup Per Network:
     * Creates two test domains with deletable subdomains:
     *
     * 1. First domain (with API key):
     *    - Name pattern: "test-{network}.eth"
     *    - Subdomains: ["test1", "test2", "test3"]
     *
     * 2. Second domain (with different API key):
     *    - Name pattern: "second-{network}.eth"
     *    - Subdomains: ["other1", "other2", "other3"]
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
      const firstDomainNames = ["test1", "test2", "test3"];
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
      const secondDomainNames = ["other1", "other2", "other3"];
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
   */
  describe("Network Validation", () => {
    test("deleteName_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "",
        },
        body: {
          domain: TEST_DOMAIN_MAINNET,
          name: "test1",
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

    test("deleteName_invalidNetwork_returns400", async () => {
      const req = createRequest({
        method: "POST",
        query: {
          network: "invalid_network",
        },
        body: {
          domain: TEST_DOMAIN_MAINNET,
          name: "test1",
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

  describe.each(SUPPORTED_NETWORKS)(
    "delete-name API E2E for %s",
    (networkConfig) => {
      /**
       * Parameter Validation Tests
       * Verifies proper handling of required parameters:
       * - Required parameters (domain, name)
       * - API key validation
       * - Authorization checks
       */
      describe("Parameter validation", () => {
        test("deleteName_noDomainSupplied_returns400", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              name: "test1",
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

        test("deleteName_noNameSupplied_returns400", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
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

        test("deleteName_noApiKey_returns401", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "test1",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("deleteName_wrongNetworkApiKey_returns401", async () => {
          const wrongApiKey =
            networkConfig.name === "mainnet"
              ? TEST_API_KEY_SEPOLIA
              : TEST_API_KEY_MAINNET;

          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "test1",
            },
            headers: {
              authorization: wrongApiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });
      });

      /**
       * Deletion Functionality Tests
       * Verifies core deletion features:
       * - Successful deletion of subdomain and all associated records
       * - Domain isolation (prevents cross-domain deletion)
       * - Network isolation (prevents cross-network deletion)
       * - Data integrity (other subdomains and records remain intact)
       */
      describe("Deletion functionality", () => {
        let deletionTestSubdomainId;

        beforeEach(async () => {
          // Create a fresh subdomain for deletion testing
          const [subdomain] = await sqlForTests`
          INSERT INTO subdomain (domain_id, name, address)
          VALUES (
            ${domainIds[networkConfig.name].first},
            ${`name-for-deletion.${networkConfig.domain}`},
            ${TEST_ADDRESSES[1]}
          )
          RETURNING id
        `;
          deletionTestSubdomainId = subdomain.id;

          // Add text records
          await sqlForTests`
          INSERT INTO subdomain_text_record (subdomain_id, key, value)
          VALUES 
            (${deletionTestSubdomainId}, 'email', 'deletion-test@example.com'),
            (${deletionTestSubdomainId}, 'url', 'https://deletion-test.example.com')
        `;

          // Add coin type records
          await sqlForTests`
          INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
          VALUES 
            (${deletionTestSubdomainId}, 60, '0xETH-deletion-test'),
            (${deletionTestSubdomainId}, 0, 'bc1-deletion-test'),
            (${deletionTestSubdomainId}, 2147483785, '0xMATIC-deletion-test')
        `;
        });

        afterEach(async () => {
          // Clean up any remaining records if deletion test failed
          await sqlForTests`
          DELETE FROM subdomain_coin_type 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          await sqlForTests`
          DELETE FROM subdomain_text_record 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          await sqlForTests`
          DELETE FROM subdomain 
          WHERE id = ${deletionTestSubdomainId}
        `;
        });

        test("successfully deletes subdomain with all associated records", async () => {
          // First verify the subdomain and records exist before deletion
          const preDeleteSubdomain = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE id = ${deletionTestSubdomainId}
        `;
          expect(preDeleteSubdomain).toHaveLength(1);

          const preDeleteTextRecords = await sqlForTests`
          SELECT * FROM subdomain_text_record 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          expect(preDeleteTextRecords).toHaveLength(2);

          const preDeleteCoinTypes = await sqlForTests`
          SELECT * FROM subdomain_coin_type 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          expect(preDeleteCoinTypes).toHaveLength(3);

          // Perform deletion
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: `name-for-deletion.${networkConfig.domain}`,
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          expect(JSON.parse(response._getData())).toEqual({
            success: true,
          });

          // Verify complete removal
          const subdomain = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE id = ${deletionTestSubdomainId}
        `;
          expect(subdomain).toHaveLength(0);

          const textRecords = await sqlForTests`
          SELECT * FROM subdomain_text_record 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          expect(textRecords).toHaveLength(0);

          const coinTypes = await sqlForTests`
          SELECT * FROM subdomain_coin_type 
          WHERE subdomain_id = ${deletionTestSubdomainId}
        `;
          expect(coinTypes).toHaveLength(0);

          // Verify other subdomains remain intact
          const otherSubdomains = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE domain_id = ${domainIds[networkConfig.name].first}
          AND id != ${deletionTestSubdomainId}
        `;
          expect(otherSubdomains).toHaveLength(3); // test1, test2, test3
        });

        test("maintains domain isolation - cannot delete subdomain from different domain", async () => {
          // First verify the target subdomain exists in the second domain
          const preDeleteSubdomain = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE name = ${`other1.second-${networkConfig.name}.eth`}
          AND domain_id = ${domainIds[networkConfig.name].second}
        `;
          expect(preDeleteSubdomain).toHaveLength(1);

          // Attempt to delete using first domain's API key
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "other1",
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Name does not exist",
          });

          // Verify subdomain and its records still exist in second domain
          const subdomain = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE name = ${`other1.second-${networkConfig.name}.eth`}
          AND domain_id = ${domainIds[networkConfig.name].second}
        `;
          expect(subdomain).toHaveLength(1);

          const textRecords = await sqlForTests`
          SELECT * FROM subdomain_text_record 
          WHERE subdomain_id = ${subdomain[0].id}
        `;
          expect(textRecords).toHaveLength(2);

          const coinTypes = await sqlForTests`
          SELECT * FROM subdomain_coin_type 
          WHERE subdomain_id = ${subdomain[0].id}
        `;
          expect(coinTypes).toHaveLength(3);
        });

        test("maintains network isolation - cannot delete subdomain from different network", async () => {
          const otherNetwork =
            networkConfig.name === "mainnet" ? "sepolia" : "mainnet";

          // Attempt to delete subdomain from other network
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: `test-${otherNetwork}.eth`,
              name: `test1.${networkConfig.domain}`,
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);

          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });

          // Verify the subdomain still exists in the other network
          const subdomain = await sqlForTests`
          SELECT * FROM subdomain 
          WHERE name = ${`test1.test-${otherNetwork}.eth`}
          AND domain_id IN (
            SELECT id FROM domain 
            WHERE network = ${otherNetwork}
          )
        `;
          expect(subdomain).toHaveLength(1);
        });
      });

      /**
       * Error Cases Tests
       * Verifies proper error handling:
       * - Non-existent subdomain
       * - Non-existent domain
       * - Wrong API key
       */
      describe("Error cases", () => {
        test("returns 400 for non-existent subdomain", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "nonexistent",
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Name does not exist",
          });
        });

        test("returns 401 for non-existent domain", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: "nonexistent.eth",
              name: "test1",
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("returns 401 for wrong API key", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "test1",
            },
            headers: {
              authorization: "wrong-api-key",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });
      });
    }
  );
});
