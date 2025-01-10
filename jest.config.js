const nextJest = require('next/jest')
 
/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})
 
// Add any custom config to be passed to Jest
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@ensdomains|uint8arrays|multicodec|multiformats|@rainbow-me|jose|next-auth|ethers|viem|wagmi|multihashes-sync|dns-packet|sver)/)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
}
 
// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config)