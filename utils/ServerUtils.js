import sql from "../lib/db.js";
import { ethers } from "ethers";
import contentHash from "@ensdomains/content-hash";

export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

// get whether a user is eligible to claim a name
// Takes a user token and returns a payload with eligibility information
export async function getEligibility(token, domain) {
  // User Address is kept in token.sub
  const userAddress = token.sub;
  let hasClaimed = false;
  let reasons = [];

  // Check db to see domain exists
  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

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
  console.log(apiKey, domain);
  const apiQuery = await sql`
    SELECT api_key.id, key, domain.name FROM api_key 
    join domain 
    on api_key.domain_id = domain.id
    where domain.name = ${domain}
    and api_key.key = ${apiKey}`;

  console.log(apiQuery);
  if (apiQuery.count == 1) {
    return true;
  }
  return false;
}

function matchProtocol(text) {
  return (
    text.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave|ar):\/\/(.*)/) ||
    text.match(/\/(ipfs)\/(.*)/) ||
    text.match(/\/(ipns)\/(.*)/)
  );
}

export function encodeContenthash(text) {
  let content = text;
  let contentType;
  let encoded = false;
  let error;
  if (text) {
    const matched = matchProtocol(text);
    if (matched) {
      [, contentType, content] = matched;
    }
    try {
      if (contentType === "ipfs") {
        if (content.length >= 4) {
          encoded = `0x${contentHash.encode("ipfs-ns", content)}`;
        }
      } else if (contentType === "ipns") {
        encoded = `0x${contentHash.encode("ipns-ns", content)}`;
      } else if (contentType === "bzz") {
        if (content.length >= 4) {
          encoded = `0x${contentHash.fromSwarm(content)}`;
        }
      } else if (contentType === "onion") {
        if (content.length === 16) {
          encoded = `0x${contentHash.encode("onion", content)}`;
        }
      } else if (contentType === "onion3") {
        if (content.length === 56) {
          encoded = `0x${contentHash.encode("onion3", content)}`;
        }
      } else if (contentType === "sia") {
        if (content.length === 46) {
          encoded = `0x${contentHash.encode("skynet-ns", content)}`;
        }
      } else if (contentType === "arweave" || contentType === "ar") {
        if (content.length === 43) {
          encoded = `0x${contentHash.encode("arweave-ns", content)}`;
        }
      } else if (text.startsWith("0x")) {
        encoded = text;
      } else {
        console.warn("Unsupported protocol or invalid value", {
          contentType,
          text,
        });
      }
    } catch (err) {
      const errorMessage = "Error encoding content hash";
      console.warn(errorMessage, { text, encoded });
      error = errorMessage;
      throw "Error encoding content hash";
    }
  }
  return encoded;
}
