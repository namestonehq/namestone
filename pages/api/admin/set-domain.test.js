/**
 * E2E Tests for /admin/set-domain
 * Key features tested:
 * - Logging verification
 * - Admin authorization
 * - Parameter validation
 * - Domain records updates (address, contenthash, text records, coin types)
 */

/**
 * Set up mocks before imports
 *
 * This is a workaround to mock the database module to use the `TEST_DATABASE_URL` environment variable
 * instead of the `POSTGRES_URI` environment variable.
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./set-domain";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";

// Mock the ServerUtils functions
jest.mock("../../../utils/ServerUtils", () => ({
  getAdminTokenById: jest.fn(),
  getClientIp: jest.fn(() => "127.0.0.1")
}));

// Import the mocked functions
import { getAdminTokenById, getClientIp } from "../../../utils/ServerUtils";

const TEST_ADMIN_ADDRESS = "0xAdminAddress123456789012345678901234567890";

describe("set-domain API E2E", () => {
  let testDomainId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a test domain
    const [domain] = await sqlForTests`
      INSERT INTO domain (name, network)
      VALUES ('test.eth', 'mainnet')
      RETURNING id
    `;
    testDomainId = domain.id;

    // Mock admin token
    getAdminTokenById.mockResolvedValue({
      sub: TEST_ADMIN_ADDRESS,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await sqlForTests`DELETE FROM domain_text_record WHERE domain_id = ${testDomainId}`;
    await sqlForTests`DELETE FROM domain_coin_type WHERE domain_id = ${testDomainId}`;
    await sqlForTests`DELETE FROM domain WHERE id = ${testDomainId}`;
  });

  /**
   * Tests user engagement logging:
   * - Verify engagement record is created
   */
  describe("User Engagement Logging", () => {
    test("setDomain_logsUserEngagement_returns200", async () => {
      const testAddress = "0x1234567890123456789012345678901234567890";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: testAddress,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify user engagement was logged
      const engagementRecords = await sqlForTests`
        SELECT * FROM user_engagement 
        WHERE address = ${TEST_ADMIN_ADDRESS}
        AND name = 'admin_set_domain'
      `;
      expect(engagementRecords.length).toBe(1);

      const engagementDetails = JSON.parse(engagementRecords[0].details);
      expect(engagementDetails.domain_id).toBe(testDomainId);
      expect(engagementDetails.address).toBe(testAddress);
    });
  });

  /**
   * Tests authorization:
   * - No admin token
   * - Invalid admin token
   */
  describe("Authorization Validation", () => {
    test("setDomain_noAdminToken_returns401", async () => {
      // Mock no admin token
      getAdminTokenById.mockResolvedValue(null);

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: "You are not authorized to use this endpoint",
      });
    });
  });

  /**
   * Tests parameter validation:
   * - No domain_id supplied
   * - Invalid domain_id (non-existent)
   */
  describe("Parameter Validation", () => {
    test("setDomain_noDomainIdSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Id is required",
      });
    });

    test("setDomain_nonExistentDomainId_returns400", async () => {
      const nonExistentDomainId = 9999;
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: nonExistentDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Domain does not exist",
      });
    });
  });

  /**
   * Tests address updates:
   * - Update address only
   * - Update to null address (clear address)
   */
  describe("Address Updates", () => {
    test("setDomain_updatesAddressOnly_returns200", async () => {
      const testAddress = "0x1234567890123456789012345678901234567890";
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: testAddress,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify address was updated
      const domainAfterUpdate = await sqlForTests`
        SELECT address FROM domain WHERE id = ${testDomainId}
      `;
      expect(domainAfterUpdate[0].address).toBe(testAddress);
    });

    test("setDomain_clearsAddress_returns200", async () => {
      // First set an address
      await sqlForTests`
        UPDATE domain SET address = '0x1234567890123456789012345678901234567890'
        WHERE id = ${testDomainId}
      `;

      // Then clear it
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: null,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify address was cleared
      const domainAfterUpdate = await sqlForTests`
        SELECT address FROM domain WHERE id = ${testDomainId}
      `;
      expect(domainAfterUpdate[0].address).toBeNull();
    });
  });

  /**
   * Tests contenthash updates:
   * - Update contenthash only
   * - Update with invalid contenthash
   * - Clear contenthash
   */
  describe("Contenthash Updates", () => {
    test("setDomain_updatesContenthash_returns200", async () => {
      const testContenthash =
        "ipfs://QmTK1JVrBxcoKUyXRprCeBY8c1vefnH3oC4K9s8zpHYZaj";
      const encodedContenthash = encodeContenthash(testContenthash);

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          contenthash: testContenthash,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify contenthash was updated
      const domainAfterUpdate = await sqlForTests`
        SELECT contenthash, contenthash_raw FROM domain WHERE id = ${testDomainId}
      `;
      expect(domainAfterUpdate[0].contenthash).toBe(encodedContenthash);
      expect(domainAfterUpdate[0].contenthash_raw).toBe(testContenthash);
    });

    test("setDomain_invalidContenthash_returns400", async () => {
      const invalidContenthash = "invalid-protocol://invalid-hash";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          contenthash: invalidContenthash,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid contenthash",
      });
    });

    test("setDomain_clearsContenthash_returns200", async () => {
      // First set a contenthash
      const testContenthash =
        "ipfs://bafybeihpam4mwedda5afxtvss3ynsdkoln5p64bwhihlfuqi5lmyzzhdqm";
      const encodedContenthash = encodeContenthash(testContenthash);

      await sqlForTests`
        UPDATE domain SET 
        contenthash = ${encodedContenthash},
        contenthash_raw = ${testContenthash}
        WHERE id = ${testDomainId}
      `;

      // Then clear it
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          contenthash: "",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify contenthash was cleared
      const domainAfterUpdate = await sqlForTests`
        SELECT contenthash, contenthash_raw FROM domain WHERE id = ${testDomainId}
      `;
      expect(domainAfterUpdate[0].contenthash).toBeNull();
      expect(domainAfterUpdate[0].contenthash_raw).toBeNull();
    });
  });

  /**
   * Tests text record updates:
   * - Add text records
   * - Update existing text records
   * - Clear text records
   */
  describe("Text Record Updates", () => {
    test("setDomain_addsTextRecords_returns200", async () => {
      const textRecords = {
        email: "test@example.com",
        url: "https://example.com",
        description: "Test description",
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          text_records: textRecords,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify text records were added
      const textRecordsAfterUpdate = await sqlForTests`
        SELECT key, value FROM domain_text_record WHERE domain_id = ${testDomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(textRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(textRecords[record.key]).toBe(record.value);
      }
    });

    test("setDomain_updatesExistingTextRecords_returns200", async () => {
      // First add some text records
      await sqlForTests`
        INSERT INTO domain_text_record (domain_id, key, value)
        VALUES (${testDomainId}, 'email', 'old@example.com'),
               (${testDomainId}, 'url', 'https://old.example.com')
      `;

      // Then update them
      const updatedTextRecords = {
        email: "new@example.com",
        url: "https://new.example.com",
        description: "New description",
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          text_records: updatedTextRecords,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify text records were updated
      const textRecordsAfterUpdate = await sqlForTests`
        SELECT key, value FROM domain_text_record WHERE domain_id = ${testDomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(updatedTextRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(updatedTextRecords[record.key]).toBe(record.value);
      }
    });

    test("setDomain_clearsTextRecords_returns200", async () => {
      // First add some text records
      await sqlForTests`
        INSERT INTO domain_text_record (domain_id, key, value)
        VALUES (${testDomainId}, 'email', 'test@example.com'),
               (${testDomainId}, 'url', 'https://example.com')
      `;

      // Then clear them by not including text_records in the request
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify text records were cleared
      const textRecordsAfterUpdate = await sqlForTests`
        SELECT count(*) as count FROM domain_text_record WHERE domain_id = ${testDomainId}
      `;
      expect(textRecordsAfterUpdate[0].count).toBe("0");
    });
  });

  /**
   * Tests coin type updates:
   * - Add coin types
   * - Update existing coin types
   * - Clear coin types
   */
  describe("Coin Type Updates", () => {
    test("setDomain_addsCoinTypes_returns200", async () => {
      const coinTypes = {
        60: "0x1234567890123456789012345678901234567890", // ETH
        0: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // BTC
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          coin_types: coinTypes,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify coin types were added
      const coinTypesAfterUpdate = await sqlForTests`
        SELECT coin_type, address FROM domain_coin_type 
        WHERE domain_id = ${testDomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(Object.keys(coinTypes).length);

      for (const record of coinTypesAfterUpdate) {
        expect(coinTypes[record.coin_type]).toBe(record.address);
      }
    });

    test("setDomain_updatesExistingCoinTypes_returns200", async () => {
      // First add some coin types
      await sqlForTests`
        INSERT INTO domain_coin_type (domain_id, coin_type, address)
        VALUES (${testDomainId}, '60', '0x1234567890123456789012345678901234567890'),
               (${testDomainId}, '0', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
      `;

      // Then update them
      const updatedCoinTypes = {
        60: "0x9876543210987654321098765432109876543210", // Updated ETH
        0: "bc1update2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Updated BTC
        2: "ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Added LTC
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          coin_types: updatedCoinTypes,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify coin types were updated
      const coinTypesAfterUpdate = await sqlForTests`
        SELECT coin_type, address FROM domain_coin_type 
        WHERE domain_id = ${testDomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(
        Object.keys(updatedCoinTypes).length
      );

      for (const record of coinTypesAfterUpdate) {
        expect(updatedCoinTypes[record.coin_type]).toBe(record.address);
      }
    });

    test("setDomain_clearsCoinTypes_returns200", async () => {
      // First add some coin types
      await sqlForTests`
        INSERT INTO domain_coin_type (domain_id, coin_type, address)
        VALUES (${testDomainId}, '60', '0x1234567890123456789012345678901234567890'),
               (${testDomainId}, '0', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
      `;

      // Then clear them by not including coin_types in the request
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify coin types were cleared
      const coinTypesAfterUpdate = await sqlForTests`
        SELECT count(*) as count FROM domain_coin_type WHERE domain_id = ${testDomainId}
      `;
      expect(coinTypesAfterUpdate[0].count).toBe("0");
    });
  });

  /**
   * Tests combined updates:
   * - Update all fields together
   * - Partial updates maintain other fields
   */
  describe("Combined Updates", () => {
    test("setDomain_updatesAllFieldsTogether_returns200", async () => {
      const testAddress = "0x9876543210987654321098765432109876543210";
      const testContenthash =
        "ipfs://QmTK1JVrBxcoKUyXRprCeBY8c1vefnH3oC4K9s8zpHYZaj";
      const encodedContenthash = encodeContenthash(testContenthash);
      const textRecords = {
        email: "test@example.com",
        url: "https://example.com",
      };
      const coinTypes = {
        60: "0x1234567890123456789012345678901234567890",
        0: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          domain_id: testDomainId,
          address: testAddress,
          contenthash: testContenthash,
          text_records: textRecords,
          coin_types: coinTypes,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify all fields were updated
      const domainAfterUpdate = await sqlForTests`
        SELECT address, contenthash, contenthash_raw FROM domain WHERE id = ${testDomainId}
      `;
      expect(domainAfterUpdate[0].address).toBe(testAddress);
      expect(domainAfterUpdate[0].contenthash).toBe(encodedContenthash);
      expect(domainAfterUpdate[0].contenthash_raw).toBe(testContenthash);

      const textRecordsAfterUpdate = await sqlForTests`
        SELECT key, value FROM domain_text_record WHERE domain_id = ${testDomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(textRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(textRecords[record.key]).toBe(record.value);
      }

      const coinTypesAfterUpdate = await sqlForTests`
        SELECT coin_type, address FROM domain_coin_type WHERE domain_id = ${testDomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(Object.keys(coinTypes).length);

      for (const record of coinTypesAfterUpdate) {
        expect(coinTypes[record.coin_type]).toBe(record.address);
      }
    });
  });
});
