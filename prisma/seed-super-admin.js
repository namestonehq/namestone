const postgres = require("postgres");
const dotenv = require('dotenv');

dotenv.config();

console.log("Seeding super admin access at", process.env.POSTGRES_URI);

const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

async function main() {
  const address = process.argv[2];
  
  if (!address) {
    console.error('Please provide an Ethereum address as an argument');
    console.log('Usage: node prisma/seed-super-admin.js 0x1234...');
    process.exit(1);
  }

  // Add as super admin
  await sql`
    INSERT INTO super_admin (address)
    VALUES (${address})
    ON CONFLICT (address) DO NOTHING
  `;

  console.log(`✨ Added ${address} as super admin`);
  console.log('You can now access the admin UI at http://localhost:3000/admin');
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 