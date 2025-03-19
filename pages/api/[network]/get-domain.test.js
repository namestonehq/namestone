/**
 * E2E Tests for /get-domain
 * Key features tested:
 * - Domain retrieval
 * - Parameter validation
 * - API key authentication
 * - Network validation
 * - Text record retrieval
 * - Coin type record retrieval
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./get-domain";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_DOMAIN_MAINNET = "test-mainnet.eth";
const TEST_DOMAIN_SEPOLIA = "test-sepolia.eth";
const TEST_API_KEY_MAINNET = "test-api-key-mainnet";
const TEST_API_KEY_SEPOLIA = "test-api-key-sepolia";
const TEST_ADDRESS = "0x1234567890123456789012345678901234567890";
const TEST_CONTENTHASH =
  "ipfs://bafybeihpam4mwedda5afxtvss3ynsdkoln5p64bwhihlfuqi5lmyzzhdqm";
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

describe("get-domain API E2E", () => {
  let testDomainIds = {};

  beforeAll(async () => {
    await setupTestDatabase();

    // Insert test domains for each network
    for (const network of SUPPORTED_NETWORKS) {
      const [domain] = await sqlForTests`
        INSERT INTO domain (name, network, address, contenthash_raw)
        VALUES (${network.domain}, ${network.name}, ${TEST_ADDRESS}, ${TEST_CONTENTHASH})
        RETURNING id
      `;

      testDomainIds[network.name] = domain.id;

      // Insert API key for the domain with network-specific key
      await sqlForTests`
        INSERT INTO api_key (domain_id, key)
        VALUES (${domain.id}, ${network.apiKey})
      `;

      // Insert test text records
      await sqlForTests`
        INSERT INTO domain_text_record (domain_id, key, value)
        VALUES 
          (${domain.id}, 'email', 'test@example.com'),
          (${domain.id}, 'url', 'https://example.com')
      `;

      // Insert test coin types
      await sqlForTests`
        INSERT INTO domain_coin_type (domain_id, coin_type, address)
        VALUES 
          (${domain.id}, 60, '0xETHAddress'),
          (${domain.id}, 2147483785, '0xMATICAddress')
      `;
    }
  });

  afterAll(async () => {
    for (const domainId of Object.values(testDomainIds)) {
      await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM api_key WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
    }
    await teardownTestDatabase();
  });

  describe("Network Validation", () => {
    test("getDomain_noNetworkSupplied_returns400", async () => {
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

    test("getDomain_invalidNetwork_returns400", async () => {
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

  describe.each(SUPPORTED_NETWORKS)(
    "get-domain API E2E for %s",
    (networkConfig) => {
      describe("Parameter validation", () => {
        test("getDomain_noDomainSupplied_returns400", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            message: "Missing required parameters",
          });
        });

        test("getDomain_nonExistentDomain_returns400", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain: "nonexistent.eth",
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Domain does not exist",
          });
        });
      });

      describe("API Key validation", () => {
        test("getDomain_noApiKey_returns401", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain: networkConfig.domain,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "key error - You are not authorized to use this endpoint",
          });
        });

        test("getDomain_invalidApiKey_returns401", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain: networkConfig.domain,
            },
            headers: {
              authorization: "invalid-key",
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "key error - You are not authorized to use this endpoint",
          });
        });

        test("getDomain_wrongNetworkApiKey_returns401", async () => {
          // Try to access using the API key from the other network
          const wrongApiKey =
            networkConfig.name === "mainnet"
              ? TEST_API_KEY_SEPOLIA
              : TEST_API_KEY_MAINNET;

          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain: networkConfig.domain,
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

      describe("Domain data retrieval", () => {
        test("successfully retrieves domain data", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain: networkConfig.domain,
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          const responseData = JSON.parse(response._getData());
          expect(responseData).toEqual({
            address: TEST_ADDRESS,
            domain: networkConfig.domain,
            contenthash: TEST_CONTENTHASH,
            text_records: {
              email: "test@example.com",
              url: "https://example.com",
            },
            coin_types: {
              60: "0xETHAddress",
              2147483785: "0xMATICAddress",
            },
          });
        });

        test("ensures network isolation - only returns data for specified network", async () => {
          const req = createRequest({
            method: "GET",
            query: {
              network: networkConfig.path,
              domain:
                networkConfig.domain === TEST_DOMAIN_MAINNET
                  ? TEST_DOMAIN_SEPOLIA
                  : TEST_DOMAIN_MAINNET,
            },
            headers: {
              authorization: networkConfig.apiKey,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Domain does not exist",
          });
        });
      });
    }
  );
});
