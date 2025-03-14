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
import { FormState } from "../components/TryForFree/formStates";
import { useWalletClient } from "wagmi";

export default function TryNamestone() {
  const { data: walletClient } = useWalletClient();
  const [formState, setFormState] = useState(FormState.FORM);
  const [userEnsDomain, setUserEnsDomain] = useState("");

  const handleApiKeySentSuccessfully = (ensDomain) => {
    setFormState(FormState.API_KEY_SENT);
    setUserEnsDomain(ensDomain);
  };

  return (
    <div className="flex justify-center bg-neutral-50">
      <div className="w-full overflow-hidden flex flex-col max-w-[1536px] relative">
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
          <div className="flex w-full">
            <SidePanel formState={formState} />
            <StylishVerticalDivider />
            {formState === FormState.FORM && <ApiKeyForm handleApiKeySentSuccessfully={handleApiKeySentSuccessfully} />}
            {formState === FormState.API_KEY_SENT && <ApiKeySentDocs userEnsDomain={userEnsDomain} walletAddress={walletClient?.account.address} />}
          </div>
        </div>
      </div>
    </div>
  );
}

