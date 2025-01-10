require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
const setupTestDb = require('./tests/db-setup');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock the database
jest.mock('./lib/db', () => {
  return setupTestDb();
});

// Mock next-auth
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(() => Promise.resolve({ sub: '0x1234567890123456789012345678901234567890' }))
}));

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      JsonRpcProvider: jest.fn()
    }
  }
}));

// Mock viem and related dependencies
const mockClient = {
  extend: jest.fn().mockReturnThis(),
  getEnsName: jest.fn(),
  getEnsAddress: jest.fn(),
  getEnsResolver: jest.fn(),
  getEnsText: jest.fn(),
};

jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => mockClient),
  http: jest.fn(),
  mainnet: { id: 1 },
  sepolia: { id: 11155111 }
}));

// Mock @ensdomains/ensjs
jest.mock('@ensdomains/ensjs', () => ({
  addEnsContracts: jest.fn(),
  ensSubgraphActions: {
    getNames: jest.fn(),
    getRegistrations: jest.fn(),
    getDomainById: jest.fn()
  }
}));

// Mock content-hash
jest.mock('@ensdomains/content-hash', () => ({
  decode: jest.fn(),
  encode: jest.fn((value) => value)
}));

// Mock ServerUtils
jest.mock('./utils/ServerUtils', () => ({
  getNetwork: jest.fn(() => 'mainnet'),
  checkApiKey: jest.fn(() => true),
  getAdminToken: jest.fn(() => null),
  normalize: jest.fn(str => str.toLowerCase()),
  providerUrl: 'mock-provider-url',
  sepoliaProviderUrl: 'mock-sepolia-provider-url',
  client: mockClient
})); 