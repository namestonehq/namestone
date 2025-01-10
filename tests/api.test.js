// Import handlers
const setNameHandler = require('../pages/api/[network]/set-name').default;
const getNamesHandler = require('../pages/api/[network]/get-names').default;
const searchNamesHandler = require('../pages/api/[network]/search-names').default;
const setDomainHandler = require('../pages/api/[network]/set-domain').default;
const getDomainHandler = require('../pages/api/[network]/get-domain').default;
const deleteNameHandler = require('../pages/api/[network]/delete-name').default;

// Mock environment variables
process.env.TEST_API_KEY = 'test-api-key';
process.env.TEST_DOMAIN = 'test.eth';
process.env.TEST_NAME = 'testname';
process.env.TEST_ADDRESS = '0x1234567890123456789012345678901234567890';

describe('API Routes', () => {
  const sql = require('../lib/db');
  
  beforeAll(async () => {
    // Insert test data
    const [domain] = await sql`
      INSERT INTO domain (name, network)
      VALUES (${process.env.TEST_DOMAIN}, 'mainnet')
      RETURNING id
    `;

    await sql`
      INSERT INTO api_key (key, domain_id)
      VALUES (${process.env.TEST_API_KEY}, ${domain.id})
    `;
  });

  describe('Database Setup', () => {
    it('should create tables successfully', async () => {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      expect(tables.map(t => t.table_name)).toEqual(
        expect.arrayContaining(['domain', 'domain_text_record', 'subdomain', 'subdomain_text_record'])
      );
    });

    it('should insert test data successfully', async () => {
      const [domain] = await sql`
        SELECT * FROM domain WHERE name = ${process.env.TEST_DOMAIN}
      `;
      expect(domain).toBeTruthy();
      expect(domain.name).toBe(process.env.TEST_DOMAIN);
      expect(domain.network).toBe('mainnet');

      const [apiKey] = await sql`
        SELECT * FROM api_key WHERE key = ${process.env.TEST_API_KEY}
      `;
      expect(apiKey).toBeTruthy();
      expect(apiKey.domain_id).toBe(domain.id);
    });
  });

  // Helper function to make API requests in tests
  const testApiHandler = (handler) => {
    return async ({ method = 'GET', body = null, query = {}, headers = {} }) => {
      return new Promise((resolve, reject) => {
        const req = {
          method,
          body,
          query,
          headers: {
            'content-type': 'application/json',
            ...headers,
          },
          cookies: {},
        };

        const res = {
          statusCode: null,
          json: function(data) {
            this.body = data;
            return this;
          },
          status: function(statusCode) {
            this.statusCode = statusCode;
            return this;
          },
          end: function() {
            resolve({ statusCode: this.statusCode, body: this.body });
          },
        };

        handler(req, res).catch(reject);
      });
    };
  };

  describe('set-name', () => {
    const testTextRecords = {
      'com.twitter': 'namestonehq',
      'com.github': 'resolverworks',
      'url': 'https://www.namestone.xyz',
      'description': 'API Test Example'
    };

    it('should set a name successfully', async () => {
      const handler = testApiHandler(setNameHandler);
      const response = await handler({
        method: 'POST',
        headers: {
          'Authorization': process.env.TEST_API_KEY
        },
        body: {
          domain: process.env.TEST_DOMAIN,
          name: process.env.TEST_NAME,
          address: process.env.TEST_ADDRESS,
          text_records: testTextRecords
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify the data was inserted
      const [subdomain] = await sql`
        SELECT * FROM subdomain 
        WHERE name = ${process.env.TEST_NAME}
      `;
      expect(subdomain).toBeTruthy();
      expect(subdomain.address).toBe(process.env.TEST_ADDRESS);
    });
  });
}); 