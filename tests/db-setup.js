const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');

function setupTestDb() {
  // Initialize pg-mem
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  // Add custom functions that might be used in migrations
  db.public.registerFunction({
    name: 'current_timestamp',
    returns: 'timestamp',
    implementation: () => new Date(),
  });

  // Create the sql tag template handler
  const sql = (strings, ...values) => {
    const text = strings.reduce((prev, curr, i) => 
      prev + '$' + i + curr
    );
    
    return db.public.query(text, values);
  };

  // Add the unsafe method for raw queries
  sql.unsafe = (query) => db.public.query(query);

  // Read migration SQL
  const migrationPath = path.join(process.cwd(), 'prisma/migrations/20230525034439_namestone/migration.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split and execute migrations
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      db.public.query(statement);
    } catch (error) {
      console.error(`Error executing statement: ${statement}`);
      throw error;
    }
  }

  return sql;
}

module.exports = setupTestDb; 