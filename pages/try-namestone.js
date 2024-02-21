import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";
import { useState, useEffect } from "react";
import { useEnsResolver } from "wagmi";
import XIcon from "../public/images/x-icon-red.png";
import SuccessIcon from "../public/images/success-icon.png";
import checkIcon from "../public/images/icon-orange-check.svg";
import Image from "next/image";

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

  console.log(domainInput);
  const { data: resolverData } = useEnsResolver({
    name: domainInput,
  });

  const validResolver =
    resolverData &&
    resolverData.toString() === "0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65";

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
            router.push("/on-the-way");
          } else {
            setDisableSend(false);
            setErrorMsg(
              "Something went wrong. Please refresh and try again or email alex at alex@namestone.xyz"
            );
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
    <div>
      <Head>
        <title>Try NameStone</title>
        <meta name="description" content="Contact Us" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Nav Bar */}
      <div className="fixed z-40 flex flex-col w-full ">
        <div className="flex w-full bg-gradient-to-r  h-[8px] from-[#FF8B36] to-[#FF4429]"></div>
        <div className="flex justify-between w-full px-8 py-4 lg:px-32 backdrop-blur-sm">
          <div className="flex items-center">
            <NameStoneLogo />
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center w-full min-h-screen px-8 overflow-hidden text-center bg-white lg:px-32 ">
        <div className="flex justify-center w-full mt-16 lg:justify-between lg:mt-[140px] ">
          {/* side text */}
          <div className="flex-1 hidden lg:flex">
            <div className="flex flex-col items-start w-full max-w-md ">
              <span className="font-bold text-md text-brownblack-700">
                Get a free API Key
              </span>
              <div className="mb-6 text-sm ftext-center text-neutral-700">
                API key will be sent to your inbox.
              </div>

              <div className="inline-flex flex-col items-start justify-start gap-7">
                <div className="inline-flex items-center justify-start gap-4 ">
                  <Image
                    src={checkIcon}
                    className="relative w-6 h-6"
                    alt="check icon"
                  />
                  <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                    Admin Panel
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-4 ">
                  <Image
                    src={checkIcon}
                    className="relative w-6 h-6"
                    alt="check icon"
                  />
                  <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                    Add, edit, and remove subnames
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-4">
                  <Image
                    src={checkIcon}
                    className="relative w-6 h-6"
                    alt="check icon"
                  />
                  <div className="text-base font-bold grow shrink basis-0 text-neutral-900 fleading-normal">
                    Gasless Edits
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col items-center justify-start flex-1 ">
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
              labelText="Wallet Address"
              placeholderText="0x1232...  or slobo.eth"
              onChange={(e) => setWalletInput(e.target.value)}
              value={walletInput}
            />
            <WhiteInput
              labelText="Email"
              placeholderText="e.g. youremail@email.com"
              onChange={(e) => setEmailInput(e.target.value)}
              value={emailInput}
            />
            <WhiteInput
              labelText="Domain Name"
              placeholderText="e.g. boredapes.eth"
              onChange={(e) => setDomainInput(e.target.value)}
              value={domainInput}
            />
            <div className="flex flex-col items-start w-full max-w-md mb-6">
              <div className="flex items-center justify-between w-full">
                <label
                  htmlFor="name-input"
                  className="mb-1 text-sm font-bold text-brownblack-500"
                >
                  Resolver
                </label>
                {domainInput !== "" && !validResolver && (
                  <Image src={XIcon} alt="X" className="w-5 h-5" />
                )}
                {validResolver && (
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={20}
                    className="w-5 h-5"
                  />
                )}
              </div>
              <div className="flex justify-start w-full p-4 border border-solid rounded-lg border-brownblack-200">
                {resolverData ? resolverData : "Waiting for domain"}
              </div>
              <div className="text-xs leading-6 text-left text-brownblack-500">
                *The resolver must be changed to the following:
                <br />
                <div className="px-3 my-2 font-mono rounded-md bg-neutral-200">
                  0x2291053F49Cd008306b92f84a61c6a1bC9B5CB65
                </div>{" "}
                To change the resolver: <br />
                1. Go to{" "}
                <a
                  href="https://app.ens.domains"
                  className="underline"
                  target="_blank"
                >
                  app.ens.domains
                </a>{" "}
                and connect wallet <br /> 2. Select your domain <br />
                3. Under the “More” tab, scroll to Resolver and select “Edit”{" "}
                <br />
                4. Copy and paste the NameStone resolver <br />
                5. Save and pay the gas fee <br />
                6. Resolver will update in box above <br />
                Find more information on resolvers{" "}
                <a
                  href="https://support.ens.domains/en/articles/7900622-the-resolver-record"
                  className="underline"
                  target="_blank"
                >
                  here
                </a>
                .
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
            />
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
function WhiteInput({ labelText, placeholderText, value, onChange }) {
  return (
    <div className="flex flex-col items-start w-full max-w-md mb-6">
      <label
        htmlFor="name-input"
        className="mb-1 text-sm font-bold text-brownblack-500"
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
