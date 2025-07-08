import { createRequest, createResponse } from "node-mocks-http";
import handler from "./delete-admin";
import sqlForTests from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";

const TEST_DOMAIN = "test-delete-admin.eth";
const TEST_ADMIN_ADDRESS = "0xDeleteAdminTestAddress12345678901234567890";
const TEST_API_KEY = "fake-test-api-key";
const TEST_NETWORK = "mainnet";

describe("delete-admin API E2E", () => {
  let domainId;

  beforeAll(async () => {
    process.env.TEST_API_KEY = TEST_API_KEY;
    await setupTestDatabase();
    // Insert domain
    const [domain] = await sqlForTests`
      INSERT INTO domain (name, network) VALUES (${TEST_DOMAIN}, ${TEST_NETWORK}) RETURNING id
    `;
    domainId = domain.id;
    // Insert API key
    await sqlForTests`
      INSERT INTO api_key (domain_id, key) VALUES (${domainId}, ${TEST_API_KEY})
    `;
    // Insert admin
    await sqlForTests`
      INSERT INTO admin (domain_id, address) VALUES (${domainId}, ${TEST_ADMIN_ADDRESS})
    `;
  });

  afterAll(async () => {
    await sqlForTests`DELETE FROM admin WHERE domain_id = ${domainId}`;
    await sqlForTests`DELETE FROM api_key WHERE domain_id = ${domainId}`;
    await sqlForTests`DELETE FROM domain WHERE id = ${domainId}`;
    await teardownTestDatabase();
  });

  test("successfully deletes an admin", async () => {
    try {
      // Ensure admin exists
      await sqlForTests`INSERT INTO admin (domain_id, address) VALUES (${domainId}, ${TEST_ADMIN_ADDRESS}) ON CONFLICT DO NOTHING`;
      const req = createRequest({
        method: "POST",
        headers: { authorization: TEST_API_KEY },
        body: { domain: TEST_DOMAIN, admin_address: TEST_ADMIN_ADDRESS },
        query: { network: "public_v1" },
      });
      const res = createResponse();
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true });
      // Check DB
      const admins =
        await sqlForTests`SELECT * FROM admin WHERE domain_id = ${domainId} AND address = ${TEST_ADMIN_ADDRESS}`;
      expect(admins.length).toBe(0);
    } catch (err) {
      console.error("Test error (successfully deletes an admin):", err);
      throw err;
    }
  });

  test("missing domain returns 400", async () => {
    const req = createRequest({
      method: "POST",
      headers: { authorization: TEST_API_KEY },
      body: { admin_address: TEST_ADMIN_ADDRESS },
      query: { network: "public_v1" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "Missing domain" });
  });

  test("missing admin_address returns 400", async () => {
    const req = createRequest({
      method: "POST",
      headers: { authorization: TEST_API_KEY },
      body: { domain: TEST_DOMAIN },
      query: { network: "public_v1" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Missing admin_address",
    });
  });

  test("invalid domain returns 400", async () => {
    const req = createRequest({
      method: "POST",
      headers: { authorization: TEST_API_KEY },
      body: { domain: "invalid domain!@#", admin_address: TEST_ADMIN_ADDRESS },
      query: { network: "public_v1" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: "Invalid ens domain" });
  });

  test("unauthorized API key returns 401", async () => {
    const req = createRequest({
      method: "POST",
      headers: { authorization: "wrong-key" },
      body: { domain: TEST_DOMAIN, admin_address: TEST_ADMIN_ADDRESS },
      query: { network: "public_v1" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: "You are not authorized to use this endpoint",
    });
  });

  test("deleting non-existent admin returns 404", async () => {
    // Ensure admin does not exist
    await sqlForTests`DELETE FROM admin WHERE domain_id = ${domainId} AND address = ${TEST_ADMIN_ADDRESS}`;
    const req = createRequest({
      method: "POST",
      headers: { authorization: TEST_API_KEY },
      body: { domain: TEST_DOMAIN, admin_address: TEST_ADMIN_ADDRESS },
      query: { network: "public_v1" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: "Admin not found for this domain",
    });
  });
});
