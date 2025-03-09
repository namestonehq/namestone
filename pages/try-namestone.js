import React from "react";

import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { createWalletClient, custom, createPublicClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import XIcon from "../public/images/x-icon-red.png";
import SuccessIcon from "../public/images/success-icon.png";
import searchIcon from "../public/images/search-icon.svg";
import bgGraphic from "../public/images/bg-trynamestone.svg";
import Image from "next/image";
import CustomConnectButton from "../components/CustomConnectButton";
import Link from "next/link";
import namestoneIcon from "../public/images/namestone-icon.svg";
import { useSession } from "next-auth/react";
import { useAccount, useSwitchChain } from "wagmi";
import { updateResolver } from "../utils/FrontUtils";
import sideMenuSvg from "../public/images/try-for-free-side-menu.svg";
import keyIcon from "../public/images/try-for-free-key-icon.svg";
import scriptIcon from "../public/images/try-for-free-script-icon-non-filled.svg";
import scriptIconFilled from "../public/images/try-for-free-script-icon-filled.svg";

export const providerUrl =
  "https://eth-mainnet.g.alchemy.com/v2/" +
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // replace with your actual project ID
export const sepoliaProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

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
  console.log(`[mendeleden-debug] fullyConnected: ${fullyConnected} --> is connected: ${isConnected} and auth status: ${authStatus}`);
  const [network, setNetwork] = useState("Mainnet");
  const { switchChain } = useSwitchChain();

  const selectedDomain =
    filteredDomainList.length === 1 &&
    domainInput.toLowerCase() === filteredDomainList[0].name.toLowerCase()
      ? filteredDomainList[0]
      : null;
  const validResolver = selectedDomain?.validResolver;
  const resolverStatus = selectedDomain?.resolverStatus || "invalid";

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
      fetch("/api/try/get-domains?network=" + network).then((res) =>
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
  }, [fullyConnected, changeResolver, network]);

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
        network: network.toLowerCase(),
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
          "Something went wrong. Please refresh and try again or email alex at alex@namestone.com"
        );
        console.log(err);
        setApiPending(false);
      });
  };

  async function handleUpdateResolver() {
    if (fullyConnected) {
      await updateResolver({
        walletClient,
        selectedDomain,
        network,
        address,
        setResolverButtonText,
        setChangeResolver,
        switchChain,
      });
    }
  }

  const getResolverStatusIcon = () => {
    if (!selectedDomain) return null;

    switch (resolverStatus) {
      case "latest":
        return (
          <Image
            src={SuccessIcon}
            alt="success"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        );
      case "old":
        return (
          <div
            className="flex items-center justify-center w-5 h-5"
            title="Using an older compatible resolver. We recommend updating to the latest version."
          >
            <Image
              src={SuccessIcon}
              alt="success"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        );
      case "invalid":
      default:
        return (
          <Image
            src={XIcon}
            alt="X"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        );
    }
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
          <div className="flex w-full bg-gradient-to-r h-[8px] from-[#FF8B36] to-[#FF4429]"></div>
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
        <div className="flex w-full mt-[60px]">
          {/* Side Panel - Desktop Only */}
          <div className="hidden lg:block w-[494px] fixed left-1/2 transform -translate-x-[768px] h-[calc(100vh-60px)] z-10">
            <div className="relative w-full h-full">
              <Image 
                src={sideMenuSvg} 
                alt="Side Menu" 
                className="absolute top-0 left-0 w-full h-full object-cover"
                priority
              />
              <div className="relative z-10 flex flex-col items-start p-12 pt-16 text-left">
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-6">Get Started</h2>
                  
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 relative">
                    {/* Connecting line that spans from first icon to second icon */}
                    <div className="absolute left-[26px] top-[45px] w-[2px] h-[48px] bg-neutral-300 z-0"></div>
                    
                    {/* First Row - Key Icon and Text */}
                    <div className="flex justify-center items-start">
                      <Image
                        src={keyIcon}
                        alt="Key Icon"
                        width={52}
                        height={52}
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Get a key</h3>
                      <p className="text-sm text-neutral-600">Configure domain and receive a key</p>
                    </div>
                    
                    {/* Second Row - Empty space for the line */}
                    <div className="h-[30px]"></div>
                    <div></div> {/* Empty cell */}
                    
                    {/* Third Row - Script Icon and Text */}
                    <div className="flex justify-center items-start">
                      <div className="transition-all duration-300 ease-in-out">
                        <Image
                          src={scriptIconFilled}
                          // src={!disableSend ? scriptIconFilled : scriptIcon}
                          alt="Script Icon"
                          width={52}
                          height={52}
                        />
                      </div>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Create a subname</h3>
                      <p className="text-sm text-neutral-600">Use your key to make a subname</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="relative flex justify-center w-full min-h-screen px-8 overflow-hidden text-center bg-white lg:ml-[494px]">
            <div className="flex justify-center flex-col w-full lg:justify-between lg:mt-[80px] lg:px-32">
              {/* Background Image */}
              <Image
                src={bgGraphic}
                alt="Background Graphic"
                className="absolute -z-6 h-[100%] right-20"
              />
              
              {/* Main content */}
              <div className="z-10 flex flex-col items-center justify-start flex-1">
                {/* Form Header - Mobile Only */}
                <div className="flex flex-col items-center w-full max-w-md lg:hidden">
                  <span className="mt-8 font-bold text-xl text-brownblack-700">
                    Get a free API Key
                  </span>
                  <div className="mb-6 text-xs text-center text-neutral-600">
                    Connect wallet to view domains you own.
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
                <div className="w-full max-w-md">
                  <div className="flex ">
                    <div className="flex flex-col items-start w-full max-w-md mb-6">
                      <div className="flex items-baseline justify-between w-full">
                        <label
                          htmlFor="name-input"
                          className="mb-1 text-sm font-bold text-neutral-900"
                        >
                          Select Domain
                        </label>
                        {/* Toggle Network */}
                        <div className="flex p-1 mt-2 mb-4 text-sm rounded-lg bg-neutral-200">
                          <button
                            onClick={() => {
                              setNetwork("Mainnet");
                              setDomainInput("");
                            }}
                            className={`px-4  rounded-lg transition ${
                              network === "Mainnet"
                                ? "bg-white shadow text-stone-900  py-1"
                                : "bg-neutral-200"
                            }`}
                          >
                            Mainnet
                          </button>
                          <button
                            onClick={() => {
                              setNetwork("Sepolia");
                              setDomainInput("");
                            }}
                            className={`px-4 rounded-lg transition ${
                              network === "Sepolia"
                                ? "bg-white shadow text-black py-1"
                                : "bg-neutral-200"
                            }`}
                          >
                            Sepolia
                          </button>
                        </div>
                      </div>

                      <div className="relative w-full h-12">
                        <div className="absolute flex-col w-full h-12">
                          <div className="relative flex flex-1">
                            <input
                              type="text"
                              id="select domain"
                              placeholder={
                                fullyConnected
                                  ? " slobo.eth"
                                  : " Connect Wallet to see domains"
                              }
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
                              disabled={!fullyConnected}
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
                              {fullyConnected && (
                                <>
                                  {filteredDomainList.map((domain, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setDomainInput(domain.name);
                                        console.log(domain);
                                      }}
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
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-md mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor="name-input"
                            className="block text-sm font-bold text-neutral-900"
                          >
                            Update Resolver
                          </label>
                        </div>
                        <p className="text-xs text-neutral-600">
                          Updates to NameStone&apos;s <a href="#" className="underline">verified resolver</a>
                        </p>
                      </div>
                      <button
                        onClick={handleUpdateResolver}
                        disabled={
                          resolverStatus === "latest" || selectedDomain === null
                        }
                        className={`px-6 py-2 font-bold rounded-lg ${
                          resolverStatus === "latest" || selectedDomain === null
                            ? "bg-white text-neutral-400 border border-neutral-200"
                            : "bg-neutral-200 hover:bg-neutral-300 active:bg-neutral-400"
                        }`}
                      >
                        {resolverButtonText}
                      </button>
                    </div>
                    <div className={`flex justify-between items-center w-full px-4 py-2 mt-2 text-xs rounded-lg ${
                      selectedDomain 
                        ? "border border-solid border-brownblack-200" 
                        : "bg-neutral-100"
                    }`}>
                      <div>
                        {selectedDomain
                          ? selectedDomain.resolver
                          : "Waiting for domain..."}
                      </div>
                      {getResolverStatusIcon()}
                    </div>
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
              </div>
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
