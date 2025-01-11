const httpMocks = require('node-mocks-http');
const handler = require('../../../../pages/api/[network]/set-name').default;
const { checkApiKey, encodeContenthash, getNetwork } = require('../../../../utils/ServerUtils');
const { normalize } = require('viem/ens');
const sql = require('../../../../lib/db').default;

const DEFAULT_NETWORK = 'mainnet';

// Mock dependencies
jest.mock('../../../../lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../utils/ServerUtils', () => ({
  checkApiKey: jest.fn(),
  encodeContenthash: jest.fn(),
  getNetwork: jest.fn(),
}));

jest.mock('viem/ens', () => ({
  normalize: jest.fn(),
}));

describe('set-name API', () => {
  // Each test will setup its own request
  let res;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    res = httpMocks.createResponse();

    // Default mock implementations
    getNetwork.mockReturnValue('mainnet');
    checkApiKey.mockResolvedValue(true);
    normalize.mockImplementation((input) => input);
    sql.mockResolvedValue([]);
  });

  test('should return 400 if getNetwork returns false', async () => {
    // Given mocked response from `getNetwork` returns false
    getNetwork.mockReturnValue(false);
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {}
    });

    // When the handler is called
    await handler(req, res);

    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ 
      error: 'Invalid network' 
    });
    
    // Verify getNetwork was called with a request that doesn't have network in body
    expect(getNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.not.objectContaining({
          network: expect.anything()
        })
      })
    );
  });

  test('should return 400 if domain is missing', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        network: DEFAULT_NETWORK,
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ 
      error: 'Missing domain' 
    });
  });

  test('should return 400 if domain is missing with stringified JSON request body', async () => {
    // Stringify the request body with no domain specified
    const stringifiedBody = JSON.stringify({
      network: DEFAULT_NETWORK,
    });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: stringifiedBody
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing domain'
    });
  });

  test('should return 400 if address is missing', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing address'
    });
  });

  test('should return 400 if name is missing', async () => {
    const req = httpMocks.createRequest({
      method: 'POST', 
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890'
      }
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing name'
    });
  });

  test('should return 401 if API key is invalid', async () => {
    checkApiKey.mockResolvedValue(false);
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test'
      }
    });

    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({ 
      error: 'You are not authorized to use this endpoint' 
    });
    expect(checkApiKey).toHaveBeenCalledWith(
      undefined,
      'test.eth'
    );
  });

  test('should return 400 if domain name is invalid', async () => {
    // Given an invalid domain name, the normalize function should return an error
    const invalidDomain = 'test..eth';
    normalize.mockImplementation((name) => {
      if (name === invalidDomain) {
        throw new Error('Invalid domain name');
      }
      return name;
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        network: DEFAULT_NETWORK,
        domain: invalidDomain,
        address: '0x1234567890123456789012345678901234567890',
        name: 'test'
      }
    });

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid ens name'
    });
  });

  test('should return 400 if name is invalid', async () => {
    // Given a valid domain but invalid subdomain name
    const validDomain = 'test.eth';
    const invalidName = 'test..invalid';
    normalize.mockImplementation((input) => {
      if (input === invalidName) {
        throw new Error('Invalid name');
      }
      return input;
    });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        network: DEFAULT_NETWORK,
        domain: validDomain,
        address: '0x1234567890123456789012345678901234567890',
        name: invalidName
      }
    });

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid ens name'
    });

    // Verify normalize was called twice - once for domain and once for name
    expect(normalize).toHaveBeenCalledTimes(2);
    expect(normalize).toHaveBeenNthCalledWith(1, validDomain);
    expect(normalize).toHaveBeenNthCalledWith(2, invalidName);
  });

  test('should return 400 if contenthash is invalid', async () => {
    // Given an invalid contenthash, encodeContenthash should throw an error
    const invalidContenthash = 'ipfs://invalid-hash';
    encodeContenthash.mockImplementation(() => {
      throw new Error('Error encoding content hash');
    });
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        authorization: 'valid-api-key'
      },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test',
        contenthash: invalidContenthash
      }
    });

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid contenthash'
    });

    // Verify encodeContenthash was called with invalid hash
    expect(encodeContenthash).toHaveBeenCalledWith(invalidContenthash);
  });

  test('should return 400 if domain does not exist', async () => {
    // Given a subdomain (name) that doesn't exist in the database
    sql
      .mockResolvedValueOnce([]) // subdomain query returns empty
      .mockResolvedValueOnce([]); // domain query returns empty
    
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        authorization: 'valid-api-key'
      },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'nonexistent.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test'
      }
    });

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Domain does not exist'
    });

    // Verify the database was queried correctly
    expect(sql).toHaveBeenCalledTimes(2);
  });

  test('should return 400 if api name limit is reached', async () => {
    // Given a domain with a name limit of 10 and 10 subdomains already exist
    sql
      .mockResolvedValueOnce([]) // subdomain query returns empty
      .mockResolvedValueOnce([{ id: 1, name_limit: 10 }]) // domain query
      .mockResolvedValueOnce([{ count: 10 }]); // subdomain count

    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        authorization: 'valid-api-key'
      },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test'
      }
    });

    // When the handler is called
    await handler(req, res);

    // Then the response status code is 400
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Api name limit reached. Please contact alex@namestone.xyz to increase your limit'
    });
  });

  test('should successfully create a new subdomain without text records', async () => {
    // Given a subdomain that doesn't exist in the database
    sql
      .mockResolvedValueOnce([]) // subdomain query returns empty
      .mockResolvedValueOnce([{ id: 1, name_limit: 10 }]) // domain query
      .mockResolvedValueOnce([{ count: 0 }]) // subdomain count
      .mockResolvedValueOnce([{ id: 1 }]) // insert subdomain
      .mockResolvedValueOnce([]) // delete text records
      .mockResolvedValueOnce([]) // delete coin types
      .mockResolvedValueOnce([]); // insert user engagement
    const expectedSqlQueriesPrefixes = [
      'select subdomain.id, subdomain.address',
      'select id, name_limit from domain',
      'select count(*) from subdomain',
      'insert into subdomain',
      'delete from subdomain_text_record',
      'delete from subdomain_coin_type',
      'insert into user_engagement'
    ]
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        authorization: 'valid-api-key'
      },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test'
      }
    });

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 200
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ 
      success: true 
    });
    // Verify the database was queried correctly
    expect(sql).toHaveBeenCalledTimes(7);
    const queries = sql.mock.calls
      .map(query => query.join('').trim());
    expectedSqlQueriesPrefixes.forEach((queryPrefix, index) => {
      expect(queries[index]).toContain(queryPrefix);
    });
  });

  test('should successfully create a new subdomain with text records', async () => {
    // Given a subdomain that doesn't exist and text records in the request
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: {
        authorization: 'valid-api-key'
      },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x1234567890123456789012345678901234567890',
        name: 'test',
        text_records: {
          email: 'test@example.com',
          url: 'https://example.com'
        }
      }
    });
    
    sql
      .mockResolvedValueOnce([]) // subdomain query returns empty
      .mockResolvedValueOnce([{ id: 1, name_limit: 10 }]) // domain query
      .mockResolvedValueOnce([{ count: 0 }]) // subdomain count
      .mockResolvedValueOnce([{ id: 1 }]) // insert subdomain
      .mockResolvedValueOnce([]) // delete text records
      .mockResolvedValueOnce([]) // insert first text record
      .mockResolvedValueOnce([]) // insert second text record
      .mockResolvedValueOnce([]) // delete coin types
      .mockResolvedValueOnce([]); // insert user engagement

    const expectedSqlQueriesPrefixes = [
      'select subdomain.id, subdomain.address',
      'select id, name_limit from domain',
      'select count(*) from subdomain',
      'insert into subdomain',
      'delete from subdomain_text_record',
      'insert into subdomain_text_record',
      'insert into subdomain_text_record',
      'delete from subdomain_coin_type',
      'insert into user_engagement'
    ];

    // When the handler is called
    await handler(req, res);
    
    // Then the response status code is 200
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ 
      success: true 
    });

    // Verify the database was queried correctly
    expect(sql).toHaveBeenCalledTimes(9);
    const queries = sql.mock.calls
      .map(query => query.join('').trim());
    expectedSqlQueriesPrefixes.forEach((queryPrefix, index) => {
      expect(queries[index]).toContain(queryPrefix);
    });
    // Verify text record inserts specifically
    expect(queries[5]).toContain('email');
    expect(queries[5]).toContain('test@example.com');
    expect(queries[6]).toContain('url');
    expect(queries[6]).toContain('https://example.com');
  });

  test('should successfully create a new subdomain with coin types', async () => {
    // Given a valid request with coin types
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: { authorization: 'valid-api-key' },
      body: {
        network: DEFAULT_NETWORK,
        domain: 'test.eth',
        address: '0x123',
        name: 'subdomain',
        coin_types: {
          "2147483785": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
          "2147492101": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF",
        }
      }
    });
    sql
      .mockResolvedValueOnce([]) // subdomain query returns empty
      .mockResolvedValueOnce([{ id: 1, name_limit: 10 }]) // domain query
      .mockResolvedValueOnce([{ count: 0 }]) // subdomain count
      .mockResolvedValueOnce([{ id: 1 }]) // insert subdomain
      .mockResolvedValueOnce([]) // delete text records
      .mockResolvedValueOnce([]) // delete coin types
      .mockResolvedValueOnce([]) // insert first coin type
      .mockResolvedValueOnce([]) // insert second coin type
      .mockResolvedValueOnce([]); // insert user engagement
    const expectedSqlQueriesPrefixes = [
      'select subdomain.id, subdomain.address',
      'select id, name_limit from domain',
      'select count(*) from subdomain',
      'insert into subdomain',
      'delete from subdomain_text_record',
      'delete from subdomain_coin_type',
      'insert into subdomain_coin_type',
      'insert into subdomain_coin_type',
      'insert into user_engagement'
    ];

    // When the handler is called
    await handler(req, res);

    // Then the response status code is 200
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true
    });

    // Verify the database was queried correctly
    expect(sql).toHaveBeenCalledTimes(9);
    const queries = sql.mock.calls
      .map(query => query.join('').trim());
    expectedSqlQueriesPrefixes.forEach((queryPrefix, index) => {
      expect(queries[index]).toContain(queryPrefix);
    });
    const insertToSubdomainCoinTypeQueries = queries
    .filter(query => query.includes('insert into subdomain_coin_type'));
    expect(insertToSubdomainCoinTypeQueries).toHaveLength(2);
    expect(insertToSubdomainCoinTypeQueries[0]).toContain('2147483785');
    expect(insertToSubdomainCoinTypeQueries[0]).toContain('0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF');
    expect(insertToSubdomainCoinTypeQueries[1]).toContain('2147492101'); 
    expect(insertToSubdomainCoinTypeQueries[1]).toContain('0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF');
  });

  it('should successfully update an existing subdomain', async () => {
    // Given a request to update a subdomain
    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        domain: 'test.eth',
        name: 'mysubdomain',
        address: '0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF',
      },
      query: {
        network: 'mainnet'
      },
      headers: {
        authorization: 'test-api-key'
      }
    });
    sql
      .mockResolvedValueOnce([{ id: 123, address: '0x123' }]) // subdomain query finds existing
      .mockResolvedValueOnce([]) // update subdomain
      .mockResolvedValueOnce([]) // delete text records
      .mockResolvedValueOnce([]) // delete coin types
      .mockResolvedValueOnce([]); // insert user engagement

    const expectedSqlQueriesPrefixes = [
      'select subdomain.id, subdomain.address',
      'update subdomain set',
      'delete from subdomain_text_record',
      'delete from subdomain_coin_type',
      'insert into user_engagement'
    ];

    // When the handler is called
    await handler(req, res);

    // Then the response status code is 200
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true
    });
    // Verify the database was queried correctly
    expect(sql).toHaveBeenCalledTimes(5);
    const queries = sql.mock.calls
      .map(query => query.join('').trim());
    expectedSqlQueriesPrefixes.forEach((queryPrefix, index) => {
      expect(queries[index]).toContain(queryPrefix);
    });
  });
});