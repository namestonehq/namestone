import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";
import { useState, useEffect } from "react";
import { useEnsResolver } from "wagmi";
import { createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import XIcon from "../public/images/x-icon-red.png";
import SuccessIcon from "../public/images/success-icon.png";
import checkIcon from "../public/images/icon-orange-check.svg";
import searchIcon from "../public/images/search-icon.svg";
import bgGraphic from "../public/images/bg-trynamestone.svg";
import Image from "next/image";
import CustomConnectButton from "../components/CustomConnectButton";
import Link from "next/link";
import namestoneIcon from "../public/images/namestone-icon.svg";

export default function Home() {
  const router = useRouter();
  const [disableSend, setDisableSend] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [walletInput, setWalletInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [rerenderToggle, setRerenderToggle] = useState(false);
  const [apiPending, setApiPending] = useState(false);

  // refresh resolver every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRerenderToggle((rerenderToggle) => !rerenderToggle); // call api after 5 seconds
    }, 5000);
    return () => clearInterval(interval); // clear interval after component unmounts.
  }, [rerenderToggle]);

  const { publicClient, webSocketPublicClient } = configureChains(
    [mainnet],
    [publicProvider()]
  );

  const config = createConfig({
    publicClient,
    webSocketPublicClient,
  });
  const { data: resolverData } = useEnsResolver({
    name: domainInput,
    config,
  });

  const validResolver =
    resolverData &&
    (resolverData.toString() === "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65" ||
      resolverData.toString() ===
        "0x828ec5bDe537B8673AF98D77bCB275ae1CA26D1f" ||
      resolverData.toString() ===
        "0x84c5AdB77dd9f362A1a3480009992d8d47325dc3" ||
      resolverData.toString() === "0xd17347fA0a6eeC89a226c96a9ae354F785e94241");

  // reenable send button on input changes
  useEffect(() => {
    if (
      nameInput.length === 0 ||
      emailInput.length === 0 ||
      domainInput.length === 0 ||
      walletInput.length === 0
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
  }, [nameInput, emailInput, domainInput, walletInput, validResolver]);

  const handleClick = () => {
    setErrorMsg("");
    setDisableSend(true);
    setApiPending(true);
    fetch("/api/send-try-namestone-email", {
      method: "POST",
      body: JSON.stringify({
        name: nameInput,
        email: emailInput,
        wallet: walletInput,
        domain: domainInput,
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

  return (
    <div className="flex justify-center bg-neutral-50 ">
      {/* Background Image */}
      <Image
        src={bgGraphic}
        alt="Background Graphic"
        fill
        className="-z-6 object-right"
      />
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
        <div className="flex justify-center w-full min-h-screen px-8 overflow-hidden text-center bg-white lg:px-32 mt-16">
          <div className="flex justify-center w-full lg:justify-between lg:mt-[140px] ">
            {/* side text */}
            <div className="flex-1 hidden lg:flex">
              <div className="flex flex-col items-start w-full max-w-md ">
                <h1 className="font-bold text-md text-brownblack-700">
                  Get a free API Key
                </h1>
                <div className="mb-6 text-sm ftext-center text-neutral-700 font-bold mt-6">
                  How it works
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="bg-neutral-200 rounded-full w-6 h-6">1</div>
                    <div>Connect your wallet to list names you own</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-neutral-200 rounded-full w-6 h-6">2</div>
                    <div>Update the name’s resolver </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-neutral-200 rounded-full w-6 h-6">3</div>
                    <div>Prove ownership of name via signing</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-neutral-200 rounded-full w-6 h-6">4</div>
                    <div>Done. API key will be emailed to you</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center justify-start z-10 flex-1 ">
              <div className="flex flex-col items-start w-full max-w-md lg:hidden ">
                <span className="mt-8 font-bold text-md text-brownblack-700">
                  Get a free API Key
                </span>
                <div className="mb-6 text-sm ftext-center text-neutral-700">
                  API key will be sent to your inbox.
                </div>
              </div>

              <WhiteInput
                labelText="Your Name"
                placeholderText="e.g. Alex Slobodnik"
                onChange={(e) => setNameInput(e.target.value)}
                value={nameInput}
              />
              <WhiteInput
                labelText="Email"
                placeholderText="e.g. youremail@email.com"
                onChange={(e) => setEmailInput(e.target.value)}
                value={emailInput}
              />
              {/* Select Domain Box */}
              <div className="border rounded-lg bg-white shadow-lg w-full max-w-md pt-4 px-4 ">
                <div className="flex relative ">
                  <WhiteInput
                    labelText="Select Domain"
                    placeholderText="slobo.eth"
                    className="pr-10" // Adding padding to the right for the icon space
                    // onChange={}
                    // value={}
                  />
                  <Image
                    src={searchIcon}
                    alt="search icon"
                    width={24}
                    height={24}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  />
                </div>

                <div className="flex justify-between w-full h-fit ">
                  <label
                    htmlFor="name-input"
                    className="mb-2 text-sm font-bold text-neutral-900"
                  >
                    Update Resolver
                  </label>
                  {domainInput !== "" && !validResolver && (
                    <Image
                      src="/path-to/XIcon.svg"
                      alt="X"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  )}
                  {validResolver && (
                    <Image
                      src="/path-to/SuccessIcon.svg"
                      alt="success"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  )}
                </div>
                <div className="flex justify-start w-full p-4 border border-solid rounded-lg border-brownblack-200">
                  {resolverData ? resolverData : "Waiting for domain"}
                </div>
                <div className="w-full flex my-4">
                  <button
                    onClick={handleClick}
                    disabled={disableSend}
                    className="font-bold bg-neutral-200 px-6 py-2 rounded-lg"
                  >
                    Update
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
              />
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
