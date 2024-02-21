import Head from "next/head";
import Image from "next/image";
import Button from "../components/Button";
import confirmationCheckIcon from "../public/images/confirmation_check-icon.png";
import { useRouter } from "next/router";
import NameStoneLogo from "../components/NameStoneLogo";
import Footer from "../components/Footer";
import { useParams } from "next/navigation";

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

  return (
    <div className="flex flex-col w-full h-[100vh]">
      <Head>
        <title>Your Api Key is on the way</title>
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
          <Image
            className="h-[60px] w-[60px] mb-6"
            priority
            src={confirmationCheckIcon}
            alt="Forging Commmunity Identity"
          />
          <div className="flex flex-col items-start justify-center gap-3 ">
            <div className="text-neutral-900 text-[32px] font-bold ">
              Your API key is on the way
            </div>
            <div className="text-sm font-normal leading-normal text-neutral-900">
              Please check your inbox for your API key. Questions? Email
              alex@namestone.xyz
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
              Access the Admin Panel
            </div>
            <div className="">
              <span className="text-sm font-normal leading-normal text-neutral-900">
                You’ll need to connect the wallet{" "}
              </span>
              <span className="text-sm font-bold text-neutral-900 ">
                {address}{" "}
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-900">
                to get started.
              </span>
            </div>
          </div>
          <div className="inline-flex items-center justify-start ">
            <Button buttonText="Admin Login" onClick={adminClick} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
