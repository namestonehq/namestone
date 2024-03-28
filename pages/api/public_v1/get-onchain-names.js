import sql from "../../../lib/db";
import Cors from "micro-cors";
import { CypherPunk } from "../../../data/contracts/CypherPunk";
import Web3 from "web3";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

// Connect to the Arbitrum Sepolia testnet
const web3 = new Web3("https://sepolia.arbitrum.io/rpc");
const contractAddress = "0xcdb7fafde2212ec26f58f275fedf07a6ef69814c";
const contractABI = CypherPunk;
const contract = new web3.eth.Contract(contractABI, contractAddress);

async function handler(req, res) {
  // Check required parameters
  const domain = req.query.domain;
  const address = req.query.address;

  if (!domain) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const subDomainName = await sql`
    SELECT name, keys FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} AND "address" = ${address}
  `;

  if (subDomainName.length === 0) {
    return res.status(404).json({ message: "Subdomain not found" });
  }

  const name = subDomainName[0].name;
  const tokenId = await contract.methods.tokenFor(name).call();

  const textRecords = {};
  const keys = ["avatar", "description", "location", "com.twitter", "url"];

  for (const key of keys) {
    const value = await contract.methods.text(tokenId, key).call();
    textRecords[key] = value;
  }

  return res.status(200).json({ ...subDomainName[0], textRecords });
}

export default cors(handler);
