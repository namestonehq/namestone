import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { batch, getResolver } from "@ensdomains/ensjs/public";
import { mainnet, sepolia } from "viem/chains";
import { createPublicClient, http, isAddress } from "viem";
import { getToken } from "next-auth/jwt";

// Constants
const providerUrl = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const sepoliaProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

// Function to get the appropriate client based on network
const getNetworkClient = (network) => {
  const isSepoliaNetwork = network === "Sepolia";

  console.log(isSepoliaNetwork);
  return createPublicClient({
    chain: {
      ...addEnsContracts(isSepoliaNetwork ? sepolia : mainnet),
      subgraphs: {
        ens: {
          url:
            (isSepoliaNetwork
              ? process.env.SEPOLIA_SUBGRAPH_URL
              : process.env.SUBGRAPH_URL) || "",
        },
      },
    },
    transport: http(isSepoliaNetwork ? sepoliaProviderUrl : providerUrl),
  }).extend(ensSubgraphActions);
};

const goodResolvers = [
  "0x7CE6Cf740075B5AF6b1681d67136B84431B43AbD",
  "0xd17347fA0a6eeC89a226c96a9ae354F785e94241",
  "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65",
  "0xA87361C4E58B619c390f469B9E6F27d759715125",
];
const latestResolvers = ["0xA87361C4E58B619c390f469B9E6F27d759715125"];
const goodSepoliaResolvers = ["0x467893bFE201F8EfEa09BBD53fB69282e6001595"];
const latestSepoliaResolvers = ["0x467893bFE201F8EfEa09BBD53fB69282e6001595"];

export default async function handler(req, res) {
  console.log(`[mendeleden-debug] get-domains called`);
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  console.log(`[mendeleden-debug] get-domains called after method check`);
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  console.log(`[mendeleden-debug] get-domains called after token check`);
  const address = token.sub;

  if (!address || !isAddress(address, { strict: false })) {
    res.status(400).json({ error: "Missing address" });
    return;
  }

  console.log(`[mendeleden-debug] get-domains called after address check`);

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  console.log(`[mendeleden-debug] get-domains called after address regex check`);
  // get network from url
  const network = req.query.network;
  if (!network) {
    res.status(400).json({ error: "Missing network" });
    return;
  }

  console.log(`[mendeleden-debug] get-domains called after network check`);
  try {
    const client = getNetworkClient(network);
    console.log(`[mendeleden-debug] get-domains called after getNetworkClient`);
    console.log(`[mendeleden-debug] calling client getNamesForAddress`);
    const result = await client.getNamesForAddress({
      address: address,
      pageSize: 1000,
    });
    console.log(`results!`);
    console.log(result);
    console.log(`[mendeleden-debug] get-domains called after getNamesForAddress`);
    const filteredResult = result.filter((item) => item.name);

    const displayedData = await batch(
      client,
      ...filteredResult.map((item) => getResolver.batch({ name: item.name }))
    );

    const enrichedData = filteredResult.map((item, index) => {
      const resolver = displayedData[index] || "";
      const isMainnet = network === "Mainnet";
      const validResolvers = isMainnet ? goodResolvers : goodSepoliaResolvers;
      const latestResolverList = isMainnet
        ? latestResolvers
        : latestSepoliaResolvers;

      let resolverStatus = "invalid";
      if (validResolvers.includes(resolver)) {
        resolverStatus = latestResolverList.includes(resolver)
          ? "latest"
          : "old";
      }

      return {
        name: item.name,
        resolvedAddress: item.resolvedAddress,
        parentName: item.parentName,
        owner: item.owner,
        createdAt: item.createdAt,
        validResolver: validResolvers.includes(resolver),
        latestResolver: latestResolverList.includes(resolver),
        resolverStatus: resolverStatus,
        expiryDate: item.expiryDate,
        resolver: resolver,
      };
    });

    res.status(200).json(enrichedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch names" });
  }
}
