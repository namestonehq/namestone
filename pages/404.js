import Head from "next/head";
import Button from "../components/Button";
import { useRouter } from "next/router";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";

export default function Home() {
  const router = useRouter();
  const handleClick = () => {
    router.push("/");
  };

  return (
    <div>
      <Head>
        <title>Error 404</title>
        <meta name="description" content="Learn more about NameStone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Nav Bar */}
      <div className="fixed z-40 flex justify-between w-full px-8 py-4 backdrop-blur-sm md:px-20">
        <div className="flex items-center">
          <NameStoneLogo />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col items-center justify-center w-full min-h-screen px-8 overflow-hidden text-center bg-gradient-to-b from-orange-200 to-red-200 ">
        <span className="text-[32px] font-bold text-brownblack-700">
          Sorry, the page could not be found.
        </span>
        <span className="max-w-md mt-3 mb-10 font-bold text-center text-s text-brownblack-500">
          Error Code: 404
        </span>
        <Button buttonText="Home" onClick={handleClick} />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
