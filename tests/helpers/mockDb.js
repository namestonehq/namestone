const { newDb } = require("pg-mem");
const fs = require('fs');
const path = require('path');

function createMockDb() {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
    // Add more pg-mem specific configurations for better query support
    noErrorOnUndefinedParamType: true,
    allowDuplicatePubSub: true,
    // Add support for more Postgres features
    enhancedNumericTypes: true,
    functionImplementation: {
      current_database: () => 'test',
      current_schema: () => 'public',
    }
  });

  // Register custom functions used in migrations/queries
  db.public.registerFunction({
    name: "current_timestamp",
    returns: "timestamp",
    implementation: () => new Date(),
  });

  // Create tables based on migration SQL
  const createTables = (db) => {
    const migrationsDir = path.join(__dirname, '../../prisma/migrations');
    
    // Get all migration folders and sort them chronologically
    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(folder => folder !== 'migration_lock.toml')
      .sort();  // This will sort by timestamp since the folder names start with timestamps

    for (const migrationFolder of migrationFolders) {
      const migrationPath = path.join(migrationsDir, migrationFolder, 'migration.sql');
      console.log(`Applying migration from ${migrationFolder}`);
      
      if (!fs.existsSync(migrationPath)) {
        console.warn(`No migration.sql found in ${migrationFolder}`);
        continue;
      }

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split the migration SQL into individual statements
      const statements = migrationSQL.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      // Execute each statement
      for (const statement of statements) {
        try {
          // Skip certain postgres-specific commands that pg-mem doesn't support
          if (statement.toLowerCase().includes('create extension') || 
              statement.toLowerCase().includes('drop extension')) {
            continue;
          }

          // Handle complex queries by breaking them down
          if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('in (')) {
            // For migration statements containing subqueries with IN clauses,
            // we'll execute them differently to avoid pg-mem limitations
            const cleanStmt = statement
              .replace(/\bIN\b\s*\((.*?)\)/gi, '= ANY($1)')
              .replace(/\bTEXT\[\]/gi, 'TEXT')
              .replace(/\bTIMESTAMP\(\d+\)/gi, 'TIMESTAMP');
            db.public.none(cleanStmt);
          } else {
            db.public.none(statement);
          }
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`Warning executing statement from ${migrationFolder}: ${error.message}`);
          }
        }
      }
    }
  };

  createTables(db);

  // Create a tagged template function that matches the postgres library interface
  function sql(strings, ...values) {
    try {
      if (!Array.isArray(strings)) {
        // Handle raw queries
        const query = typeof strings === 'string' ? strings : strings.toString();
        
        // Handle complex queries by converting IN clauses to = ANY
        if (query.toLowerCase().includes('in (select')) {
          const modifiedQuery = query.replace(
            /\bIN\b\s*\((SELECT[^)]+)\)/gi,
            '= ANY($1)'
          );
          return db.public.query(modifiedQuery, values);
        }
        
        return db.public.query(query, values);
      }

      // Convert template literal to parameterized query
      let query = strings[0];
      for (let i = 0; i < values.length; i++) {
        query += `$${i + 1}${strings[i + 1]}`;
      }

      // Handle complex queries by converting IN clauses to = ANY
      if (query.toLowerCase().includes('in (select')) {
        query = query.replace(
          /\bIN\b\s*\((SELECT[^)]+)\)/gi,
          '= ANY($1)'
        );
      }

      return db.public.query(query, values);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  // Add properties to match postgres library
  sql.query = (text, params) => {
    try {
      // Handle complex queries by converting IN clauses to = ANY
      if (text.toLowerCase().includes('in (select')) {
        const modifiedText = text.replace(
          /\bIN\b\s*\((SELECT[^)]+)\)/gi,
          '= ANY($1)'
        );
        return db.public.query(modifiedText, params);
      }
      return db.public.query(text, params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  };
  sql.unsafe = (query) => db.public.query(query);

  // Add count property to match postgres library
  Object.defineProperty(sql, 'count', {
    get() {
      return this.length;
    }
  });

  return sql;
}

// Create and export a singleton instance
const mockDb = createMockDb();
module.exports = mockDb;
