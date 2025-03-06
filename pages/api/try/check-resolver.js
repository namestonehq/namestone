import { addEnsContracts } from "@ensdomains/ensjs";
import { getResolver } from "@ensdomains/ensjs/public";
import { mainnet, sepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

// Constants
const providerUrl = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const sepoliaProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { domain, network } = req.query;

  if (!domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  if (!network) {
    return res.status(400).json({ error: "Network is required" });
  }

  try {
    const isSepoliaNetwork = network.toLowerCase() === "sepolia";
    const client = createPublicClient({
      chain: addEnsContracts(isSepoliaNetwork ? sepolia : mainnet),
      transport: http(isSepoliaNetwork ? sepoliaProviderUrl : providerUrl),
    });

    const resolver = await getResolver(client, { name: domain });

    return res.status(200).json({ resolver });
  } catch (error) {
    console.error("Error checking resolver:", error);
    return res.status(500).json({ error: "Failed to check resolver" });
  }
}
