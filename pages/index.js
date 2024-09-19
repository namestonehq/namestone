import Head from "next/head";
import Image from "next/image";

import obviousLogo from "../public/images/obvious-logo.svg";
import poolLogo from "../public/images/pooltogether-landing-logo.png";
import owockiImg from "../public/images/owocki-img.png";
import { Fragment } from "react";
import landingProductImage1 from "../public/images/landing-product-image1.png";
import landingProductImage2 from "../public/images/landing-product-image2.png";
import blackProductImage1 from "../public/images/product-image-black1.png";
import blackProductImage2 from "../public/images/product-image-black2.png";
import blackProductImage3 from "../public/images/product-image-black3.png";

import noGasImage from "../public/images/no-gas-icon.png";
import imageCoinbase from "../public/images/image-coinbase-wallet.png";
import imageRainbowWallet from "../public/images/image-rainbow-wallet.png";
import imageMetamask from "../public/images/image-metamask.png";
import imageUniswapWallet from "../public/images/image-uniswap-wallet.png";
import imageEns from "../public/images/image-ens.png";
import imageShowtime from "../public/images/image-showtime.png";
import imageEtherscan from "../public/images/image-etherscan.png";
import imageMailchain from "../public/images/image-mailchain.png";
import logoList from "../public/images/logos.png";
import ensLogo from "../public/images/ens_logo_purple.svg";
import airstackLogo from "../public/images/airstack-logo.png";

import darianCoin from "../public/images/darian-coin.png";
import sloboCoin from "../public/images/slobo-coin.png";
import churinaCoin from "../public/images/churina-coin.png";
import raffyCoin from "../public/images/raffy-coin.png";

import { useRouter } from "next/router";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Home() {
  const gaslessData = [
    {
      key: "subdomain",
      text: "Registering Subdomains",
    },
    {
      key: "avatar",
      text: "Setting Avatars",
    },
    {
      key: "text",
      text: "Changing Text Records",
    },
  ];

  const testimonyData = [
    {
      key: "pool",

      text: "“NameStone supports us in our mission to help people save money. We’re excited by the opportunity to provide gasless ENS names to our users around the world.”",
      img: poolLogo,
      img_alt: "pool logo",
    },
    {
      key: "Kevin Owocki",

      text: "“The greenpill network has local chapters in over 15 locations! From japan.greenpill.eth to ottawa.greenpill.eth to newyork.greenpill.eth, @namestonehq made it easy to issue subnames for our community.”",
      img: owockiImg,
      img_alt: "owocki twitter profile picture",
    },
    {
      key: "obvious",

      text: "“Issuing subnames with Namestone's API brought 500+ users to our platform in less than 48 hours. Our community loved it!”",
      img: obviousLogo,
      img_alt: "Multi-chain Smart Contract Wallet ",
    },
  ];

  const router = useRouter();

  function learnMoreClick() {
    router.push("/contact-us");
  }

  return (
    <div className="flex justify-center bg-neutral-50 ">
      <div className="w-full overflow-hidden flex flex-col max-w-[1536px]">
        <Head>
          <title> Issue Free ENS Subdomains via API | NameStone</title>
          <meta
            name="description"
            content="Issue free ENS subdomains via API. Get started today with a free API key. Trusted by web3 leaders with support from ENS DAO."
            key="desc"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Nav Bar */}
        {/* <Banner brand="Wassies" /> */}
        <Header />
        {/* Main Section */}
        <div className="w-full overflow-hidden text-center flex  bg-neutral-50 md:text-left  h-[676px] lg:px-32 px-8 justify-center md:justify-start mt-[76px] relative">
          <video
            autoPlay
            muted
            loop
            className="absolute z-0 object-cover h-[600px] hidden md:block"
            style={{
              top: "0",
              left: "50%",
              transform: "translate(-50%, 0)",
            }}
          >
            <source src="/background-landing-animation.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="z-10 flex flex-wrap items-center justify-start mb-8 ">
            <div className="z-20 flex flex-col items-center md:items-start">
              {/* CHIPS */}
              <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <div className="px-3 py-0.5 bg-neutral-200  rounded-[99px] justify-center items-center gap-2 flex">
                  <div className="text-sm font-normal leading-none text-neutral-900">
                    Supported by
                  </div>
                  <Image src={ensLogo} width={46} alt="ens Logo" />
                </div>
              </div>
              {/* TITLE */}
              <h1 className="max-w-lg font-bold text-md sm:text-lg md:text-xl md:leading-tight text-brownblack-700">
                Issue Free ENS Subdomains
              </h1>
              <span className="max-w-lg mt-3 text-sm md:text-base text-brownblack-700">
                NameStone’s API is trusted by web3 leaders for easy subdomain
                management and issuance.
              </span>
              <div className="flex flex-wrap justify-center gap-4 mt-10 mb-16">
                <button
                  onClick={() => router.push("/try-namestone")}
                  className="px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Logos section */}
        <div className="flex flex-col w-full pt-16 pb-32 pl-6 bg-white lg:pl-32">
          <div className="mb-10 text-base font-bold text-neutral-900">
            Serving web3 leaders
          </div>
          <Image
            src={logoList}
            height={36}
            alt="Logos of web3 companies 'Pooltogether', 'POAP', 'Obvious', 'Mailchain', 'dappling', 'GreenPill', and Azurbala'  "
          />
        </div>
        {/* Product Section */}
        <div className="w-full px-6 pb-20 text-center bg-white lg:px-32">
          {/* ITEM 1 */}
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <div className="text-base font-bold leading-7 text-orange-400 ">
                API{" "}
              </div>
              <h2 className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
                Simple API Integration{" "}
              </h2>
              <div className="mt-3 text-sm md:text-base">
                Streamline bulk registration and name management with our API.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={landingProductImage1}
                width={472}
                alt="NameStone logo connected to integrations via API"
              />
            </div>
          </div>
          {/* ITEM 2 */}
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <div className="text-base font-bold leading-7 text-orange-400">
                Admin Panel
              </div>
              <h2 className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
                Manage subdomains with Admin Panel{" "}
              </h2>
              <div className="mt-3 text-sm md:text-base">
                Add, revoke, and edit who can claim subnames. Create blocklists
                to safeguard your community.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={landingProductImage2}
                width={472}
                alt="Managing subdomains in NameStone admin panel"
              />
            </div>
          </div>
        </div>
        {/* Gasless Section */}
        <div className="w-full px-6 bg-white lg:px-32 pb-36">
          <div className="px-10 py-10 bg-white  rounded-[20px] shadow border border-neutral-200 flex-col justify-center items-start flex">
            <h2 className="flex flex-col items-center font-bold text-md md:text-lg text-brownblack-700">
              Gasless User Benefits
            </h2>
            <div className="text-sm md:text-base text-brownblack-700">
              Сlaiming an ENS subdomain and changing text records, including an
              avatar, requires zero gas fees.
            </div>

            <div className="flex flex-row flex-wrap justify-start pt-16 md:gap-4">
              {gaslessData.map((data) => (
                <div key={data.key} className="flex items-center mb-1 mr-4">
                  <Image src={noGasImage} width={48} height={48} alt="no gas" />
                  <div className="text-base font-bold ml-3 py-[10px] text-neutral-900">
                    {data.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Black Product Section */}
        <div className="w-full px-6 pb-20 text-center bg-black lg:px-32">
          {/* ITEM 1 */}
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <h2 className="font-bold leading-tight text-white text-md md:text-lg">
                Web3 usernames without the cost
              </h2>
              <div className="mt-3 text-sm text-white md:text-base ">
                Remove the price barrier of an ENS name with CCIP-read and
                NameStone.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={blackProductImage1}
                width={440}
                alt="ENS domain connecting a network of subdomains"
              />
            </div>
          </div>
          {/* ITEM 2 */}
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <h2 className="font-bold leading-tight text-white text-md md:text-lg">
                Enable community virality
              </h2>
              <div className="mt-3 text-sm text-white md:text-base ">
                Subnames get shared on social media sites, drawing more
                attention to your brand.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={blackProductImage2}
                width={440}
                alt="Person with ENS subdomain on Twitter"
              />
            </div>
          </div>
          {/* ITEM 3 */}
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <h2 className="font-bold leading-tight text-white text-md md:text-lg">
                A shared identity
              </h2>
              <div className="mt-3 text-sm text-white md:text-base ">
                People who share the same subname can easily find and connect
                with each other.
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={blackProductImage3}
                width={440}
                alt="A list of names connect to an ENS domain and create unique ENS subdomains"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="inline-flex flex-col items-start justify-center w-full gap-20 px-6 pb-20 mt-32 text-center bg-white lg:px-32">
          <div className="flex flex-col items-start justify-start gap-3 ">
            <h2 className=" text-neutral-900  text-md md:text-lg font-bold text-left">
              The backbone for web3 names
            </h2>
            <div className="text-base font-normal leading-7 text-left text-neutral-900">
              No matter the project size, NameStone makes issuing and managing
              ENS subdomains a breeze.
            </div>
          </div>
          <div className="inline-flex flex-wrap items-start justify-start gap-6">
            <div className="inline-flex flex-col items-start justify-start gap-3  w-[278px]">
              <div className=" text-neutral-900 text-[32px] font-bold  border-l-[6px] border-solid border-orange-500 rounded-sm pl-[12px]">
                15,000+
              </div>
              <div className="text-base font-normal text-neutral-900 pl-[18px]">
                Subnames issued
              </div>
            </div>
            <div className="inline-flex flex-col items-start justify-start gap-3  w-[278px]">
              <div className=" text-neutral-900 text-[32px] font-bold border-l-[6px] border-solid border-orange-500 rounded-sm pl-[12px]">
                114
              </div>
              <div className="text-base font-normal text-neutral-900 pl-[18px]">
                Domains
              </div>
            </div>
            <div className="inline-flex flex-col items-start justify-start gap-3  w-[278px]">
              <div className=" text-neutral-900 text-[32px] font-bold border-l-[6px] border-solid border-orange-500 rounded-sm pl-[12px]">
                800k+
              </div>
              <div className="text-base font-normal text-neutral-900 pl-[18px]">
                Resolutions
              </div>
            </div>
            <div className="inline-flex flex-col items-start justify-start gap-3  w-[278px]">
              <div className=" text-neutral-900 text-[32px] font-bold border-l-[6px] border-solid border-orange-500 rounded-sm pl-[12px]">
                2,000+
              </div>
              <div className="text-base font-normal text-neutral-900 pl-[18px]">
                L2 subnames issued
              </div>
            </div>
          </div>
        </div>
        {/*  Integrations section */}
        <div className="flex flex-col items-start justify-start w-full px-6 py-16 bg-white lg:px-32">
          <h2 className="font-bold text-md md:text-lg brownblack-700">
            Hundreds of integrations <br /> powered by ENS
          </h2>
          <div className="flex flex-wrap items-center justify-start w-full gap-[38px] mt-16 ">
            <Image src={imageCoinbase} width={80} height={80} alt="coinbase" />
            <Image
              src={imageRainbowWallet}
              width={80}
              height={80}
              alt="rainbow wallet"
            />
            <Image src={imageMetamask} width={80} height={80} alt="metamask" />
            <Image
              src={imageUniswapWallet}
              width={80}
              height={80}
              alt="uniswap wallet"
            />
            <Image src={imageEns} width={80} height={80} alt="ens" />
            <Image src={imageShowtime} width={80} height={80} alt="showtime" />
            <Image
              src={imageEtherscan}
              width={80}
              height={80}
              alt="etherscan"
            />
            <Image
              src={imageMailchain}
              width={80}
              height={80}
              alt="mailchain"
            />
          </div>
        </div>

        {/* Trust Section */}
        <div className="relative flex flex-col items-start justify-start w-full px-6 py-16 pt-16 text-left bg-white lg:px-32">
          <h2 className="flex flex-col items-start font-bold text-md md:text-lg text-brownblack-700">
            Trusted by web3 natives
          </h2>
          <div className="flex flex-wrap justify-center pb-20">
            {testimonyData.map((data) => (
              <Fragment key={data.key}>
                {/* Testimony Card */}
                <div className="flex flex-col items-start mt-16 justify-between min-h-[240px] w-auto max-w-fit rounded-lg bg-white p-[32px] mx-[32px] text-left drop-shadow-lg ">
                  <div className="mb-4 text-sm md:max-w-xs text-brownblack-700">
                    {data.text}
                  </div>
                  <Image src={data.img} height={48} alt={data.img_alt} />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
        {/* BUILDERS */}
        <div className="flex flex-col items-start justify-start w-full px-6 py-16 bg-neutral-50 lg:px-32">
          <div className="inline-flex items-center self-stretch justify-start gap-20">
            <div className="inline-flex flex-col items-start self-stretch justify-center gap-8 grow shrink basis-0">
              <h2 className="self-stretch text-neutral-900 text-[32px] font-bold">
                Builders
              </h2>
              <div className="w-[336px] justify-start items-center gap-6 inline-flex">
                <Image width={88} src={sloboCoin} alt="slobo" />
                <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                  <div className="self-stretch text-base font-bold leading-7 text-neutral-900">
                    slobo.eth
                  </div>
                  <div className="self-stretch text-sm font-normal leading-normal text-neutral-900">
                    ENS Steward, Web3 Founder, and Former CMO
                  </div>
                </div>
              </div>
              <div className="w-[336px] justify-start items-center gap-6 inline-flex">
                <Image width={88} src={darianCoin} alt="darian" />
                <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                  <div className="self-stretch text-base font-bold leading-7 text-neutral-900">
                    darianb.eth
                  </div>
                  <div className="self-stretch text-sm font-normal leading-normal text-neutral-900">
                    Web3 Founder, Builder and Leader of Tech Teams
                  </div>
                </div>
              </div>
              <div className="w-[336px] justify-start items-center gap-6 inline-flex">
                <Image width={88} src={churinaCoin} alt="churina" />
                <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                  <div className="self-stretch text-base font-bold leading-7 text-neutral-900">
                    churina.eth
                  </div>
                  <div className="self-stretch text-sm font-normal leading-normal text-neutral-900">
                    UI/UX Designer
                  </div>
                </div>
              </div>
              <div className="w-[336px] justify-start items-center gap-6 inline-flex">
                <Image width={88} src={raffyCoin} alt="churina" />
                <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                  <div className="self-stretch text-base font-bold leading-7 text-neutral-900">
                    raffy.eth
                  </div>
                  <div className="self-stretch text-sm font-normal leading-normal text-neutral-900">
                    Financial software engineer with a passion for solving
                    problems.
                  </div>
                </div>
              </div>
              {/* <div className="pb-0.5 justify-center items-center gap-2 inline-flex">
                <div className="text-base font-bold leading-normal text-center text-neutral-900">
                  Currently hiring devs
                </div>
                */}
            </div>
          </div>
        </div>
        {/* Final Call section */}
        <div className="flex flex-col items-start justify-start w-full px-6 py-16 text-left lg:px-32 bg-neutral-900 ">
          <h2 className="mt-16 font-bold text-white text-md md:text-lg">
            Ready to get started?{" "}
          </h2>
          <div className="max-w-xl mt-3 text-sm text-left text-white md:text-base ">
            Our team is standing by to answer your questions and find the right
            solution for you
          </div>
          <div className="flex flex-wrap justify-start gap-4 mt-10 mb-16">
            <button
              onClick={() => router.push("/try-namestone")}
              className="px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
            >
              Get Started
            </button>
            <button
              onClick={learnMoreClick}
              className="px-8 py-3 text-sm font-bold text-white border border-white border-solid rounded-lg cursor-pointer hover:bg-white hover:bg-opacity-5 w-fit active:bg-white active:bg-opacity-10"
            >
              Contact Us
            </button>
          </div>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
