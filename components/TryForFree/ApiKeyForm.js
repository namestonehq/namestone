import React from "react";
import Image from "next/image";
import { WhiteInput } from "./WhiteInput";
import bgGraphic from "../../public/images/bg-trynamestone.svg";
import searchIcon from "../../public/images/search-icon.svg";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import XIcon from "../../public/images/x-icon-red.png";
import SuccessIcon from "../../public/images/success-icon.png";
import { useSession } from "next-auth/react";
import { useAccount, useSwitchChain } from "wagmi";
import { updateResolver } from "../../utils/FrontUtils";
import { FormState } from "./formStates";

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * ApiKeyForm component that displays the form to get an API key on the Try for Free page.
 * @param {Object} props Component props
 * @param {Function} props.handleApiKeySentSuccessfully Function to handle when API key is sent successfully
 * @returns {JSX.Element} The ApiKeyForm component
 */
export const ApiKeyForm = ({ handleApiKeySentSuccessfully }) => {
  const { status: authStatus } = useSession();
  const { data: walletClient } = useWalletClient();
  const { isConnected, address } = useAccount();
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
    // Reset error message
    setErrorMsg("");

    // Validate name
    if (!nameInput.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }

    // Validate email
    if (!emailInput.trim()) {
      setErrorMsg("Please enter your email");
      return;
    }

    if (!validateEmail(emailInput)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    // Proceed with form submission
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
            // router.push("/on-the-way?address=" + data.address);
            handleApiKeySentSuccessfully(domainInput);
          } else {
            setDisableSend(false);
            setErrorMsg(data.error || "An error occurred. Please try again.");
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
    <div className="relative flex justify-center w-full min-h-screen px-8 pt-8 overflow-hidden text-center bg-white">
      <div className="flex justify-center flex-col w-full lg:justify-between lg:mt-[80px] lg:px-16">

        {/* Main content */}
        <div className="z-10 flex flex-col items-center justify-start flex-1">
          {/* Form Header - Mobile Only */}
          <div className="hidden lg:flex lg:flex-col items-center w-full max-w-md">
            <span className="mt-8 font-bold text-xl text-brownblack-700">
              Get a free API Key
            </span>
            <div className="mb-6 text-xs text-center text-neutral-600">
              Connect wallet to view domains you own.
            </div>
          </div>
          <div className="lg:hidden h-4"></div>
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
              <p className="text-xs text-neutral-600 text-left">
                Updates to NameStone&apos;s{" "}
                <a href="https://etherscan.io/address/0xA87361C4E58B619c390f469B9E6F27d759715125" className="underline" target="_blank" rel="noopener noreferrer">
                  verified resolver
                </a>
              </p>
              <div
                className={`flex justify-between items-center w-full px-4 py-2 mt-2 text-xs rounded-lg ${
                  selectedDomain
                    ? "border border-solid border-brownblack-200"
                    : "bg-neutral-100"
                }`}
              >
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
  );
};
