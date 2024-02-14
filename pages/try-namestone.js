import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";
import { useState, useEffect } from "react";
import { useEnsResolver } from "wagmi";
import XIcon from "../public/images/x-icon-red.png";
import SuccessIcon from "../public/images/success-icon.png";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [disableSend, setDisableSend] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [rerenderToggle, setRerenderToggle] = useState(false);

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
      projectInput.length === 0
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
  }, [nameInput, emailInput, domainInput, projectInput, validResolver]);

  const handleClick = () => {
    setErrorMsg("");
    setDisableSend(true);
    fetch("/api/send-try-namestone-email", {
      method: "POST",
      body: JSON.stringify({
        name: nameInput,
        email: emailInput,
        project: projectInput,
        domain: domainInput,
      }),
    }).then((res) => {
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
      });
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
      <div className="fixed z-40 flex justify-between w-full px-8 py-4 backdrop-blur-sm md:px-20">
        <div className="flex items-center">
          <NameStoneLogo />
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center w-full min-h-screen px-8 overflow-hidden text-center bg-gradient-to-b from-orange-200 to-red-200 ">
        <div className="flex flex-col items-center w-screen mt-16">
          <span className="font-bold text-md text-brownblack-700">
            Get an API Key
          </span>
          <div className="mb-4 text-sm font-bold text-center text-brownblack-500">
            Fill out the form below to get an API key emailed to you for your
            project.
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
            <div className="w-full h-12 p-4 border border-solid rounded-lg border-brownblack-200">
              {resolverData ? resolverData : "Waiting for domain"}
            </div>
            <div className="text-xs leading-6 text-left text-brownblack-500">
              *The resolver must be changed to the following:
              <br />
              <div className="my-2 font-mono bg-orange-300 rounded-md">
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
          <WhiteInput
            labelText="Project or Company"
            placeholderText="e.g. Wassies"
            onChange={(e) => setProjectInput(e.target.value)}
            value={projectInput}
          />

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
        className="w-full h-12 p-4 rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
      />
    </div>
  );
}
