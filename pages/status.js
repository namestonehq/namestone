import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { ethers } from "ethers";
import checkIcon from "../public/images/icon-orange-check.svg";
import Link from "next/link";

const resolutionList = [
  {
    name: "slobo.teamnick.eth",
    gateway: "EVM Gateway",
  },
  {
    name: "slobo.cu-cypherpunk.eth",
    gateway: "Offchain Gateway",
  },
  {
    name: "slobo.converse.xyz",
    gateway: "Namestone Gateway (Legacy) - converse",
  },
  {
    name: "slobo.nfty.eth",
    gateway: "Namestone Gateway (Legacy) - .eth",
  },
  {
    name: "slobo.xyz",
    gateway: "Namestone Gateway (Legacy) - gasless dns",
  },
];
export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

export default function Status() {
  const [status, setStatus] = useState([
    "...checking",
    "...checking",
    "...checking",
  ]);
  // use Effect to check name resolution on load
  useEffect(() => {
    async function checkEnsResolution(name) {
      let provider = new ethers.providers.JsonRpcProvider(providerUrl);

      try {
        const address = await provider.resolveName(name);
        console.log("address", address);
        if (address) {
          return "working";
        } else {
          return "error";
        }
      } catch (error) {
        return "error";
      }
    }
    const statusPromises = resolutionList.map((resolution) =>
      checkEnsResolution(resolution.name)
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
