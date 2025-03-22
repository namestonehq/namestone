import React from "react";

import Head from "next/head";
import { useState } from "react";
import Image from "next/image";
import CustomConnectButton from "../components/CustomConnectButton";
import Link from "next/link";
import namestoneIcon from "../public/images/namestone-icon.svg";
import { SidePanel } from "../components/TryForFree/SidePanel";
import { TopPanel } from "../components/TryForFree/TopPanel";
import { StylishVerticalDivider } from "../components/TryForFree/StylishVerticalDivider";
import { ApiKeyForm } from "../components/TryForFree/ApiKeyForm";
import { ApiKeySentDocs } from "../components/TryForFree/ApiKeySentDocs";
import { FormState, Network } from "../components/TryForFree/formStates";
import { useWalletClient } from "wagmi";

export default function TryNamestone() {
  const { data: walletClient } = useWalletClient();
  const [formState, setFormState] = useState(FormState.FORM);
  const [userEnsDomain, setUserEnsDomain] = useState("");
  const [network, setNetwork] = useState(Network.MAINNET);

  const handleApiKeySentSuccessfully = (ensDomain) => {
    setFormState(FormState.API_KEY_SENT);
    setUserEnsDomain(ensDomain);
  };

  const handleNetworkChange = (network) => {
    if (network === "Sepolia") {
      setNetwork(Network.SEPOLIA);
    } else if (network === "Mainnet") {
      setNetwork(Network.MAINNET);
    }
  };

  return (
    <div className="flex justify-center bg-white">
      <div className="w-full flex flex-col max-w-[1536px] relative">
        <Head>
          <title>Try for Free | Namestone</title>
          <meta
            name="description"
            content="Try NameStone for free. Sign up to get a free API key to issue gasless subdomains on any ENS domain. "
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Nav Bar */}
        <div className="fixed z-40 flex flex-col w-full max-w-[1536px]">
          <div className="w-full backdrop-blur-sm">
            <div className="flex justify-between w-full px-8 py-4 lg:px-32">
              <div className="flex items-center text-2xl font-bold">
                <Link href="/" className="flex">
                  <Image
                    className="h-[30px] mr-1 my-auto"
                    priority
                    src={namestoneIcon}
                    alt="Forging Commmunity Identity"
                  />{" "}
                  <span className={`mr-1`}> NameStone </span>
                </Link>
              </div>
              <CustomConnectButton />
            </div>
          </div>
        </div>

        {/* Main Content Area - Below Navbar */}
        <div className="flex flex-col w-full mt-[60px]">
          {/* Mobile Top Panel */}
          <TopPanel formState={formState} />

          {/* Desktop Side Panel and Content */}
          <div className="flex flex-row w-full">
            <div className="hidden lg:block w-1/3 sticky top-[60px] h-[calc(100vh-60px)]">
              <SidePanel formState={formState} />
              <div className="absolute right-0 top-0 h-full">
                <StylishVerticalDivider />
              </div>
            </div>
            <div className="w-full lg:w-2/3">
              {formState === FormState.FORM && (
                <ApiKeyForm
                  handleApiKeySentSuccessfully={handleApiKeySentSuccessfully}
                  handleNetworkChange={handleNetworkChange}
                />
              )}
              {formState === FormState.API_KEY_SENT && (
                <ApiKeySentDocs
                  userEnsDomain={userEnsDomain}
                  walletAddress={walletClient?.account.address}
                  network={network}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
