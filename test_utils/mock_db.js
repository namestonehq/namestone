/**
 * Mock the database for testing
 * 
 * This is a workaround to mock the database module to use the `TEST_DATABASE_URL` environment variable
 * instead of the `POSTGRES_URI` environment variable.
 */
import postgres from "postgres";

const sql = postgres(process.env.TEST_DATABASE_URL, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});
export default sql;
