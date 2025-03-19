/**
 * E2E Tests for /admin/set-subdomain
 * Key features tested:
 * - Logging verification
 * - Admin authorization
 * - Parameter validation
 * - Subdomain records updates (name, address, contenthash, text records, coin types)
 */

/**
 * Set up mocks before imports
 *
 * This is a workaround to mock the database module to use the `TEST_DATABASE_URL` environment variable
 * instead of the `POSTGRES_URI` environment variable.
 */

import { createRequest, createResponse } from "node-mocks-http";
import handler from "./set-subdomain";
import { default as sqlForTests } from "../../../test_utils/mock_db";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../test_utils/test_db_setup";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";
import { normalize } from "viem/ens";

// Mock the getAdminTokenById function
jest.mock("../../../utils/ServerUtils", () => ({
  getAdminTokenById: jest.fn(),
}));

// Import the mocked function
import { getAdminTokenById } from "../../../utils/ServerUtils";

const TEST_ADMIN_ADDRESS = "0xAdminAddress123456789012345678901234567890";

describe("set-subdomain API E2E", () => {
  let testDomainId;
  let testSubdomainId;
  const testDomain = "test.eth";
  const testSubdomain = "sub";
  const testFullName = `${testSubdomain}.${testDomain}`;

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
      VALUES (${testDomain}, 'mainnet')
      RETURNING id
    `;
    testDomainId = domain.id;

    // Create a test subdomain
    const [subdomain] = await sqlForTests`
      INSERT INTO subdomain (name, domain_id, address)
      VALUES (${normalize(
        testSubdomain
      )}, ${testDomainId}, '0x0000000000000000000000000000000000000000')
      RETURNING id
    `;
    testSubdomainId = subdomain.id;

    // Mock admin token
    getAdminTokenById.mockResolvedValue({
      sub: TEST_ADMIN_ADDRESS,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await sqlForTests`DELETE FROM subdomain_text_record WHERE subdomain_id = ${testSubdomainId}`;
    await sqlForTests`DELETE FROM subdomain_coin_type WHERE subdomain_id = ${testSubdomainId}`;
    await sqlForTests`DELETE FROM subdomain WHERE domain_id = ${testDomainId}`;
    await sqlForTests`DELETE FROM domain WHERE id = ${testDomainId}`;
  });

  /**
   * Tests user engagement logging:
   * - Verify engagement record is created
   */
  describe("User Engagement Logging", () => {
    test("setSubdomain_logsUserEngagement_returns200", async () => {
      const testAddress = "0x1234567890123456789012345678901234567890";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        AND name = 'admin_set_name'
      `;
      expect(engagementRecords.length).toBe(1);

      const engagementDetails = JSON.parse(engagementRecords[0].details);
      expect(engagementDetails.domain_id).toBe(testDomainId);
      expect(engagementDetails.name).toBe(normalize(testSubdomain));
      expect(engagementDetails.address).toBe(testAddress);
    });
  });

  /**
   * Tests authorization:
   * - No admin token
   * - Invalid admin token
   */
  describe("Authorization Validation", () => {
    test("setSubdomain_noAdminToken_returns401", async () => {
      // Mock no admin token
      getAdminTokenById.mockResolvedValue(null);

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
   * - Missing name
   * - Missing id
   * - Invalid domain_id
   * - Missing domain
   * - Invalid ENS name
   */
  describe("Parameter Validation", () => {
    test("setSubdomain_noNameSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          domain: testDomain,
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Name is required",
      });
    });

    test("setSubdomain_noIdSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          name: testSubdomain,
          domain: testDomain,
          domain_id: testDomainId,
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

    test("setSubdomain_invalidDomainId_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
          domain_id: -1, // Invalid domain_id
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "domain_id is required and must be a positive number",
      });
    });

    test("setSubdomain_noDomainSupplied_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Domain is required",
      });
    });

    test("setSubdomain_invalidEnsName_returns400", async () => {
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: "invalid@name", // Invalid ENS name
          domain: testDomain,
          domain_id: testDomainId,
          address: "0x1234567890123456789012345678901234567890",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Invalid ens name",
      });
    });
  });

  /**
   * Tests name claimed validation
   */
  describe("Name Claimed Validation", () => {
    test("setSubdomain_nameClaimedByAnother_returns400", async () => {
      // Create another subdomain with the same name but different ID
      await sqlForTests`
        INSERT INTO subdomain (name, domain_id, address)
        VALUES (${normalize(
          testSubdomain
        )}, ${testDomainId}, '0x1111111111111111111111111111111111111111')
        RETURNING id
      `;

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: 0, // New subdomain
          name: testSubdomain,
          domain: testDomain,
          domain_id: testDomainId,
          address: "0x2222222222222222222222222222222222222222",
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: "Name claimed by another address",
      });
    });
  });

  /**
   * Tests subdomain creation and updates:
   * - Create new subdomain (id=0)
   * - Update existing subdomain
   */
  describe("Subdomain Creation and Updates", () => {
    test("setSubdomain_createsNewSubdomain_returns200", async () => {
      const newSubdomain = "newsub";
      const testAddress = "0x1234567890123456789012345678901234567890";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: 0, // New subdomain
          name: newSubdomain,
          domain: testDomain,
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

      // Verify subdomain was created
      const subdomainRecords = await sqlForTests`
        SELECT * FROM subdomain 
        WHERE name = ${normalize(newSubdomain)} AND domain_id = ${testDomainId}
      `;
      expect(subdomainRecords.length).toBe(1);
      expect(subdomainRecords[0].address).toBe(testAddress);
    });

    test("setSubdomain_updatesExistingSubdomain_returns200", async () => {
      const updatedAddress = "0x5555555555555555555555555555555555555555";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
          domain_id: testDomainId,
          address: updatedAddress,
        }),
      });

      const res = createResponse();
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
      });

      // Verify subdomain was updated
      const subdomainAfterUpdate = await sqlForTests`
        SELECT address FROM subdomain WHERE id = ${testSubdomainId}
      `;
      expect(subdomainAfterUpdate[0].address).toBe(updatedAddress);
    });
  });

  /**
   * Tests contenthash updates:
   * - Update contenthash only
   * - Update with invalid contenthash
   * - Clear contenthash
   */
  describe("Contenthash Updates", () => {
    test("setSubdomain_updatesContenthash_returns200", async () => {
      const testContenthash =
        "ipfs://QmTK1JVrBxcoKUyXRprCeBY8c1vefnH3oC4K9s8zpHYZaj";
      const encodedContenthash = encodeContenthash(testContenthash);

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
      const subdomainAfterUpdate = await sqlForTests`
        SELECT contenthash, contenthash_raw FROM subdomain WHERE id = ${testSubdomainId}
      `;
      expect(subdomainAfterUpdate[0].contenthash).toBe(encodedContenthash);
      expect(subdomainAfterUpdate[0].contenthash_raw).toBe(testContenthash);
    });

    test("setSubdomain_invalidContenthash_returns400", async () => {
      const invalidContenthash = "invalid-protocol://invalid-hash";

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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

    test("setSubdomain_clearsContenthash_returns200", async () => {
      // First set a contenthash
      const testContenthash =
        "ipfs://bafybeihpam4mwedda5afxtvss3ynsdkoln5p64bwhihlfuqi5lmyzzhdqm";
      const encodedContenthash = encodeContenthash(testContenthash);

      await sqlForTests`
        UPDATE subdomain SET 
        contenthash = ${encodedContenthash},
        contenthash_raw = ${testContenthash}
        WHERE id = ${testSubdomainId}
      `;

      // Then clear it
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
      const subdomainAfterUpdate = await sqlForTests`
        SELECT contenthash, contenthash_raw FROM subdomain WHERE id = ${testSubdomainId}
      `;
      expect(subdomainAfterUpdate[0].contenthash).toBeNull();
      expect(subdomainAfterUpdate[0].contenthash_raw).toBeNull();
    });
  });

  /**
   * Tests text record updates:
   * - Add text records
   * - Update existing text records
   * - Clear text records
   */
  describe("Text Record Updates", () => {
    test("setSubdomain_addsTextRecords_returns200", async () => {
      const textRecords = {
        email: "test@example.com",
        url: "https://example.com",
        description: "Test description",
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT key, value FROM subdomain_text_record WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(textRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(textRecords[record.key]).toBe(record.value);
      }
    });

    test("setSubdomain_updatesExistingTextRecords_returns200", async () => {
      // First add some text records
      await sqlForTests`
        INSERT INTO subdomain_text_record (subdomain_id, key, value)
        VALUES (${testSubdomainId}, 'email', 'old@example.com'),
               (${testSubdomainId}, 'url', 'https://old.example.com')
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
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT key, value FROM subdomain_text_record WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(updatedTextRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(updatedTextRecords[record.key]).toBe(record.value);
      }
    });

    test("setSubdomain_clearsTextRecords_returns200", async () => {
      // First add some text records
      await sqlForTests`
        INSERT INTO subdomain_text_record (subdomain_id, key, value)
        VALUES (${testSubdomainId}, 'email', 'test@example.com'),
               (${testSubdomainId}, 'url', 'https://example.com')
      `;

      // Then clear them by not including text_records in the request
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT count(*) as count FROM subdomain_text_record WHERE subdomain_id = ${testSubdomainId}
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
    test("setSubdomain_addsCoinTypes_returns200", async () => {
      const coinTypes = {
        60: "0x1234567890123456789012345678901234567890", // ETH
        0: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // BTC
      };

      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT coin_type, address FROM subdomain_coin_type 
        WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(Object.keys(coinTypes).length);

      for (const record of coinTypesAfterUpdate) {
        expect(coinTypes[record.coin_type]).toBe(record.address);
      }
    });

    test("setSubdomain_updatesExistingCoinTypes_returns200", async () => {
      // First add some coin types
      await sqlForTests`
        INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
        VALUES (${testSubdomainId}, '60', '0x1234567890123456789012345678901234567890'),
               (${testSubdomainId}, '0', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
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
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT coin_type, address FROM subdomain_coin_type 
        WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(
        Object.keys(updatedCoinTypes).length
      );

      for (const record of coinTypesAfterUpdate) {
        expect(updatedCoinTypes[record.coin_type]).toBe(record.address);
      }
    });

    test("setSubdomain_clearsCoinTypes_returns200", async () => {
      // First add some coin types
      await sqlForTests`
        INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
        VALUES (${testSubdomainId}, '60', '0x1234567890123456789012345678901234567890'),
               (${testSubdomainId}, '0', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
      `;

      // Then clear them by not including coin_types in the request
      const req = createRequest({
        method: "POST",
        body: JSON.stringify({
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
        SELECT count(*) as count FROM subdomain_coin_type WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(coinTypesAfterUpdate[0].count).toBe("0");
    });
  });

  /**
   * Tests combined updates:
   * - Update all fields together
   */
  describe("Combined Updates", () => {
    test("setSubdomain_updatesAllFieldsTogether_returns200", async () => {
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
          id: testSubdomainId,
          name: testSubdomain,
          domain: testDomain,
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
      const subdomainAfterUpdate = await sqlForTests`
        SELECT address, contenthash, contenthash_raw FROM subdomain WHERE id = ${testSubdomainId}
      `;
      expect(subdomainAfterUpdate[0].address).toBe(testAddress);
      expect(subdomainAfterUpdate[0].contenthash).toBe(encodedContenthash);
      expect(subdomainAfterUpdate[0].contenthash_raw).toBe(testContenthash);

      const textRecordsAfterUpdate = await sqlForTests`
        SELECT key, value FROM subdomain_text_record WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(textRecordsAfterUpdate.length).toBe(
        Object.keys(textRecords).length
      );

      for (const record of textRecordsAfterUpdate) {
        expect(textRecords[record.key]).toBe(record.value);
      }

      const coinTypesAfterUpdate = await sqlForTests`
        SELECT coin_type, address FROM subdomain_coin_type WHERE subdomain_id = ${testSubdomainId}
      `;
      expect(coinTypesAfterUpdate.length).toBe(Object.keys(coinTypes).length);

      for (const record of coinTypesAfterUpdate) {
        expect(coinTypes[record.coin_type]).toBe(record.address);
      }
    });
  });
});
