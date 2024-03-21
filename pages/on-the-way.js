import Head from "next/head";
import Image from "next/image";
import Button from "../components/Button";
import confirmationCheckIcon from "../public/images/confirmation_check-icon.png";
import { useRouter } from "next/router";
import NameStoneLogo from "../components/NameStoneLogo";
import Footer from "../components/Footer";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { query } = router;
  const address = query.address || "missing address";

  const homeClick = () => {
    router.push("/");
  };
  const adminClick = () => {
    router.push("/admin");
  };

  function shortAddress(address) {
    if (address.startsWith("0x")) {
      return (
        address.substring(0, 6) + "..." + address.substring(address.length - 4)
      );
    } else {
      return address;
    }
  }

  return (
    <div className="flex flex-col w-full h-[100vh]">
      <Head>
        <title>API Key is on the way</title>
        <meta name="description" content="Learn more about NameStone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Nav Bar */}
      <div className="fixed z-40 flex flex-col w-full">
        <div className="flex w-full bg-gradient-to-r  h-[8px] from-[#FF8B36] to-[#FF4429]"></div>
        <div className="flex justify-between w-full px-8 py-4 lg:px-32 backdrop-blur-sm">
          <div className="flex items-center">
            <NameStoneLogo />
          </div>
        </div>
      </div>

      <div className="inline-flex flex-col items-start justify-start flex-1 px-8 py-36 gap-14 lg:px-32">
        <div className="flex flex-col items-start justify-start gap-5 ">
          <div className="flex flex-col items-start justify-center gap-3 ">
            <div className="text-neutral-900 text-[32px] font-bold ">
              API Key Sent
            </div>
            <div className="text-sm font-normal leading-normal text-neutral-900">
              Please check your inbox for your API key. Questions? Email
              <span className="font-bold">
                {" "}
                <Link href="mailto:alex@namestone.xyz" className="font-bold">
                  alex@namestone.xyz
                </Link>
              </span>
            </div>
          </div>

          <div className="inline-flex items-center justify-start ">
            <Button
              buttonText=" Back to Home"
              onClick={homeClick}
              color="gray"
            />
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-5 ">
          <div className="flex flex-col items-start justify-center gap-3 ">
            <div className="text-[20px] font-bold leading-7 text-stone-950">
              Admin Login
            </div>
            <span className="text-sm font-normal leading-normal text-neutral-900">
              The admin panel allows you to add and modify subnames.
            </span>
            <span className="text-sm flex text-neutral-900 mb-5">
              <div className="relative flex items-center group">
                <span className="font-bold font-mono cursor-pointer">
                  {shortAddress(address)}
                </span>
                <div className="absolute cursor-pointer px-2 rounded bg-gray-50 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300 -ml-2 -mt-12">
                  {address}
                </div>
              </div>

              <span className="text-sm font-normal pl-1 leading-normal text-neutral-900">
                has been granted access.
              </span>
            </span>
          </div>
          <div className="inline-flex items-center justify-start ">
            <Button buttonText="Login" onClick={adminClick} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
