import React from "react";

import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { createWalletClient, custom, createPublicClient, http } from "viem";
import { mainnet } from "wagmi";
import XIcon from "../public/images/x-icon-red.png";
import SuccessIcon from "../public/images/success-icon.png";
import searchIcon from "../public/images/search-icon.svg";
import bgGraphic from "../public/images/bg-trynamestone.svg";
import Image from "next/image";
import CustomConnectButton from "../components/CustomConnectButton";
import Link from "next/link";
import namestoneIcon from "../public/images/namestone-icon.svg";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { addEnsContracts, ensSubgraphActions } from "@ensdomains/ensjs";
import { setResolver } from "@ensdomains/ensjs/wallet";

export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID

const client = createPublicClient({
  transport: http(providerUrl || ""),
});
const HYBRID_RESOLVER = "0xA87361C4E58B619c390f469B9E6F27d759715125";
const NAMEWRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";

export default function TryNamestone() {
  const { status: authStatus } = useSession();
  const { data: walletClient } = useWalletClient();
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [disableSend, setDisableSend] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiPending, setApiPending] = useState(false);
  const [domainList, setDomainList] = useState([]);
  const [filteredDomainList, setFilteredDomainList] = useState([]);
  const [domainInputSelected, setDomainInputSelected] = useState(false);
  const [savedDomainInfo, setSavedDomainInfo] = useState(null);
  const [resolverButtonText, setResolverButtonText] = useState("Update");
  const [changeResolver, setChangeResolver] = useState(0);
  // fullyConnected means authenticated and connected
  const fullyConnected = isConnected && authStatus === "authenticated";

  const selectedDomain =
    filteredDomainList.length === 1 &&
    domainInput.toLowerCase() === filteredDomainList[0].name.toLowerCase()
      ? filteredDomainList[0]
      : null;
  const validResolver = selectedDomain?.validResolver;

  useEffect(() => {
    if (
      nameInput.length === 0 ||
      emailInput.length === 0 ||
      domainInput.length === 0 ||
      !address
    ) {
      setDisableSend(true);
      setErrorMsg("All fields are required");
    } else if (!validResolver) {
      setDisableSend(true);
      setErrorMsg("Resolver is not set correctly");
      return;
    } else {
      setDisableSend(false);
      setErrorMsg("");
    }
  }, [nameInput, emailInput, domainInput, address, validResolver]);

  // fetch to get domains after connect
  useEffect(() => {
    if (fullyConnected) {
      fetch("/api/try/get-domains").then((res) =>
        res.json().then((data) => {
          console.log(data);
          if (res.status === 200) {
            setDomainList(data);
            setFilteredDomainList(data);
          } else {
            setDomainList([]);
            console.log(data);
          }
        })
      );
    }
  }, [fullyConnected, changeResolver]);

  //useEffect to filter domain list
  useEffect(() => {
    setFilteredDomainList(
      domainList.filter((domain) =>
        domain?.name.toLowerCase().includes(domainInput.toLowerCase())
      )
    );
  }, [domainInput, domainList, changeResolver]);

  const handleClick = () => {
    setErrorMsg("");
    setDisableSend(true);
    setApiPending(true);
    fetch("/api/send-try-namestone-email", {
      method: "POST",
      body: JSON.stringify({
        name: nameInput,
        email: emailInput,
        wallet: address,
        domain: domainInput,
        saved_domain_info: savedDomainInfo,
      }),
    })
      .then((res) => {
        res.json().then((data) => {
          if (res.status === 200) {
            router.push("/on-the-way?address=" + data.address);
          } else {
            setDisableSend(false);
            setErrorMsg(data.error);
            console.log(data);
          }
          setApiPending(false);
        });
      })
      .catch((err) => {
        setDisableSend(false);
        setErrorMsg(
          "Something went wrong. Please refresh and try again or email alex at alex@namestone.xyz"
        );
        console.log(err);
        setApiPending(false);
      });
  };

  async function updateResolver() {
    if (fullyConnected) {
      if (!walletClient) {
        toast.error("Wallet not connected");
        return;
      }
      if (selectedDomain?.resolver !== HYBRID_RESOLVER) {
        const wallet = createWalletClient({
          chain: addEnsContracts(mainnet),
          transport: custom(walletClient.transport),
        });

        try {
          setResolverButtonText("Waiting for approval...");
          //TODO: get text records from domain
          // const domainInfo = await getOnchainDomainInfo(domain);
          // setSavedDomainInfo(domainInfo);
          const hash = await setResolver(wallet, {
            name: selectedDomain?.name,
            contract:
              selectedDomain?.owner === NAMEWRAPPER
                ? "nameWrapper"
                : "registry",
            resolverAddress: HYBRID_RESOLVER,
            account: address,
          });
          setResolverButtonText("Pending");
          try {
            const transaction = await client.waitForTransactionReceipt({
              hash,
            });
            setResolverButtonText("Success");
            setChangeResolver((changeResolver) => {
              changeResolver + 1;
            });
          } catch (e) {
            console.log(e);
            setResolverButtonText("Failed to update");
            setTimeout(() => {
              setResolverButtonText("Update");
            }, 1500);
          }
        } catch (e) {
          console.log(e);
          setResolverButtonText("Failed");
          setTimeout(() => {
            setResolverButtonText("Update");
          }, 1500);
        }
      }
    }
  }

  return (
    <div className="flex justify-center bg-neutral-50">
      <div className="w-full overflow-hidden flex flex-col max-w-[1536px]">
        <Head>
          <title>Try for Free | Namestone</title>
          <meta
            name="description"
            content="Try NameStone for free. Sign up to get a free API key to issue gasless subdomains on any ENS domain. "
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Nav Bar */}
        <div className="fixed z-40 flex flex-col w-full ">
          <div className="flex w-full bg-gradient-to-r  h-[8px] from-[#FF8B36] to-[#FF4429]"></div>
          <div className="flex justify-between w-full px-8 py-4 lg:px-32 backdrop-blur-sm">
            <div className="flex items-center text-2xl font-bold">
              <Link href="/" className="flex">
                <Image
                  className="h-[30px] mr-1  my-auto"
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
        {/* Form Section */}
        <div className="relative flex justify-center w-full min-h-screen px-8 mt-16 overflow-hidden text-center bg-white lg:px-32">
          <div className="flex justify-center w-full lg:justify-between lg:mt-[140px] ">
            {/* Background Image */}
            <Image
              src={bgGraphic}
              alt="Background Graphic"
              className="absolute -z-6   h-[100%] right-20"
            />
            {/* side text */}
            <div className="flex-1 hidden lg:flex">
              <SideText />
            </div>

            {/* Main content */}

            <div className="z-10 flex flex-col items-center justify-start flex-1 ">
              {!fullyConnected && (
                <>
                  <div className="flex flex-col items-center justify-center px-20 mt-20 bg-white border rounded-lg shadow-lg border-neutral-200 h-60">
                    <CustomConnectButton />
                    <div className="mt-4 text-sm text-center text-neutral-700">
                      Connect your wallet to get started.
                    </div>
                  </div>
                  <div className="flex justify-center w-full mt-10 mb-10 lg:hidden first-letter:items-center">
                    <SideText />
                  </div>
                </>
              )}
              {fullyConnected && (
                <>
                  <div className="flex flex-col items-start w-full max-w-md lg:hidden ">
                    <span className="mt-8 font-bold text-md text-brownblack-700">
                      Get a free API Key
                    </span>
                    <div className="mb-6 text-sm text-center text-neutral-700">
                      API key will be sent to your inbox.
                    </div>
                  </div>
                  <WhiteInput
                    labelText="Your Name"
                    placeholderText="e.g. Alex Slobodnik"
                    onChange={(e) => setNameInput(e.target.value)}
                    value={nameInput}
                    className={`bg-white`}
                  />
                  <WhiteInput
                    labelText="Email"
                    placeholderText="e.g. youremail@email.com"
                    onChange={(e) => setEmailInput(e.target.value)}
                    value={emailInput}
                  />
                  {/* Select Domain + Resolver Box */}
                  <div className="w-full max-w-md px-4 pt-4 bg-white border rounded-lg shadow-lg ">
                    <div className="flex ">
                      <div className="flex flex-col items-start w-full max-w-md mb-6">
                        <label
                          htmlFor="name-input"
                          className="mb-1 text-sm font-bold text-neutral-900"
                        >
                          Select Domain
                        </label>
                        <div className="relative w-full h-12">
                          <div className="absolute flex-col w-full h-12">
                            <div className="relative flex flex-1">
                              <input
                                type="text"
                                id="select domain"
                                placeholder=" slobo.eth"
                                onChange={(e) => setDomainInput(e.target.value)}
                                value={domainInput}
                                onFocus={() => {
                                  setDomainInputSelected(true);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setDomainInputSelected(false);
                                  }, 200);
                                }}
                                className="w-full h-10 p-4 border-neutral-300 border rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
                              />
                              <Image
                                src={searchIcon}
                                alt="search icon"
                                width={24}
                                height={24}
                                className="absolute transform -translate-y-1/2 right-2 top-1/2"
                              />
                            </div>
                            {/* Dropdown with domain list */}
                            {domainInputSelected && (
                              <div className="z-10 w-full max-w-md overflow-x-hidden overflow-y-scroll bg-white border rounded-lg shadow-lg max-h-40">
                                {filteredDomainList.map((domain, index) => (
                                  <div
                                    key={index}
                                    onClick={() => setDomainInput(domain.name)}
                                    className="h-10 px-4 py-2 text-left border-b cursor-pointer border-neutral-300 hover:bg-neutral-100 overflow-ellipsis"
                                  >
                                    {domain.name}
                                  </div>
                                ))}
                                {filteredDomainList.length === 0 && (
                                  <div className="h-10 px-4 py-2 text-left text-gray-400 border-b border-neutral-300">
                                    No domains found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between w-full h-fit ">
                      <label
                        htmlFor="name-input"
                        className="mb-2 text-sm font-bold text-neutral-900"
                      >
                        Update Resolver
                      </label>
                      {!validResolver && (
                        <Image
                          src={XIcon}
                          alt="X"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      )}
                      {validResolver && (
                        <Image
                          src={SuccessIcon}
                          alt="success"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      )}
                    </div>
                    <div className="flex justify-start w-full px-4 py-2 text-xs border border-solid rounded-lg border-brownblack-200">
                      {selectedDomain
                        ? selectedDomain.resolver
                        : "Waiting for domain"}
                    </div>
                    <div className="flex w-full my-4">
                      <button
                        onClick={updateResolver}
                        disabled={validResolver || selectedDomain === null}
                        className="px-6 py-2 font-bold rounded-lg bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400 disabled:bg-brownblack-300/[0.50]"
                      >
                        {resolverButtonText}
                      </button>
                    </div>
                  </div>
                  {errorMsg && (
                    <div className="h-6 mt-2 text-xs font-bold text-red-400">
                      {errorMsg}
                    </div>
                  )}
                  <Button
                    buttonText="Get a key"
                    onClick={handleClick}
                    disabled={disableSend}
                    className="mt-4 mb-24"
                    pending={apiPending}
                  />{" "}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
function WhiteInput({ labelText, placeholderText, value, onChange }) {
  return (
    <div className="flex flex-col items-start w-full max-w-md mb-6">
      <label
        htmlFor="name-input"
        className="mb-1 text-sm font-bold text-neutral-900"
      >
        {labelText}
      </label>
      <input
        type="text"
        id={labelText.toLowerCase()}
        placeholder={placeholderText}
        value={value}
        onChange={onChange}
        className="w-full h-12 p-4 border-neutral-300 border rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
      />
    </div>
  );
}

{
  /* SideText Component */
}
const SideText = () => (
  <div className="flex flex-col items-start w-full max-w-md">
    <h1 className="font-bold text-md text-brownblack-700">
      Get a free API Key
    </h1>
    <div className="mt-6 mb-6 text-sm font-bold text-neutral-700">
      How it works
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-neutral-200">1</div>
        <div>Connect your wallet to list names you own</div>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-neutral-200">2</div>
        <div>Select a name and fill out your information</div>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-neutral-200">3</div>
        <div>Update the name’s resolver</div>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-full bg-neutral-200">4</div>
        <div>Done. API key will be emailed to you</div>
      </div>
    </div>
  </div>
);
