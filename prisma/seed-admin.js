const postgres = require("postgres");
const dotenv = require('dotenv');

dotenv.config();

console.log("Seeding admin access at", process.env.POSTGRES_URI);

const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

async function main() {
  const address = process.argv[2];
  
  if (!address) {
    console.error('Please provide an Ethereum address as an argument');
    console.log('Usage: node prisma/seed-admin.js 0x1234...');
    process.exit(1);
  }

  // Add as super admin
  await sql`
    INSERT INTO super_admin (address)
    VALUES (${address})
    ON CONFLICT (address) DO NOTHING
  `;

  // Also add as admin for all domains (optional, but helpful for testing)
  const domains = await sql`SELECT id FROM domain`;
  
  for (const domain of domains) {
    await sql`
      INSERT INTO admin (domain_id, address)
      VALUES (${domain.id}, ${address})
      ON CONFLICT DO NOTHING
    `;
  }

  console.log(`✨ Added ${address} as super admin and domain admin`);
  console.log('You can now access the admin UI at http://localhost:3000/admin');
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 