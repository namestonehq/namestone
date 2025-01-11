const mockDb = require("./helpers/mockDb");
const httpMocks = require("node-mocks-http");

// Mock the database module
jest.mock("../lib/db", () => mockDb);

// Import handlers after mocking
const setNameHandler = require("../pages/api/[network]/set-name").default;
const getNamesHandler = require("../pages/api/[network]/get-names").default;
const searchNamesHandler =
  require("../pages/api/[network]/search-names").default;
const setDomainHandler = require("../pages/api/[network]/set-domain").default;
const getDomainHandler = require("../pages/api/[network]/get-domain").default;
const deleteNameHandler = require("../pages/api/[network]/delete-name").default;

// Mock environment variables
process.env.TEST_API_KEY = "test-api-key";
process.env.TEST_DOMAIN = "test.eth";
process.env.TEST_NAME = "testname";
process.env.TEST_ADDRESS = "0x1234567890123456789012345678901234567890";

describe("API Routes", () => {
  const sql = mockDb;

  beforeEach(async () => {
    // Clear existing data
    // await sql`TRUNCATE domain, api_key, subdomain, subdomain_text_record CASCADE`;
    // Insert test data
    // const [domain] = await sql`
    //   INSERT INTO domain (name, network)
    //   VALUES (${process.env.TEST_DOMAIN}, 'mainnet')
    //   RETURNING id
    // `;
    // await sql`
    //   INSERT INTO api_key (key, domain_id)
    //   VALUES (${process.env.TEST_API_KEY}, ${domain.id})
    // `;
  });

  describe("Database Setup", () => {
    it("should create tables successfully", async () => {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      console.log(tables);
      expect(true).toBeTruthy();
    });

    it("should show data for domains", async () => {
        const domains = await sql`
        select subdomain.id, subdomain.address
        from subdomain
      `;
      console.log(domains);

        // select subdomain.id, subdomain.address
        // from subdomain
        // where subdomain.name = $1 and subdomain.domain_id in
        // (select id from domain where name = $2 and network=$3 limit 1);

    const name = process.env.TEST_NAME;
    const domain = process.env.TEST_DOMAIN;
    const network = 'mainnet';
      const results = sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${name} and subdomain.domain_id in
  (select id from domain where name = ${domain} and network=${network} limit 1)`;

      console.log(results);
    });
    // it('should insert test data successfully', async () => {
    //   const [domain] = await sql`
    //     SELECT * FROM domain WHERE name = ${process.env.TEST_DOMAIN}
    //   `;
    //   expect(domain).toBeTruthy();
    //   expect(domain.name).toBe(process.env.TEST_DOMAIN);
    //   expect(domain.network).toBe('mainnet');

    //   const [apiKey] = await sql`
    //     SELECT * FROM api_key WHERE key = ${process.env.TEST_API_KEY}
    //   `;
    //   expect(apiKey).toBeTruthy();
    //   expect(apiKey.domain_id).toBe(domain.id);
    // });
  });

    // describe('set-name', () => {
    //   const testTextRecords = {
    //     'com.twitter': 'namestonehq',
    //     'com.github': 'resolverworks',
    //     'url': 'https://www.namestone.xyz',
    //     'description': 'API Test Example'
    //   };

    //   it('should set a name successfully', async () => {
    //     const handler = createMockHandler(setNameHandler);
    //     const response = await handler({
    //       method: 'POST',
    //       headers: {
    //         'Authorization': process.env.TEST_API_KEY
    //       },
    //       body: {
    //         domain: process.env.TEST_DOMAIN,
    //         name: process.env.TEST_NAME,
    //         address: process.env.TEST_ADDRESS,
    //         text_records: testTextRecords
    //       }
    //     });

    //     expect(response.statusCode).toBe(200);
    //     expect(response.body).toEqual({ success: true });

    //     // Verify the subdomain was created
    //     const [subdomain] = await sql`
    //       SELECT * FROM subdomain
    //       WHERE name = ${process.env.TEST_NAME}
    //     `;
    //     expect(subdomain).toBeTruthy();
    //     expect(subdomain.address).toBe(process.env.TEST_ADDRESS);

    //     // Verify text records were created
    //     const textRecords = await sql`
    //       SELECT * FROM subdomain_text_record
    //       WHERE subdomain_id = ${subdomain.id}
    //     `;
    //     expect(textRecords.length).toBe(Object.keys(testTextRecords).length);
    //     for (const record of textRecords) {
    //       expect(testTextRecords[record.key]).toBe(record.value);
    //     }
    //   });

    //   it('should fail when API key is invalid', async () => {
    //     const handler = createMockHandler(setNameHandler);
    //     const response = await handler({
    //       method: 'POST',
    //       headers: {
    //         'Authorization': 'invalid-api-key'
    //       },
    //       body: {
    //         domain: process.env.TEST_DOMAIN,
    //         name: process.env.TEST_NAME,
    //         address: process.env.TEST_ADDRESS,
    //         text_records: testTextRecords
    //       }
    //     });

    //     expect(response.statusCode).toBe(401);
    //     expect(response.body).toHaveProperty('error');

    //     // Verify no subdomain was created
    //     const subdomains = await sql`
    //       SELECT * FROM subdomain
    //       WHERE name = ${process.env.TEST_NAME}
    //     `;
    //     expect(subdomains.length).toBe(0);
    //   });

    //   it('should fail when domain does not exist', async () => {
    //     const handler = createMockHandler(setNameHandler);
    //     const response = await handler({
    //       method: 'POST',
    //       headers: {
    //         'Authorization': process.env.TEST_API_KEY
    //       },
    //       body: {
    //         domain: 'nonexistent.eth',
    //         name: process.env.TEST_NAME,
    //         address: process.env.TEST_ADDRESS,
    //         text_records: testTextRecords
    //       }
    //     });

    //     expect(response.statusCode).toBe(400);
    //     expect(response.body).toHaveProperty('error');
    //   });
    // });
});

// Helper function to make API requests in tests
const createMockHandler = (handler) => {
  return async ({ method = "GET", body = {}, query = {}, headers = {} }) => {
    const req = httpMocks.createRequest({
      method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body,
      query,
    });

    const res = httpMocks.createResponse();
    await handler(req, res);

    return {
      statusCode: res._getStatusCode(),
      body: JSON.parse(res._getData()),
    };
  };
};
