import postgres from 'postgres';
import dotenv from 'dotenv';

/**
 * Load the .env.test file for testing
 */
dotenv.config({ path: '.env.test' }, { override: true });

const TEST_DB_URL_POSTGRES = `${process.env.TEST_DATABASE_BASE}/postgres`;
/**
 * Check if the test database is accessible
 */
async function checkDatabaseConnection() {
  const sql = postgres(TEST_DB_URL_POSTGRES, {
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  try {
    // Try to connect and run a simple query
    await sql`SELECT 1`;
    console.log("✅ Test database connection successful");
  } catch (error) {
    console.error("❌ Failed to connect to test database");
    console.error(`Database URL: ${TEST_DB_URL_POSTGRES}`);
    console.error("Error details:", error.message);
    console.error(`
  Please ensure:
  1. PostgreSQL is running locally (see README.md for instructions)
  2. The test database exists: ${process.env.TEST_DB_NAME}
  3. The credentials in .env.test are correct
  4. The database is accessible at ${TEST_DB_URL_POSTGRES}
  `);
    throw new Error(
      "Local database is unreachable. Please check that PostgreSQL is running and properly configured."
    );
  } finally {
    await sql.end();
  }
}

// globalSetup.js
module.exports = async () => {
  console.log("\nPerforming global checks...");
  await checkDatabaseConnection();
  console.log("✅ Global checks completed successfully");
};
