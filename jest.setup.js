import dotenv from 'dotenv';

/**
 * Load the .env.test file for testing
 */
dotenv.config({ path: '.env.test' }, { override: true });