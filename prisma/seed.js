import postgres from "postgres";
import dotenv from 'dotenv';

dotenv.config();

console.log("postgres-seed.js, seeding database at ", process.env.POSTGRES_URI);

const sql = postgres(process.env.POSTGRES_URI, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

// Domain configurations with network-specific addresses
const DOMAINS = {
  MAINNET: {
    PRIMARY: {
      name: "test-mainnet.eth",
      apiKey: "test-api-key-mainnet",
      shareData: false,
      address: "0x1111567890123456789012345678901234567891",
      subdomainAddress: "0x1111567890123456789012345678901234567892"
    },
    SECONDARY: {
      name: "second-mainnet.eth",
      apiKey: "second-test-api-key-mainnet",
      shareData: true,
      address: "0x1111567890123456789012345678901234567893",
      subdomainAddress: "0x1111567890123456789012345678901234567894"
    }
  },
  SEPOLIA: {
    PRIMARY: {
      name: "test-sepolia.eth",
      apiKey: "test-api-key-sepolia",
      shareData: false,
      address: "0x2222567890123456789012345678901234567891",
      subdomainAddress: "0x2222567890123456789012345678901234567892"
    },
    SECONDARY: {
      name: "second-sepolia.eth",
      apiKey: "second-test-api-key-sepolia",
      shareData: true,
      address: "0x2222567890123456789012345678901234567893",
      subdomainAddress: "0x2222567890123456789012345678901234567894"
    }
  }
};

// Subdomain configurations
const SUBDOMAINS = {
  MAINNET: {
    PRIMARY: [
      {
        name: "test1",
        address: "0x1111567890123456789012345678901234567891",
        records: {
          email: "test1@example.com",
          url: "https://test1.example.com",
          avatar: "https://example.com/avatar/test1.jpg"
        },
        coins: {
          "60": "0xETH-test1",
          "0": "bc1-test1",
          "2147483785": "0xMATIC-test1"
        }
      },
      {
        name: "rob",
        address: "0x1111567890123456789012345678901234567892",
        records: {
          email: "rob@example.com",
          url: "https://rob.example.com",
          discord: "rob#1234"
        },
        coins: {
          "60": "0xETH-rob",
          "0": "bc1-rob"
        }
      }
    ],
    SECONDARY: [
      {
        name: "other1",
        address: "0x1111567890123456789012345678901234567893",
        records: {
          email: "other1@second.example.com",
          url: "https://other1.second.example.com"
        },
        coins: {
          "60": "0xETH-second-other1"
        }
      },
      {
        name: "ronald",
        address: "0x1111567890123456789012345678901234567894",
        records: {
          email: "ronald@second.example.com",
          discord: "ronald#5678"
        },
        coins: {
          "60": "0xETH-second-ronald",
          "2147483785": "0xMATIC-second-ronald"
        }
      }
    ]
  },
  SEPOLIA: {
    PRIMARY: [
      {
        name: "test1",
        address: "0x2222567890123456789012345678901234567891",
        records: {
          email: "test1@example.com",
          url: "https://test1.example.com"
        },
        coins: {
          "60": "0xETH-test1-sepolia"
        }
      },
      {
        name: "alice",
        address: "0x2222567890123456789012345678901234567892",
        records: {
          email: "alice@example.com",
          twitter: "@alice_sepolia"
        },
        coins: {
          "60": "0xETH-alice-sepolia",
          "2147483785": "0xMATIC-alice-sepolia"
        }
      }
    ],
    SECONDARY: [
      {
        name: "test2",
        address: "0x2222567890123456789012345678901234567893",
        records: {
          email: "test2@second.example.com",
          url: "https://test2.sepolia.example.com"
        },
        coins: {
          "60": "0xETH-second-test2-sepolia"
        }
      },
      {
        name: "bob",
        address: "0x2222567890123456789012345678901234567894",
        records: {
          email: "bob@second.example.com",
          github: "bob-sepolia"
        },
        coins: {
          "60": "0xETH-second-bob-sepolia",
          "0": "bc1-second-bob-sepolia"
        }
      }
    ]
  }
};

async function createDomain(network, domainConfig) {
  const [domain] = await sql`
    INSERT INTO domain (name, network)
    VALUES (${domainConfig.name}, ${network})
    RETURNING id
  `;

  await sql`
    INSERT INTO api_key (domain_id, key)
    VALUES (${domain.id}, ${domainConfig.apiKey})
  `;

  await sql`
    INSERT INTO brand (domain_id, share_with_data_providers)
    VALUES (${domain.id}, ${domainConfig.shareData})
  `;

  const [fullDomain] = await sql`
    SELECT * FROM domain WHERE id = ${domain.id}
  `;
  return fullDomain;
}

async function createSubdomains(domain, subdomains) {
  for (const sub of subdomains) {
    const [subdomain] = await sql`
      INSERT INTO subdomain (domain_id, name, address)
      VALUES (
        ${domain.id},
        ${`${sub.name}.${domain.name}`},
        ${sub.address}
      )
      RETURNING id
    `;

    if (sub.records) {
      await sql`
        INSERT INTO subdomain_text_record ${sql(
          Object.entries(sub.records).map(([key, value]) => ({
            subdomain_id: subdomain.id,
            key,
            value
          }))
        )}
      `;
    }

    if (sub.coins) {
      await sql`
        INSERT INTO subdomain_coin_type ${sql(
          Object.entries(sub.coins).map(([coin_type, address]) => ({
            subdomain_id: subdomain.id,
            coin_type,
            address
          }))
        )}
      `;
    }
  }
}

async function main() {
  for (const [network, domains] of Object.entries({ mainnet: DOMAINS.MAINNET, sepolia: DOMAINS.SEPOLIA })) {
    const primaryDomain = await createDomain(network, domains.PRIMARY);
    await createSubdomains(primaryDomain, SUBDOMAINS[network.toUpperCase()].PRIMARY);

    const secondaryDomain = await createDomain(network, domains.SECONDARY);
    await createSubdomains(secondaryDomain, SUBDOMAINS[network.toUpperCase()].SECONDARY);

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