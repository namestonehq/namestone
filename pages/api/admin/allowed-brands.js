import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { batch, getResolver, getOwner } from "@ensdomains/ensjs/public";
import { mainnet, sepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

// Constants
const providerUrl = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const sepoliaProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

export default async function handler(req, res) {
  const token = await getToken({ req });

  let superAdmin = false;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let brands;
  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};`;
  // if not super admin check admin
  if (superAdminQuery.length === 0) {
    const adminQuery = await sql`
    SELECT domain_id, address FROM admin WHERE address = ${token.sub};
  `;
    if (adminQuery.length === 0) {
      return res.status(401).json({ error: "Unauthorized. Please refresh." });
    } else {
      const domain_ids = adminQuery.map((admin) => {
        return admin.domain_id;
      });
      brands = await sql`
      SELECT 
      brand.domain_id, brand.name, brand.url_slug, domain.name as domain, domain.avatar, domain.network as network
      FROM brand join domain on brand.domain_id = domain.id where domain.id = ANY(${domain_ids}) order by brand.id;
    `;
    }
  }
  // otherwise get all brands
  else {
    superAdmin = true;
    brands = await sql`
    SELECT 
    brand.domain_id, brand.name, brand.url_slug, domain.name as domain, domain.avatar, domain.network as network
    FROM brand join domain on brand.domain_id = domain.id order by brand.id;
  `;
  }

  // Get resolver information for each brand
  try {
    // Create clients for both networks
    const mainnetClient = createPublicClient({
      chain: addEnsContracts(mainnet),
      transport: http(providerUrl),
    }).extend(ensSubgraphActions);

    const sepoliaClient = createPublicClient({
      chain: addEnsContracts(sepolia),
      transport: http(sepoliaProviderUrl),
    }).extend(ensSubgraphActions);

    // Separate brands by network
    const mainnetBrands = brands.filter(
      (brand) => brand.network.toLowerCase() !== "sepolia"
    );
    const sepoliaBrands = brands.filter(
      (brand) => brand.network.toLowerCase() === "sepolia"
    );

    // Batch calls for mainnet
    const mainnetResults =
      mainnetBrands.length > 0
        ? await batch(
            mainnetClient,
            ...mainnetBrands.flatMap((brand) => [
              getResolver.batch({ name: brand.domain }),
              getOwner.batch({ name: brand.domain }),
            ])
          )
        : [];

    // Batch calls for sepolia
    const sepoliaResults =
      sepoliaBrands.length > 0
        ? await batch(
            sepoliaClient,
            ...sepoliaBrands.flatMap((brand) => [
              getResolver.batch({ name: brand.domain }),
              getOwner.batch({ name: brand.domain }),
            ])
          )
        : [];

    // Process results
    const mainnetBrandsWithResolver = mainnetBrands.map((brand, index) => {
      const resolverIndex = index * 2;
      const ownerIndex = index * 2 + 1;

      const resolver = mainnetResults[resolverIndex];
      const ownerData = mainnetResults[ownerIndex];
      const owner = ownerData?.owner;
      const ownershipLevel = ownerData?.ownershipLevel;

      const goodResolvers = [
        "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
        "0x828ec5bDe537B8673AF98D77bCB275ae1CA26D1f",
        "0x84c5AdB77dd9f362A1a3480009992d8d47325dc3",
        "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
        "0xA87361C4E58B619c390f469B9E6F27d759715125",
        "0xF142B308cF687d4358410a4cB885513b30A42025", // gasless DNS
      ];

      const latestResolvers = [
        "0xA87361C4E58B619c390f469B9E6F27d759715125",
        "0xF142B308cF687d4358410a4cB885513b30A42025",
      ];

      let resolverStatus = "ok";
      if (!goodResolvers.includes(resolver)) {
        resolverStatus = "incorrect";
      } else if (!latestResolvers.includes(resolver)) {
        resolverStatus = "old";
      }

      return {
        ...brand,
        resolver,
        owner,
        ownershipLevel,
        resolverStatus,
        hasResolverIssue: resolverStatus !== "ok",
      };
    });

    const sepoliaBrandsWithResolver = sepoliaBrands.map((brand, index) => {
      const resolverIndex = index * 2;
      const ownerIndex = index * 2 + 1;

      const resolver = sepoliaResults[resolverIndex];
      const ownerData = sepoliaResults[ownerIndex];
      const owner = ownerData?.owner;
      const ownershipLevel = ownerData?.ownershipLevel;

      const goodResolvers = ["0x467893bFE201F8EfEa09BBD53fB69282e6001595"];

      let resolverStatus = "ok";
      if (!goodResolvers.includes(resolver)) {
        resolverStatus = "incorrect";
      }

      return {
        ...brand,
        resolver,
        owner,
        ownershipLevel,
        resolverStatus,
        hasResolverIssue: resolverStatus !== "ok",
      };
    });

    const brandsWithResolver = [
      ...mainnetBrandsWithResolver,
      ...sepoliaBrandsWithResolver,
    ];

    const brandDict = brandsWithResolver.reduce(function (result, brand) {
      let key = brand.url_slug;
      result[key] = brand;
      return result;
    }, {});

    // sort brandUrls by name
    const brandUrls = Object.keys(brandDict).sort();

    return res.status(200).json({
      superAdmin: superAdmin,
      brandUrls: brandUrls,
      brandDict: brandDict,
    });
  } catch (error) {
    console.error("Error processing brands:", error);
    return res.status(500).json({ error: "Failed to process brands" });
  }
}
