const { newDb } = require("pg-mem");

function createMockDb() {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  // Register custom functions used in migrations/queries
  db.public.registerFunction({
    name: "current_timestamp",
    returns: "timestamp",
    implementation: () => new Date(),
  });

  // Create tables based on Prisma schema
  const createTables = (db) => {
    // user_engagement
    db.public.none(`
      CREATE TABLE user_engagement (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        address VARCHAR,
        name VARCHAR,
        details JSONB
      );
    `);

    // domain
    db.public.none(`
      CREATE TABLE domain (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        network VARCHAR DEFAULT 'mainnet',
        address VARCHAR,
        name VARCHAR,
        contract VARCHAR,
        contenthash VARCHAR,
        contenthash_raw VARCHAR,
        name_limit INTEGER DEFAULT 0
      );
      CREATE INDEX domain__name ON domain(name);
    `);

    // domain_text_record
    db.public.none(`
      CREATE TABLE domain_text_record (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domain(id),
        key VARCHAR,
        value VARCHAR
      );
      CREATE INDEX domain_text_record__domain_id ON domain_text_record(domain_id);
    `);

    // domain_coin_type
    db.public.none(`
      CREATE TABLE domain_coin_type (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domain(id),
        coin_type VARCHAR,
        address VARCHAR
      );
    `);

    // subdomain
    db.public.none(`
      CREATE TABLE subdomain (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        address VARCHAR,
        name VARCHAR,
        domain_id INTEGER REFERENCES domain(id),
        contenthash VARCHAR,
        contenthash_raw VARCHAR
      );
      CREATE INDEX subdomain__address ON subdomain(address);
      CREATE INDEX subdomain__domain_id ON subdomain(domain_id);
      CREATE INDEX subdomain__name ON subdomain(name);
    `);

    // subdomain_text_record
    db.public.none(`
      CREATE TABLE subdomain_text_record (
        id SERIAL PRIMARY KEY,
        subdomain_id INTEGER REFERENCES subdomain(id),
        key VARCHAR,
        value VARCHAR
      );
      CREATE INDEX subdomain_text_record__subdomain_id ON subdomain_text_record(subdomain_id);
    `);

    // subdomain_coin_type
    db.public.none(`
      CREATE TABLE subdomain_coin_type (
        id SERIAL PRIMARY KEY,
        subdomain_id INTEGER REFERENCES subdomain(id),
        coin_type VARCHAR,
        address VARCHAR
      );
    `);

    // eligibility_item
    db.public.none(`
      CREATE TABLE eligibility_item (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domain(id),
        display VARCHAR,
        requirement VARCHAR,
        parameters JSONB
      );
    `);

    // admin
    db.public.none(`
      CREATE TABLE admin (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domain(id),
        address VARCHAR
      );
    `);

    // super_admin
    db.public.none(`
      CREATE TABLE super_admin (
        id SERIAL PRIMARY KEY,
        address VARCHAR
      );
    `);

    // brand
    db.public.none(`
      CREATE TABLE brand (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER REFERENCES domain(id),
        name VARCHAR,
        url_slug VARCHAR,
        claim_slug VARCHAR,
        description VARCHAR,
        banner_image VARCHAR,
        footer_image VARCHAR,
        default_avatar VARCHAR,
        default_description VARCHAR,
        share_with_data_providers BOOLEAN DEFAULT false,
        show_converse_link BOOLEAN DEFAULT false,
        show_mailchain_link BOOLEAN DEFAULT false
      );
    `);

    // brand_text_record
    db.public.none(`
      CREATE TABLE brand_text_record (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER,
        key VARCHAR,
        default_value VARCHAR
      );
    `);

    // api_key
    db.public.none(`
      CREATE TABLE api_key (
        id SERIAL PRIMARY KEY,
        domain_id INTEGER,
        key VARCHAR
      );
    `);

    // name_resolution
    db.public.none(`
      CREATE TABLE name_resolution (
        id SERIAL PRIMARY KEY,
        resolution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subdomain_id INTEGER
      );
    `);

    // data_provider
    db.public.none(`
      CREATE TABLE data_provider (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR,
        company_name VARCHAR
      );
    `);

    // blocklist
    db.public.none(`
      CREATE TABLE blocklist (
        id SERIAL PRIMARY KEY,
        uid VARCHAR,
        words JSONB
      );
    `);

    // siwe
    db.public.none(`
      CREATE TABLE siwe (
        id SERIAL PRIMARY KEY,
        address VARCHAR UNIQUE,
        message VARCHAR
      );
    `);
  };

  createTables(db);

  // Create a tagged template function that matches the postgres library interface
  function sql(strings, ...values) {
    if (!Array.isArray(strings)) {
      // Handle raw queries
      return db.public.query(strings);
    }

    // Convert template literal to parameterized query
    let query = strings[0];
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}${strings[i + 1]}`;
    }

    return db.public.query(query, values);
  }

  // Add properties to match postgres library
  sql.query = (text, params) => db.public.query(text, params);
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
