/**
 * E2E Tests for /revoke-name
 * Key features tested:
 * - Subdomain revocation
 * - API key authentication
 * - Network validation
 * - Domain validation
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./revoke-name";
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
  // revoke-name is deprecated as specified in the code
  //   {
  //     path: "public_v1_sepolia",
  //     name: "sepolia",
  //     domain: TEST_DOMAIN_SEPOLIA,
  //     apiKey: TEST_API_KEY_SEPOLIA,
  //   },
];

describe("revoke-name API E2E", () => {
  let domainIds = {};

  beforeAll(async () => {
    await setupTestDatabase();

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
    }
  });

  afterAll(async () => {
    for (const domainId of Object.values(domainIds)) {
      await sqlForTests`DELETE FROM api_key WHERE domain_id = ${domainId}`;
      await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
    }
    await teardownTestDatabase();
  });

  describe("Network Validation", () => {
    test("revokeName_noNetworkSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        query: { network: "" },
      });
      const response = createResponse();

      await handler(req, response);

      expect(response._getStatusCode()).toBe(400);
      expect(JSON.parse(response._getData())).toEqual({
        error: "Invalid network",
      });
    });

    test("revokeName_invalidNetwork_returns400", async () => {
      const req = createRequest({
        method: "POST",
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
    "revoke-name API E2E for %s",
    (networkConfig) => {
      beforeEach(async () => {
        // Create 3 subdomains for this network's domain
        for (let i = 1; i <= 3; i++) {
          const [subdomain] = await sqlForTests`
            INSERT INTO subdomain (domain_id, name, address)
            VALUES (
              ${domainIds[networkConfig.name]}, 
              ${`${networkConfig.name}-sub${i}.${networkConfig.domain}`}, 
              ${TEST_ADDRESSES[i]}
            )
            RETURNING id
          `;

          // Add text records
          await sqlForTests`
            INSERT INTO subdomain_text_record (subdomain_id, key, value)
            VALUES 
              (${
                subdomain.id
              }, 'email', ${`${networkConfig.name}${i}@example.com`}),
              (${
                subdomain.id
              }, 'url', ${`https://${networkConfig.name}${i}.example.com`})
          `;

          // Add coin types
          await sqlForTests`
            INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
            VALUES 
              (${subdomain.id}, 60, ${`0x${networkConfig.name}${i}`}),
              (${
                subdomain.id
              }, 2147483785, ${`0xMATIC${networkConfig.name}${i}`})
          `;
        }
      });

      afterEach(async () => {
        // Clean up subdomains and related records for this network
        await sqlForTests`DELETE FROM subdomain_coin_type WHERE subdomain_id IN (
          SELECT id FROM subdomain WHERE domain_id = ${
            domainIds[networkConfig.name]
          }
        )`;
        await sqlForTests`DELETE FROM subdomain_text_record WHERE subdomain_id IN (
          SELECT id FROM subdomain WHERE domain_id = ${
            domainIds[networkConfig.name]
          }
        )`;
        await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${
          domainIds[networkConfig.name]
        }`;
      });

      describe("Parameter validation", () => {
        test("revokeName_noDomainSupplied_returns400", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              name: `${networkConfig.name}-sub1`,
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Missing domain",
          });
        });

        test("revokeName_noNameSupplied_returns400", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Missing name",
          });
        });
      });

      describe("API Key validation", () => {
        test("revokeName_noApiKey_returns401", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: `${networkConfig.name}-sub1`,
            },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });

        test("revokeName_wrongApiKey_returns401", async () => {
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
              name: `${networkConfig.name}-sub1`,
            },
            headers: { authorization: wrongApiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(401);
          expect(JSON.parse(response._getData())).toEqual({
            error: "You are not authorized to use this endpoint",
          });
        });
      });

      describe("Subdomain revocation", () => {
        test("successfully revokes existing subdomain", async () => {
          const subdomainName = `${networkConfig.name}-sub1.${networkConfig.domain}`;

          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: subdomainName,
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(200);
          expect(JSON.parse(response._getData())).toEqual({
            success: true,
          });

          // Verify subdomain and related records were deleted
          const subdomain = await sqlForTests`
            SELECT * FROM subdomain 
            WHERE name = ${subdomainName}
            AND domain_id = ${domainIds[networkConfig.name]}
          `;
          expect(subdomain).toHaveLength(0);

          const textRecords = await sqlForTests`
            SELECT * FROM subdomain_text_record 
            WHERE subdomain_id IN (
              SELECT id FROM subdomain 
              WHERE name = ${subdomainName}
              AND domain_id = ${domainIds[networkConfig.name]}
            )
          `;
          expect(textRecords).toHaveLength(0);

          const coinTypes = await sqlForTests`
            SELECT * FROM subdomain_coin_type 
            WHERE subdomain_id IN (
              SELECT id FROM subdomain 
              WHERE name = ${subdomainName}
              AND domain_id = ${domainIds[networkConfig.name]}
            )
          `;
          expect(coinTypes).toHaveLength(0);
          // Verify other subdomains still exist
          const otherSubdomain = await sqlForTests`
            SELECT * FROM subdomain 
            WHERE domain_id = ${domainIds[networkConfig.name]}
          `;
          expect(otherSubdomain).toHaveLength(2);
        });

        test("returns 400 when subdomain doesn't exist", async () => {
          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: "nonexistent.subdomain",
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Name does not exist",
          });
        });

        test("ensures network isolation - cannot revoke subdomain from other network", async () => {
          const otherNetwork =
            networkConfig.name === "mainnet" ? "sepolia" : "mainnet";
          const subdomainName = `${otherNetwork}-sub1.${networkConfig.domain}`;

          const req = createRequest({
            method: "POST",
            query: {
              network: networkConfig.path,
            },
            body: {
              domain: networkConfig.domain,
              name: subdomainName,
            },
            headers: { authorization: networkConfig.apiKey },
          });
          const response = createResponse();

          await handler(req, response);

          expect(response._getStatusCode()).toBe(400);
          expect(JSON.parse(response._getData())).toEqual({
            error: "Name does not exist",
          });
        });
      });
    }
  );
});
