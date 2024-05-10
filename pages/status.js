import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { ethers } from "ethers";

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
    name: "converse.eth",
    gateway: "Namestone gateway",
  },
];
export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

export default function Status() {
  const [status, setStatus] = useState(["pending", "pending", "pending"]);
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

      <div className="w-full h-full p-32 overflow-x-auto border rounded-lg border-1 border-neutral-200">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
