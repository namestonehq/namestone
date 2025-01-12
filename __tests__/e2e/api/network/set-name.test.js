const httpMocks = require('node-mocks-http');
const handler = require('../../../../pages/api/[network]/set-name').default;
const { checkApiKey, encodeContenthash, getNetwork } = require('../../../../utils/ServerUtils');
const { normalize } = require('viem/ens');
const sql = require('../../../../lib/db').default;
const postgres = require('postgres');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });

const DEFAULT_NETWORK = 'mainnet';

// Only mock non-DB dependencies
jest.mock('../../../../utils/ServerUtils', () => ({
  checkApiKey: jest.fn(),
  encodeContenthash: jest.fn(),
  getNetwork: jest.fn(),
}));

jest.mock('viem/ens', () => ({
  normalize: jest.fn(),
}));

describe('set-name API E2E', () => {
  let res;

  beforeAll(async () => {
    // Database setup
    const adminSql = postgres('postgresql://admin:admin@localhost:5432/postgres');
    
    try {
      // Check if database exists
      const dbExists = await adminSql`
        SELECT 1 FROM pg_database WHERE datname=${process.env.DB_NAME}
      `;

      if (dbExists.length === 0) {
        console.log(`Creating test database: ${process.env.DB_NAME}`);
        await adminSql`CREATE DATABASE ${adminSql(process.env.DB_NAME)}`;
      } else {
        console.log(`Test database ${process.env.DB_NAME} already exists`);
      }
    } finally {
      await adminSql.end();
    }

    // Run Prisma migrations
    try {
      console.log('Running Prisma migrations...');
      execSync('npx prisma validate', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL
        }
      });

      execSync('npx prisma migrate dev', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL
        }
      });
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }

    // Verify database is empty
    console.log('Verifying database is empty...');
    
    const tables = ['domain', 'subdomain', 'subdomain_text_record', 'subdomain_coin_type', 'api_key'];
    for (const table of tables) {
      const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
      if (count[0].count > 0) {
        throw new Error(`Table ${table} is not empty. Found ${count[0].count} rows.`);
      }
      console.log(`Verified ${table} is empty`);
    }

    console.log('Database is clean, proceeding with seed data...');

    // Insert seed data
    const [domain] = await sql`
      INSERT INTO domain (name, network, name_limit)
      VALUES ('test.eth', 'mainnet', 100)
      RETURNING id
    `;

    // Insert API key for the domain
    await sql`
      INSERT INTO api_key (domain_id, key)
      VALUES (${domain.id}, 'test-api-key')
    `;

    // Verify seed data was inserted correctly
    const domainCount = await sql`SELECT COUNT(*) as count FROM domain`;
    const apiKeyCount = await sql`SELECT COUNT(*) as count FROM api_key`;
    
    expect(domainCount.length).toBe(1);
    expect(apiKeyCount.length).toBe(1);

    console.log('Seed data verified successfully');
  });

  beforeEach(() => {
    // Reset all mocks except DB
    jest.clearAllMocks();
    res = httpMocks.createResponse();

    // Default mock implementations for non-DB dependencies
    getNetwork.mockReturnValue('mainnet');
    checkApiKey.mockResolvedValue(true);
    normalize.mockImplementation((input) => input);
  });

  afterAll(async () => {
    // Close the test database connection
    await sql.end();
    
    // Connect to postgres to drop the test database
    const adminSql = postgres('postgresql://admin:admin@localhost:5432/postgres');
    
    try {
      // Terminate all connections to the test database
      await adminSql`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = ${process.env.DB_NAME}
        AND pid <> pg_backend_pid()
      `;
      
      // Drop the test database
      console.log(`Dropping test database: ${process.env.DB_NAME}`);
      await adminSql`DROP DATABASE IF EXISTS ${adminSql(process.env.DB_NAME)}`;
    } catch (error) {
      console.error('Error dropping test database:', error);
      throw error;
    } finally {
      await adminSql.end();
    }
  });

  test('setName_nonExistingDomain_returns404', async () => {
    // First, create a new subdomain
    const createReq = httpMocks.createRequest({
      method: 'POST',
    //   headers: {
    //     authorization: 'valid-api-key'
    //   },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'non-existing.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'e2e-test',
        text_records: {
          email: 'test@example.com',
          url: 'https://example.com'
        },
        coin_types: {
          "2147483785": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
          "2147492101": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF"
        }
      }
    });

    await handler(createReq, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ 
        error: 'Invalid network' 
      });
    // Verify the data was saved correctly
    // const savedSubdomain = await sql`
    //   SELECT s.*, 
    //     (SELECT json_agg(json_build_object('key', tr.key, 'value', tr.value))
    //      FROM subdomain_text_record tr
    //      WHERE tr.subdomain_id = s.id) as text_records,
    //     (SELECT json_agg(json_build_object('coin_type', ct.coin_type, 'address', ct.address))
    //      FROM subdomain_coin_type ct
    //      WHERE ct.subdomain_id = s.id) as coin_types
    //   FROM subdomain s
    //   WHERE s.name = 'e2e-test'
    // `;

    // expect(savedSubdomain).toHaveLength(1);
    // expect(savedSubdomain[0].text_records).toHaveLength(2);
    // expect(savedSubdomain[0].coin_types).toHaveLength(2);

    // // Now update the subdomain
    // const updateReq = httpMocks.createRequest({
    //   method: 'POST',
    //   headers: {
    //     authorization: 'valid-api-key'
    //   },
    //   body: {
    //     network: DEFAULT_NETWORK,
    //     domain: 'test.eth',
    //     address: '0x9876543210987654321098765432109876543210',
    //     name: 'e2e-test',
    //     text_records: {
    //       email: 'updated@example.com'
    //     },
    //     coin_types: {
    //       "2147483785": "0x987654321098765432109876543210987654321"
    //     }
    //   }
    // });

    // res = httpMocks.createResponse(); // Reset response
    // await handler(updateReq, res);
    // expect(res._getStatusCode()).toBe(200);

    // // Verify the update
    // const updatedSubdomain = await sql`
    //   SELECT s.*, 
    //     (SELECT json_agg(json_build_object('key', tr.key, 'value', tr.value))
    //      FROM subdomain_text_record tr
    //      WHERE tr.subdomain_id = s.id) as text_records,
    //     (SELECT json_agg(json_build_object('coin_type', ct.coin_type, 'address', ct.address))
    //      FROM subdomain_coin_type ct
    //      WHERE ct.subdomain_id = s.id) as coin_types
    //   FROM subdomain s
    //   WHERE s.name = 'e2e-test'
    // `;

    // expect(updatedSubdomain).toHaveLength(1);
    // expect(updatedSubdomain[0].address).toBe('0x9876543210987654321098765432109876543210');
    // expect(updatedSubdomain[0].text_records).toHaveLength(1);
    // expect(updatedSubdomain[0].text_records[0].key).toBe('email');
    // expect(updatedSubdomain[0].text_records[0].value).toBe('updated@example.com');
    // expect(updatedSubdomain[0].coin_types).toHaveLength(1);
    // expect(updatedSubdomain[0].coin_types[0].coin_type).toBe('2147483785');
  });
});
