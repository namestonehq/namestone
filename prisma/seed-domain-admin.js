const postgres = require("postgres");
const dotenv = require('dotenv');

dotenv.config();

console.log("Seeding domain admin access at", process.env.POSTGRES_URI);

const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

async function main() {
  const address = process.argv[2];
  const domainInput = process.argv[3];
  
  if (!address || !domainInput) {
    console.error('Please provide an Ethereum address and domain option');
    console.log('Usage:');
    console.log('  For all domains: node prisma/seed-domain-admin.js 0x1234... all');
    console.log('  For specific domains: node prisma/seed-domain-admin.js 0x1234... "test-mainnet.eth,second-mainnet.eth"');
    process.exit(1);
  }

  let domains;
  if (domainInput.toLowerCase() === 'all') {
    domains = await sql`SELECT id, name FROM domain`;
  } else {
    const domainNames = domainInput.split(',').map(d => d.trim());
    domains = await sql`
      SELECT id, name FROM domain 
      WHERE name = ANY(${domainNames})
    `;
  }

  if (domains.length === 0) {
    console.error('No matching domains found');
    process.exit(1);
  }

  for (const domain of domains) {
    await sql`
      INSERT INTO admin (domain_id, address)
      VALUES (${domain.id}, ${address})
      ON CONFLICT DO NOTHING
    `;
    console.log(`✨ Added ${address} as admin for domain: ${domain.name}`);
  }

  console.log('You can now access the admin UI at http://localhost:3000/admin');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 