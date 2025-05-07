import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import Link from "next/link";

const resolutionList = [
  {
    name: "slobo.teamnick.eth",
    gateway: "EVM Gateway",
    network: "mainnet",
  },
  {
    name: "slobo.cu-cypherpunk.eth",
    gateway: "Offchain Gateway",
    network: "mainnet",
  },
  {
    name: "boop.namestone-test.eth",
    gateway: "Offchain Gateway - Sepolia",
    network: "sepolia",
  },
  {
    name: "slobo.converse.xyz",
    gateway: "Namestone Gateway (Legacy) - converse",
    network: "mainnet",
  },
  {
    name: "slobo.nfty.eth",
    gateway: "Namestone Gateway (Legacy) - .eth",
    network: "mainnet",
  },
  {
    name: "slobo.xyz",
    gateway: "Namestone Gateway (Legacy) - gasless dns",
    network: "mainnet",
  },
  {
    name: "status.durinexample.eth",
    gateway: "Durin Gateway v2",
    network: "mainnet",
  },
];

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  ),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(
    `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  ),
});

export default function Status() {
  const [status, setStatus] = useState(resolutionList.map(() => "checking..."));
  // use Effect to check name resolution on load
  useEffect(() => {
    async function checkEnsResolution(name, network) {
      try {
        // Normalize the ENS name first
        const normalizedName = normalize(name);

        // Choose the appropriate client based on network
        const client = network === "sepolia" ? sepoliaClient : mainnetClient;

        // Resolve the ENS name to an address
        const address = await client.getEnsAddress({
          name: normalizedName,
        });

        // If we got an address, the name is working
        return address ? "working" : "not registered";
      } catch (error) {
        console.error(`Error resolving ${name} on ${network}:`, error);

        // Check if it's a known ENS-related error
        if (error.message?.includes("ENS")) {
          return "not supported";
        }
        return "error";
      }
    }

    const statusPromises = resolutionList.map((resolution) =>
      checkEnsResolution(resolution.name, resolution.network)
    );

    Promise.all(statusPromises).then((results) => setStatus(results));
  }, []);

  return (
    <>
      <Header />

      <div className="w-full h-full p-8 overflow-x-auto border rounded-lg sm:p-32 border-neutral-200">
        <div className="text-base font-bold text-brownblack-700">Status</div>
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left ">
                <span className="text-sm font-bold text-brownblack-700">
                  Gateway
                </span>
              </th>
              <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                Working?
              </th>
              <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                Test Case
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {resolutionList.map((resolution, index) => (
              <tr key={index}>
                <td className="px-6 py-4">{resolution.gateway}</td>
                <td
                  className={`px-6 py-4 ${
                    status[index] === "working"
                      ? "text-green-600"
                      : status[index] === "error"
                      ? "text-red-600"
                      : "text-yellow-400"
                  }`}
                >
                  {status[index]}
                </td>
                <td className="px-6 py-4">
                  <Link
                    target="_blank"
                    href={`https://app.ens.domains/${resolution.name}`}
                    className="underline underline-offset-4"
                  >
                    {resolution.name}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
