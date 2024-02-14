import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [disableSend, setDisableSend] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [hearInput, setHearInput] = useState("");
  const [commentsInput, setCommentsInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = () => {
    setErrorMsg("");
    setDisableSend(true);
    if (nameInput.length === 0 || emailInput.length === 0) {
      setErrorMsg("Name and email cannot be blank");
      return;
    }
    fetch("/api/send-contact-email", {
      method: "POST",
      body: JSON.stringify({
        name: nameInput,
        email: emailInput,
        telegram: telegramInput,
        project: projectInput,
        hear: hearInput,
        comments: commentsInput,
      }),
    }).then((res) => {
      res.json().then((data) => {
        if (res.status === 200) {
          router.push("/thank-you");
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
        <title>Contact Us</title>
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
          <span className="mb-8 font-bold text-md text-brownblack-700 ">
            Contact Us
          </span>

          <WhiteInput
            labelText="Your Name"
            placeholderText="Alex Slobodnik"
            onChange={(e) => setNameInput(e.target.value)}
            value={nameInput}
          />
          <WhiteInput
            labelText="Email"
            placeholderText="youremail@email.com"
            onChange={(e) => setEmailInput(e.target.value)}
            value={emailInput}
          />
          <WhiteInput
            labelText="Telegram"
            placeholderText="@superslobo"
            onChange={(e) => setTelegramInput(e.target.value)}
            value={telegramInput}
          />
          <WhiteInput
            labelText="Project or Company"
            placeholderText="e.g. Wassies"
            onChange={(e) => setProjectInput(e.target.value)}
            value={projectInput}
          />
          <WhiteInput
            labelText="How did you hear about us?"
            placeholderText="Twitter, Google, Referral "
            onChange={(e) => setHearInput(e.target.value)}
            value={hearInput}
          />
          <WhiteInput
            labelText="Additional Comments"
            placeholderText="I'd love a demo "
            onChange={(e) => setCommentsInput(e.target.value)}
            value={commentsInput}
          />
          {errorMsg && (
            <div className="h-6 mt-2 text-xs font-bold text-red-400">
              {errorMsg}
            </div>
          )}
          <Button
            buttonText="Submit"
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
