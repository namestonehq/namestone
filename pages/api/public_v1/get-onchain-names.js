import sql from "../../../lib/db";
import Cors from "micro-cors";
import { CypherPunk } from "../../../data/contracts/CypherPunk";
import { createPublicClient, http } from "viem";
import { multicall } from "@viem/multicall";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

// Connect to the Arbitrum Sepolia testnet using the Alchemy RPC endpoint
const client = createPublicClient({
  chain: "arbitrum-sepolia",
  transport: http(
    "https://arb-sepolia.g.alchemy.com/v2/J-2xMLR7YSCYeXGpN-Pj7JApRPeNawbP"
  ),
});

const contractAddress = "0xcdb7fafde2212ec26f58f275fedf07a6ef69814c";
const contractABI = CypherPunk;

async function handler(req, res) {
  // Check required parameters
  const domain = req.query.domain;
  const addresses = req.query.addresses?.split(","); // Assuming addresses are comma-separated

  if (!domain) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let subDomainNames;
  if (addresses && addresses.length > 0) {
    subDomainNames = await sql`
      SELECT name, address, "tokenId", keys FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} AND "address" = ANY (${addresses}) order by "registeredAt" desc
    `;
  } else {
    subDomainNames = await sql`
      SELECT name, address, "tokenId", keys FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} order by "registeredAt" desc
    `;
  }

  if (subDomainNames.length === 0) {
    return res.status(200).json([]);
  }

  const contract = new multicall({
    contracts: [
      {
        address: contractAddress,
        abi: contractABI,
        functionName: "text",
      },
    ],
    publicClient: client,
  });

  const result = [];
  for (const { name, address, tokenId, keys } of subDomainNames) {
    const keysList = keys.slice(1, -1).split(",");
    const promises = keysList.map((key) =>
      contract.call({
        args: [tokenId, key.trim()],
        shouldResolveResult: true,
      })
    );

    const textRecords = (await Promise.all(promises)).reduce(
      (acc, value, index) => ({ ...acc, [keysList[index].trim()]: value }),
      {}
    );

    result.push({ name, address, textRecords });
  }

  return res.status(200).json(result);
}

export default cors(handler);
