import React from "react";
import Image from "next/image";
import CheckmarkIcon from "../../public/images/icon-checkmark.svg";
import ArrowTopRightOnSquareIcon from "../../public/images/icon-arrow-organge-top-right.svg";
import { Network } from "./formStates";
import toast from "react-hot-toast";

/**
 * ApiKeySentDocs component that displays documentation after an API key has been sent.
 * Shows a success message, steps to create a subdomain, and a code example.
 * @param {Object} props Component props
 * @param {string} props.userEnsDomain The user's ENS domain name
 * @param {string} props.walletAddress The user's wallet address
 * @param {string} props.network The network the user is using
 * @returns {JSX.Element} The ApiKeySentDocs component
 */
export const ApiKeySentDocs = ({
  userEnsDomain = "<yourdomain>.eth",
  walletAddress = "0x229...CB65",
  network = Network.MAINNET,
}) => {
  const handleCopyCode = (network) => {
    const code = `curl -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: YOUR_API_KEY' \\
  -d '{
      "domain": "${userEnsDomain}",
      "name": "example",
      "address": "0x534631Bcf33BD0b69fB20A93d2fdb9e4D4dD42CF",
      },
      "text_records": {
        "avatar": "https://ens.domains/assets/ens_logo_text_dark.svg"
      }
    }' \\
https://namestone.com/api/${
      network === Network.MAINNET ? "public_v1" : "public_v1_sepolia"
    }/set-name`;

    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success("Code copied to clipboard!", {
          style: {
            background: "#F0FDF4",
            color: "#166534",
            border: "1px solid #DCFCE7",
            padding: "12px 16px",
            maxWidth: "320px",
            margin: "0 auto",
            borderRadius: "6px",
            fontWeight: "500",
          },
          icon: "✓",
          duration: 3000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
        toast.error("Failed to copy code", {
          style: {
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FEE2E2",
            padding: "12px 16px",
            maxWidth: "320px",
            margin: "0 auto",
            borderRadius: "6px",
            fontWeight: "500",
          },
          duration: 3000,
        });
      });
  };

  // Create the example subdomain display
  const exampleSubdomain = `example.${userEnsDomain}`;

  // Format the wallet address for display (if full address is provided)
  const formatWalletAddress = (address) => {
    if (address && address.length > 10 && !address.includes("...")) {
      const start = address.substring(0, 6);
      const end = address.substring(address.length - 4);
      return `${start}...${end}`;
    }
    return address;
  };

  const displayAddress = formatWalletAddress(walletAddress);

  return (
    <div className="relative flex justify-center w-full min-h-screen px-8 pt-8 overflow-hidden text-left bg-white">
      <div className="flex flex-col w-full max-w-2xl py-16 lg:px-8">
        {/* Success Message */}
        <div className="flex items-center p-4 mb-8 rounded-md bg-green-50">
          <Image src={CheckmarkIcon} alt="Checkmark" className="w-5 h-5 mr-3" />
          <span className="text-base font-medium">API Key Sent</span>
          <span className="ml-2 text-gray-600">Check your inbox.</span>
        </div>

        <div className="hidden lg:block">
          {/* Create Subdomain Section */}
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Create your first subname
          </h1>

          {/* Step 1 */}
          <div className="flex mb-4">
            <div className="flex items-center justify-center w-6 h-6 mr-3 text-sm font-medium text-gray-500 bg-gray-200 rounded-full">
              1
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">
                Run the curl example and add your API key.
              </span>
              <a
                href="https://namestone.com/docs"
                className="ml-2 text-orange-500 hover:underline"
              >
                View all docs
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex mb-6">
            <div className="flex items-center justify-center w-6 h-6 mr-3 text-sm font-medium text-gray-500 bg-gray-200 rounded-full">
              2
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">View {exampleSubdomain} at</span>
              <a
                href="https://app.ens.domains"
                className="ml-2 text-orange-500 hover:underline"
              >
                app.ens.domains
              </a>
            </div>
          </div>

          {/* Code Example */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-md">
              <span className="text-sm font-medium text-white">Set-name</span>
              <button
                onClick={() => handleCopyCode(network)}
                className="flex items-center px-2 py-1 text-sm text-gray-300 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-white bg-gray-800 rounded-b-md">
              <code>{`curl -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: YOUR_API_KEY' \\
  -d '{
        "domain": "${userEnsDomain}",
        "name": "example",
        "address": "0x534631Bcf33BD0b69fB20A93d2fdb9e4D4dD42CF",
        "text_records": {
          "avatar": "https://ens.domains/assets/ens_logo_text_dark.svg"
        }
      }' \\
https://namestone.com/api/${
                network === Network.MAINNET ? "public_v1" : "public_v1_sepolia"
              }/set-name`}</code>
            </pre>
          </div>
        </div>

        {/* Create Subname Via - Only visible on small screens */}
        <div className="block lg:hidden">
          <p className="mb-2 text-base font-bold text-black">
            Create a subname via
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <div className="hidden lg:block">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Quick Links
            </h3>
          </div>
          <div className="p-4 bg-[#F5F5F5] rounded-md mb-6">
            <a
              href="https://namestone.com/admin"
              className="flex items-center justify-between mb-4 text-orange-500 hover:underline"
            >
              <span>Admin Panel Login</span>
              <Image
                src={ArrowTopRightOnSquareIcon}
                alt="External link"
                className="w-5 h-5"
              />
            </a>
            <p className="mb-2 text-sm text-gray-600">
              Add subnames without code.
            </p>
            <p className="text-sm text-gray-600">
              Connect the wallet{" "}
              <span className="font-mono">{displayAddress}</span> to get
              started.
            </p>
          </div>

          {/* View Docs Card - Only visible on large screens */}
          <div className="p-4 bg-[#F5F5F5] rounded-md mb-6">
            <div className="p-4 bg-[#F5F5F5] rounded-md mb-6">
              <a
                href="https://namestone.com/docs"
                className="flex items-center justify-between text-orange-500 hover:underline"
              >
                <div>
                  <span>View Docs</span>
                  <p className="text-gray-700">
                    View all documentation on how to use NameStone API.
                  </p>
                </div>
                <Image
                  src={ArrowTopRightOnSquareIcon}
                  alt="External link"
                  className="w-6 h-6"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySentDocs;
