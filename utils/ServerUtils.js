import sql from "../lib/db.js";
import { ethers } from "ethers";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { createSiweMessage, parseSiweMessage } from "viem/siwe";
import { getOwner } from "@ensdomains/ensjs/public";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { getToken } from "next-auth/jwt";

export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

export const client = createPublicClient({
  chain: {
    ...addEnsContracts(mainnet),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL || "",
      },
    },
  },
  transport: http(providerUrl || ""),
}).extend(ensSubgraphActions);

export const sepoliaProviderUrl =
  "https://eth-sepolia.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

export const sepoliaClient = createPublicClient({
  chain: {
    ...addEnsContracts(sepolia),
    subgraphs: {
      ens: {
        url: process.env.SUBGRAPH_URL_SEPOLIA || "",
      },
    },
  },
  transport: http(sepoliaProviderUrl || ""),
}).extend(ensSubgraphActions);

// get whether a user is eligible to claim a name
// Takes a user token and returns a payload with eligibility information
export async function getEligibility(token, domain) {
  // User Address is kept in token.sub
  const userAddress = token.sub;
  let hasClaimed = false;
  let reasons = [];

  // Check db to see domain exists
  const domainQuery = await sql`
  select id from domain where name = ${domain} and netork='mainnet' limit 1`;

  if (domainQuery.length === 0) {
    // if domain doesn't exist we return user can't claim
    return { hasClaimed: hasClaimed, reasons: [] };
  }

  // get eligibility items from db
  const eligibilityQuery = await sql`
  select  requirement, parameters from eligibility_item where domain_id = ${domainQuery[0].id}`;

  // if no eligibility items are found, we add open as a default
  if (eligibilityQuery.length === 0) {
    reasons.push("open");
  }

  // check eligibility items
  for (const eligibilityItem of eligibilityQuery) {
    // check if user is on allowlist
    if (eligibilityItem.requirement === "allowlist") {
      const allowlist = eligibilityItem.parameters;
      if (allowlist === undefined || allowlist === null) {
        continue;
      }
      const lowercaseAllowlist = allowlist.map((word) => word.toLowerCase());
      if (lowercaseAllowlist.includes(userAddress.toLowerCase())) {
        reasons.push("allowlist");
      }
    } else if (eligibilityItem.requirement === "nft") {
      if (
        eligibilityItem.parameters === undefined ||
        eligibilityItem.parameters === null ||
        eligibilityItem.parameters.length === 0
      ) {
        continue;
      }
      const nftContract = eligibilityItem.parameters[0];
      let addresses = [userAddress];
      // If wassies check EPS
      if (domain === "wassies.eth") {
        addresses = await getEPSAddresses(userAddress);
      }
      // get nfts owned by user that fit the contract
      const ownedNfts = await getNFTs(addresses, nftContract);
      // if there are nfts owned, add nft to reasons
      if (ownedNfts > 0) {
        reasons.push("nft");
      }
    } else if (eligibilityItem.requirement === "open") {
      reasons.push("open");
    }
  }

  const nameEntry = await sql`
  select name 
  from subdomain 
  where address = ${userAddress}
  and domain_id = ${domainQuery[0].id} limit 1`;

  if (nameEntry.length > 0) {
    hasClaimed = true;
  }

  const payload = { hasClaimed: hasClaimed, reasons: reasons };
  return payload;
}

// Get whether a name is available to claim
export async function getAvailability(domain, name) {
  // check name eligibility
  if (name.length < 3) {
    return {
      nameAvailable: false,
      errorMsg: "Name must be at least 3 characters",
    };
  }

  if (name.length > 128) {
    return {
      nameAvailable: false,
      errorMsg: "Name must be less than 128 characters",
    };
  }

  if (/^[a-zA-Z0-9]+$/.test(name) === false) {
    return { nameAvailable: false, errorMsg: "Name must be alphanumeric" };
  }
  // get blocklists from db
  const blocklistQuery = await sql`
  select uid, words from blocklist`;
  // get blocklist words with uids
  const blocklist_main = blocklistQuery.filter(
    (list) => list.uid === "main"
  )[0];
  const blocklist_pool = blocklistQuery.filter(
    (list) => list.uid === "pool"
  )[0];
  const blocklist_80fierce = blocklistQuery.filter(
    (list) => list.uid === "80fierce"
  )[0];

  if (blocklist_main.words.some((word) => name.includes(word))) {
    return { nameAvailable: false, errorMsg: "Name is not available" };
  }
  // TODO: Standardize blocklist code
  // Pooltogether only code
  if (
    (domain === "pooltogether.eth" || domain === "poooool.eth") &&
    blocklist_pool.words.includes(name.toLowerCase())
  ) {
    return { nameAvailable: false, errorMsg: "Name is not available" };
  }
  // 80 fierce blocklist
  if (domain === "80fierce.eth") {
    if (blocklist_80fierce.words.includes(name.toLowerCase())) {
      return { nameAvailable: false, errorMsg: "Name is not available" };
    }
  }

  // get domain
  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

  if (domainQuery.length === 0) {
    // if domain doesn't exist we return user can't claim
    return { nameAvailable: false, errorMsg: "Domain not registered" };
  }

  // Check db to see if name has been claimed
  const nameEntry = await sql`
  select name 
  from subdomain 
  where name = ${name.toLowerCase()}
  and domain_id = ${domainQuery[0].id} limit 1`;

  if (nameEntry.length > 0) {
    return { nameAvailable: false, errorMsg: "Name is not available" };
  }
  return { nameAvailable: true, errorMsg: "" };
}

export async function getNFTs(addresses, contractAddress) {
  // Connect to the provider
  let provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const ERC721_ABI = [
    // Only include the necessary parts of the ABI
    "function balanceOf(address owner) view returns (uint256)",
  ];

  const nftContract = new ethers.Contract(
    contractAddress,
    ERC721_ABI,
    provider
  );
  let totalBalance = 0;
  for (const address of addresses) {
    const balance = await nftContract.balanceOf(address);
    totalBalance += balance;
  }
  return totalBalance;
}

export async function getEPSAddresses(hotAddress) {
  // Connect to the provider
  let provider = new ethers.providers.JsonRpcProvider(providerUrl);

  // Define the contract address and ABI
  const epsContractAddress = "0x888888888888660F286A7C06cfa3407d09af44B2";
  const epsContractAbi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "hot_",
          type: "address",
        },
        {
          internalType: "address",
          name: "collection_",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "usageType_",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "includeSecondary_",
          type: "bool",
        },
        {
          internalType: "bool",
          name: "includeRental_",
          type: "bool",
        },
      ],
      name: "getAddresses",
      outputs: [
        {
          internalType: "address[]",
          name: "addresses_",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  // Define the constant parameters
  const collectionAddress = "0x0000000000000000000000000000000000000000";
  const usageType = 1;
  const includeSecondary = true;
  const includeRentals = true;

  // Connect to the contract
  const epsContract = new ethers.Contract(
    epsContractAddress,
    epsContractAbi,
    provider
  );

  // Call the getAddresses function and await for the promise to resolve
  const addresses = await epsContract.getAddresses(
    hotAddress,
    collectionAddress,
    usageType,
    includeSecondary,
    includeRentals
  );

  // Return the array of addresses
  return addresses;
}

export async function checkApiKey(apiKey, domain) {
  if (!apiKey) {
    return false;
  }
  const apiQuery = await sql`
    SELECT api_key.id, key, domain.name FROM api_key 
    join domain 
    on api_key.domain_id = domain.id
    where domain.name = ${domain}
    and api_key.key = ${apiKey}`;

  if (apiQuery.count == 1) {
    return true;
  }
  return false;
}

// function to check if user is an admin of the domain
export async function getAdminToken(req, domain) {
  const token = await getToken({ req });
  if (!token || !domain) {
    return false;
  }
  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub}`;
  const adminQuery = await sql`
  SELECT * FROM admin
  join domain on admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  and domain.name = ${domain}`;
  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return false;
  }
  return token;
}

// function to check if user is admin of domain by id
export async function getAdminTokenById(req, domainId) {
  const token = await getToken({ req });
  if (!token || !domainId) {
    return false;
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub}`;
  const adminQuery = await sql`
  SELECT * FROM admin
  join domain on admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  and domain.id = ${domainId}`;
  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return false;
  }
  return token;
}

const resolverList = [
  "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
  "0x828ec5bDe537B8673AF98D77bCB275ae1CA26D1f",
  "0x84c5AdB77dd9f362A1a3480009992d8d47325dc3",
  "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
  "0xA87361C4E58B619c390f469B9E6F27d759715125",
  "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD",
  "0x467893bFE201F8EfEa09BBD53fB69282e6001595", //Sepolia
];

export async function checkResolver(ensName, network = "mainnet") {
  try {
    let resolver;
    if (network === "sepolia") {
      resolver = await sepoliaClient.getEnsResolver({ name: ensName });
    } else {
      resolver = await client.getEnsResolver({ name: ensName });
    }
    return resolverList.includes(resolver);
  } catch (error) {
    console.error("Error checking ENS resolver:", error);
    return false;
  }
}

export async function verifySignature(address, signature) {
  try {
    // get siwe message from sql
    const siweQuery = await sql`
    SELECT message FROM siwe WHERE address = ${address} limit 1`;
    if (siweQuery.length === 0) {
      return {
        success: false,
        error:
          "Invalid Siwe message - Either it doesn't exist or has been used. Please request another.",
      };
    }
    console.log("Signature:", signature);
    const message = siweQuery[0].message;
    const preparedMessage = createSiweMessage(parseSiweMessage(message));
    console.log("Prepared message:", preparedMessage);
    const valid = await client.verifySiweMessage({
      address: address,
      message: preparedMessage,
      signature,
    });
    // check signature
    if (!valid) {
      return { success: false, error: "Invalid signature" };
    }
  } catch (error) {
    console.log("Error validating signature:", error);
    return { success: false, error: "Error validating signature" };
  }
  // delete siwe message
  await sql`DELETE FROM siwe WHERE address = ${address}`;
  // return success
  return { success: true, error: "" };
}

export async function getDomainOwner(domain, network = "mainnet") {
  // resolve owner of domain using ens
  try {
    let result;
    if (network === "sepolia") {
      result = await getOwner(sepoliaClient, { name: domain });
    } else {
      result = await getOwner(client, { name: domain });
    }
    const ensAddress = result.owner;
    return ensAddress;
  } catch (error) {
    console.error("Error resolving domain owner:", error);
    return "";
  }
}

export async function getOnchainDomainInfo(basename) {
  const address = await client.getEnsAddress({
    name: normalize(basename),
  });
  console.log("Address:", address);
  const description = await client.getEnsText({
    name: normalize(basename),
    key: "description",
  });
  const ensAvatar = await client.getEnsAvatar({
    name: normalize(basename),
  });
  const location = await client.getEnsText({
    name: normalize(basename),
    key: "location",
  });
  const twitter = await client.getEnsText({
    name: normalize(basename),
    key: "com.twitter",
  });
  const discord = await client.getEnsText({
    name: normalize(basename),
    key: "com.discord",
  });
  const github = await client.getEnsText({
    name: normalize(basename),
    key: "com.github",
  });
  const website = await client.getEnsText({
    name: normalize(basename),
    key: "url",
  });

  const result = {
    domain: basename,
    address: address,
    text_records: {
      avatar: ensAvatar,
      description: description,
      location: location,
      "com.twitter": twitter,
      "com.github": github,
      "com.discord": discord,
      url: website,
    },
  };
  return result;
}

export function getNetwork(req) {
  const network = req.query.network.toLowerCase();
  if (network === "public_v1") {
    return "mainnet";
  }
  if (network === "public_v1_sepolia") {
    return "sepolia";
  } else {
    return false;
  }
}

export function getClientIp(req) {
  // Try to get IP from X-Forwarded-For header (common in proxied environments like Vercel)
  const xForwardedFor = req.headers['x-forwarded-for'] || 
                         req.headers.get?.('x-forwarded-for');
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one (client's IP)
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Fallback to other headers if X-Forwarded-For isn't available
  return req.headers['x-real-ip'] || 
         req.headers.get?.('x-real-ip') ||
         req.socket?.remoteAddress ||
         null;
}
