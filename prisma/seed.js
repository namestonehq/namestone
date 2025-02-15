const postgres = require("postgres");
const dotenv = require('dotenv');

dotenv.config();

console.log("postgres-seed.js, seeding database at ", process.env.POSTGRES_URI);

const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

const TEST_ADDRESSES = {
  1: "0x1234567890123456789012345678901234567891",
  2: "0x1234567890123456789012345678901234567892",
  3: "0x1234567890123456789012345678901234567893"
};

async function main() {
  // Create test domains for each network
  const networks = ['mainnet', 'sepolia'];
  
  for (const network of networks) {
    // Create first domain (primary test domain)
    const [firstDomain] = await sql`
      INSERT INTO domain (name, network)
      VALUES (${`test-${network}.eth`}, ${network})
      RETURNING id
    `;

    // Create API key for first domain
    await sql`
      INSERT INTO api_key (domain_id, key)
      VALUES (${firstDomain.id}, ${`test-api-key-${network}`})
    `;

    // Create brand settings for first domain
    await sql`
      INSERT INTO brand (domain_id, share_with_data_providers)
      VALUES (${firstDomain.id}, false)
    `;

    // Create second domain
    const [secondDomain] = await sql`
      INSERT INTO domain (name, network)
      VALUES (${`second-${network}.eth`}, ${network})
      RETURNING id
    `;

    // Create API key for second domain
    await sql`
      INSERT INTO api_key (domain_id, key)
      VALUES (${secondDomain.id}, ${`second-test-api-key-${network}`})
    `;

    // Create brand settings for second domain
    await sql`
      INSERT INTO brand (domain_id, share_with_data_providers)
      VALUES (${secondDomain.id}, true)
    `;

    // Create subdomains for first domain
    const firstDomainNames = ["test1", "test2", "test3", "rob", "robert", "alice"];
    for (const name of firstDomainNames) {
      const [subdomain] = await sql`
        INSERT INTO subdomain (domain_id, name, address)
        VALUES (
          ${firstDomain.id},
          ${`${name}.${firstDomain.name}`},
          ${TEST_ADDRESSES[1]}
        )
        RETURNING id
      `;

      // Add text records
      await sql`
        INSERT INTO subdomain_text_record (subdomain_id, key, value)
        VALUES 
          (${subdomain.id}, 'email', ${`${name}@example.com`}),
          (${subdomain.id}, 'url', ${`https://${name}.example.com`})
      `;

      // Add coin types
      await sql`
        INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
        VALUES 
          (${subdomain.id}, 60, ${`0xETH-${name}`}),
          (${subdomain.id}, 0, ${`bc1-${name}`}),
          (${subdomain.id}, 2147483785, ${`0xMATIC-${name}`})
      `;
    }

    // Create subdomains for second domain
    const secondDomainNames = ["other1", "other2", "other3", "rob-other", "ronald", "anna"];
    for (const name of secondDomainNames) {
      const [subdomain] = await sql`
        INSERT INTO subdomain (domain_id, name, address)
        VALUES (
          ${secondDomain.id},
          ${`${name}.${secondDomain.name}`},
          ${TEST_ADDRESSES[2]}
        )
        RETURNING id
      `;

      // Add text records
      await sql`
        INSERT INTO subdomain_text_record (subdomain_id, key, value)
        VALUES 
          (${subdomain.id}, 'email', ${`${name}@second.example.com`}),
          (${subdomain.id}, 'url', ${`https://${name}.second.example.com`})
      `;

      // Add coin types
      await sql`
        INSERT INTO subdomain_coin_type (subdomain_id, coin_type, address)
        VALUES 
          (${subdomain.id}, 60, ${`0xETH-second-${name}`}),
          (${subdomain.id}, 0, ${`bc1-second-${name}`}),
          (${subdomain.id}, 2147483785, ${`0xMATIC-second-${name}`})
      `;
    }
  }

  console.log('Database has been seeded with test data! 🌱');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 