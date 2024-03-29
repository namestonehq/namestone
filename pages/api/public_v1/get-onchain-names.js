xiimport sql from "../../../lib/db";
import Cors from "micro-cors";
import { CypherPunk } from "../../../data/contracts/CypherPunk";
import Web3 from "web3";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

// Connect to the Arbitrum Sepolia testnet using the Alchemy RPC endpoint
const web3 = new Web3(
  "https://arb-sepolia.g.alchemy.com/v2/J-2xMLR7YSCYeXGpN-Pj7JApRPeNawbP"
);
const contractAddress = "0xcdb7fafde2212ec26f58f275fedf07a6ef69814c";
const contractABI = CypherPunk;
const contract = new web3.eth.Contract(contractABI, contractAddress);

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
      SELECT name, keys FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} AND "address" = ANY (${addresses})
    `;
  } else {
    subDomainNames = await sql`
      SELECT name, keys FROM ponder."NftSubdomain" WHERE "domainName" = ${domain}
    `;
  }

  if (subDomainNames.length === 0) {
    return res.status(404).json({ message: "No subdomains found" });
  }

  const result = [];

  const tokenIds = await Promise.all(
    subDomainNames.map(({ name }) => contract.methods.tokenFor(name).call())
  );

  for (let i = 0; i < subDomainNames.length; i++) {
    const { name, keys } = subDomainNames[i];
    const tokenId = tokenIds[i];

    const keysList = keys.slice(1, -1).split(",");
    const calls = keysList.map((key) =>
      contract.methods.text(tokenId, key.trim())
    );

    const textRecords = {};
    const values = await contract.methods.multicall(calls).call();

    for (let j = 0; j < keysList.length; j++) {
      const key = keysList[j].trim();
      textRecords[key] = values[j];
    }

    result.push({ name, textRecords });
  }

  return res.status(200).json(result);
}

export default cors(handler);