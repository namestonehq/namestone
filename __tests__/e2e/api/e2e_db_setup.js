const postgres = require("postgres");
const { execSync } = require("child_process");
const sql = require("../../../lib/db").default;
require("dotenv").config({ path: ".env.test" });

// Verify we're using test database
if (!process.env.DB_NAME?.includes("test")) {
  throw new Error("Test database name must include 'test' for safety");
}
if (!process.env.DATABASE_BASE_URL?.includes("localhost")) {
  throw new Error("Test database must be on localhost");
}

async function setupTestDatabase() {
  // Database setup
  const adminSql = postgres(`${process.env.DATABASE_BASE_URL}/postgres`);

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
    console.log("Running Prisma migrations...");
    execSync("npx prisma validate", {
      stdio: "inherit",
      env: {
        ...process.env,
      },
    });

    execSync("npx prisma db push", {
      stdio: "inherit",
      env: {
        ...process.env,
      },
    });
  } catch (error) {
    console.error("Error in test setup:", error);
    throw error;
  }

  // Verify database is empty
  console.log("Verifying database is empty...");

  const tables = [
    "domain",
    "subdomain",
    "subdomain_text_record",
    "subdomain_coin_type",
    "api_key",
  ];
  for (const table of tables) {
    const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
    if (count[0].count > 0) {
      throw new Error(
        `Table ${table} is not empty. Found ${count[0].count} rows.`
      );
    }
    console.log(`Verified ${table} is empty`);
  }
}

async function teardownTestDatabase() {
  // Close the test database connection
  await sql.end();

  // Connect to postgres to drop the test database
  const adminSql = postgres(`${process.env.DATABASE_BASE_URL}/postgres`);

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
    console.error("Error dropping test database:", error);
    throw error;
  } finally {
    await adminSql.end();
  }
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
};
