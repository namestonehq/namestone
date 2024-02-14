import Head from "next/head";
import Image from "next/image";
import Button from "../components/Button";
import confirmationCheckIcon from "../public/images/confirmation_check-icon.png";
import { useRouter } from "next/router";
import NameStoneLogo from "../components/NameStoneLogo";
import Footer from "../components/Footer";

export default function Home() {
  const router = useRouter();
  const handleClick = () => {
    router.push("/");
  };

  return (
    <div>
      <Head>
        <title>Thank You</title>
        <meta name="description" content="Learn more about NameStone" />
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
        <div className="flex flex-col items-center w-screen">
          <Image
            className="h-[60px] w-[60px] mb-6"
            priority
            src={confirmationCheckIcon}
            alt="Forging Commmunity Identity"
          />
          <span className="text-[30px] font-bold text-brownblack-700">
            Thank You
          </span>
          <span className="max-w-md mt-3 mb-8 font-bold text-center text-s text-brownblack-500">
            Thank you for reaching out to NameStone. <br></br> We will be in
            touch with you soon!
          </span>
          <Button buttonText="Home" onClick={handleClick} />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
function WhiteInput({ labelText, placeholderText }) {
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
        className="w-full h-12 p-4 rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
      />
    </div>
  );
}
