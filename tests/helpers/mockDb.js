const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

function createMockDb() {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  // Register custom functions used in migrations/queries
  db.public.registerFunction({
    name: 'current_timestamp',
    returns: 'timestamp',
    implementation: () => new Date(),
  });

  // Create a tagged template function that matches the postgres library interface
  const sql = (strings, ...values) => {
    if (!Array.isArray(strings)) {
      // Handle raw queries
      return db.public.query(strings);
    }

    // Convert template literal to parameterized query
    const text = strings.reduce((prev, curr, i) => {
      return prev + '$' + i + curr;
    });

    return db.public.query(text, values);
  };

  // Add raw query method
  sql.unsafe = (query) => db.public.query(query);

  // Initialize schema
  const migrationPath = path.join(process.cwd(), 'prisma/migrations/20230525034439_namestone/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      sql.unsafe(statement);
    } catch (error) {
      console.error(`Error executing migration statement: ${statement}`);
      throw error;
    }
  }

  return sql;
}

// Create and export a singleton instance
const mockDb = createMockDb();
module.exports = mockDb;

// Also export the creation function for cases where we need a fresh instance
module.exports.createMockDb = createMockDb;