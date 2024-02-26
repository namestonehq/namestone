import Head from "next/head";
import Image from "next/image";

import nftychatLogo from "../public/images/nftychat-logo.png";
import poolLogo from "../public/images/pooltogether-landing-logo.png";
import owockiImg from "../public/images/owocki-img.png";
import { Fragment } from "react";
import backgroundImage1 from "../public/images/background-landing-image1.svg";
import landingProductImage1 from "../public/images/landing-product-image1.png";
import landingProductImage2 from "../public/images/landing-product-image2.png";
import landingProductImage3 from "../public/images/landing-product-image3.png";
import landingCommunityImage1 from "../public/images/landing-community-image1.png";
import landingCommunityImage2 from "../public/images/landing-community-image2.png";
import landingCommunityImage3 from "../public/images/landing-community-image3.png";
import noGasImage from "../public/images/no-gas-icon.png";
import imageCoinbase from "../public/images/image-coinbase-wallet.png";
import imageRainbowWallet from "../public/images/image-rainbow-wallet.png";
import imageMetamask from "../public/images/image-metamask.png";
import imageUniswapWallet from "../public/images/image-uniswap-wallet.png";
import imageEns from "../public/images/image-ens.png";
import imageShowtime from "../public/images/image-showtime.png";
import imageEtherscan from "../public/images/image-etherscan.png";
import imageMailchain from "../public/images/image-mailchain.png";
import imageNftychat from "../public/images/image-nftychat.png";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

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
      key: "nfty",

      text: "“Issuing subnames with Namestone's API brought 500+ users to our platform in less than 48 hours. Our community loved it!”",
      img: nftychatLogo,
      img_alt: "nftychat logo",
    },
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
  ];

  const router = useRouter();

  function learnMoreClick() {
    router.push("/contact-us");
  }

  return (
    <div>
      <Head>
        <title>NameStone</title>
        <meta
          name="description"
          content="Issue gasless ENS subdomains"
          key="desc"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Nav Bar */}
      {/* <Banner brand="Wassies" /> */}
      <Header />
      {/* Main Section */}
      <div className="w-full px-6 overflow-hidden text-center bg-orange-20 md:px-20 md:text-left">
        <div className="flex flex-wrap justify-center md:justify-between 2xl:justify-around mt-24 md:mt-[240px]  mb-8 z-10 ">
          <div className="z-20 flex flex-col items-center md:items-start">
            <span className="max-w-lg font-bold text-md sm:text-lg md:text-xl md:leading-tight text-brownblack-700">
              Issue gasless ENS subdomains
            </span>
            <span className="max-w-lg mt-3 text-sm md:text-base text-brownblack-700">
              Reward your community, generate revenue, and enhance your brand
              with <b>ENS subdomains.</b>
            </span>
            <div className="flex flex-wrap justify-center gap-4 mt-10 mb-16">
              <button
                onClick={learnMoreClick}
                className="px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
              >
                Contact Us
              </button>
              <button
                className="px-8 py-3 text-sm font-bold border border-solid rounded-lg cursor-pointer border-brownblack-700 hover:bg-brownblack-700 hover:bg-opacity-5 text-brownblack-700 w-fit active:bg-brownblack-700 active:bg-opacity-10"
                onClick={() => router.push("/try-namestone")}
              >
                Try For Free
              </button>
            </div>
          </div>
          <div className="w-[640px]">
            <div className="relative pt-[56.25%] z-10">
              {/* <div className="relative pt-[56.25%] w-[640px] z-10"> */}
              <ReactPlayer
                width="100%"
                height="100%"
                className="absolute top-0 left-0"
                url="https://www.youtube.com/watch?v=kw1spZZmdRo&modestbranding=1&nologo=1&showinfo=0"
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 z-0 hidden w-full h-full md:block">
          <Image
            src={backgroundImage1}
            className="object-cover fill ml-[696px]"
            alt="background image"
            width={687}
          />
        </div>
      </div>
      {/* Product Section */}
      <div className="w-full px-6 pb-20 text-center bg-white md:px-20">
        {/* ITEM 1 */}
        <div className="flex flex-wrap items-center gap-10 mt-16">
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              API access for easy integration
            </div>
            <div className="mt-3 text-sm md:text-base">
              Need to manage thousands to millions of names? We offer bulk
              registration and an API. Contact us for pricing.
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image src={landingProductImage1} width={439} alt="API access" />
          </div>
        </div>
        {/* ITEM 2 */}
        <div className="flex flex-wrap-reverse items-center gap-10 mt-16">
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image
              src={landingProductImage2}
              width={439}
              alt="Admin dashboard"
            />
          </div>
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px] mt-10">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              Admin panel for name management
            </div>
            <div className="mt-3 text-sm md:text-base">
              Add, revoke, and edit who can claim names. Create blocklists to
              safeguard your community.
            </div>
          </div>
        </div>
        {/* ITEM 3 */}
        <div className="flex flex-wrap items-center gap-10 mt-16">
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              Ready-made claim flow
            </div>
            <div className="mt-3 text-sm md:text-base">
              A branded claim page gated by POAPs, NFTs, and allowlists,
              community directory with user information, and gaslessly editable
              user profiles.
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image src={landingProductImage3} width={439} alt="claim flow" />
          </div>
        </div>
      </div>
      {/*  Call section */}
      <div className="flex flex-col items-center justify-center w-full px-6 py-16 text-center md:px-16 bg-orange-20">
        <div className="font-bold text-md md:text-lg brownblack-700">
          Ready to get started?{" "}
        </div>
        <div className="max-w-xl mt-3 text-center text:sm md:text-base brownblack-700 ">
          Our team is standing by to answer your questions and find the right
          solution for you
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-10 mb-8">
          <button
            onClick={learnMoreClick}
            className="px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
          >
            Contact Us
          </button>
          <button
            className="px-8 py-3 text-sm font-bold border border-solid rounded-lg cursor-pointer border-brownblack-700 hover:bg-brownblack-700 hover:bg-opacity-5 text-brownblack-700 active:bg-brownblack-700 active:bg-opacity-10"
            onClick={() => router.push("/try-namestone")}
          >
            Try For Free
          </button>
        </div>
      </div>
      {/* Community Section */}
      <div className="w-full px-6 pb-20 text-center bg-white md:px-20 ">
        {/* ITEM 1 */}
        <div className="flex flex-wrap items-center gap-10 mt-16">
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              Web3 usernames without the cost{" "}
            </div>
            <div className="mt-3 text-sm md:text-base">
              Remove the price barrier of an ENS name with CCIP-read and
              NameStone.
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image
              src={landingCommunityImage1}
              width={439}
              height={350}
              alt="API access"
            />
          </div>
        </div>
        {/* Gasless Section */}
        <div className="px-6 py-10 mt-16 rounded-xl bg-brownblack-20 ">
          <div className="flex flex-col items-center font-bold text-md md:text-lg text-brownblack-700">
            Gasless User Benefits
          </div>
          <div className="mt-3 text-sm text-center md:text-base text-brownblack-700">
            Сlaiming an ENS name and changing text records, including <br />
            an avatar, requires <span className="font-bold">zero gas fees</span>
          </div>

          <div className="flex flex-row flex-wrap justify-center pt-12 md:gap-4">
            {gaslessData.map((data) => (
              <div
                key={data.key}
                className="flex flex-col min-w-[150px] items-center pb-10 mx-4 max-w-[280px]"
              >
                <Image src={noGasImage} width={62} height={62} alt="no gas" />
                <div className="mt-4 text-sm font-bold md:mt-7 md:text-base text-brownblack-700">
                  {data.text}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* ITEM 2 */}
        <div className="flex flex-wrap-reverse items-center gap-10 mt-16 ">
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image
              src={landingCommunityImage2}
              width={437}
              height={234}
              alt="Admin dashboard"
            />
          </div>
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              Enable community virality
            </div>
            <div className="mt-3 text-sm md:text-base">
              Names get shared on social media sites, drawing more attention to
              your brand.
            </div>
          </div>
        </div>
        {/* ITEM 3 */}
        <div className="flex flex-wrap items-center gap-10 mt-16 ">
          <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
            <div className="font-bold leading-tight text-md md:text-lg text-brownblack-700">
              A shared identity
            </div>
            <div className="mt-3 text-sm md:text-base">
              People who share the same subname can easily find and connect with
              each other.
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
            <Image
              src={landingCommunityImage3}
              width={436}
              height={301}
              alt="claim flow"
            />
          </div>
        </div>
      </div>
      {/*  Integrations section */}
      <div className="flex flex-col items-center justify-start w-full px-6 py-16 bg-orange-20">
        <div className="font-bold text-center text-md md:text-lg brownblack-700">
          Hundreds of integrations <br /> powered by ENS
        </div>
        <div className="flex flex-wrap items-center justify-around w-full gap-4 mt-16 md:px-20">
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
          <Image src={imageEtherscan} width={80} height={80} alt="etherscan" />
          <Image src={imageMailchain} width={80} height={80} alt="mailchain" />
          <Image src={imageNftychat} width={80} height={80} alt="nftychat" />
        </div>
      </div>

      {/* Trust Section */}
      <div className="relative w-full pt-16 text-center bg-white">
        <div className="flex flex-col items-center font-bold text-md md:text-lg text-brownblack-700">
          Trusted by web3 natives
        </div>
        <div className="flex flex-wrap justify-center pb-20">
          {testimonyData.map((data) => (
            <Fragment key={data.key}>
              {/* Testimony Card */}
              <div className="flex flex-col items-start mt-16 justify-between min-h-[240px] w-auto max-w-fit rounded-lg bg-white p-[32px] mx-[32px] text-left drop-shadow-lg z-30 ">
                <div className="mb-4 text-sm  md:max-w-xs text-brownblack-700">
                  {data.text}
                </div>
                <Image src={data.img} height={48} alt={data.img_alt} />
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Final Call section */}
      <div className="flex flex-col items-center justify-center w-full px-6 py-16 text-center md:px-16 bg-brownblack-700">
        <div className="mt-16 font-bold text-white text-md md:text-lg">
          Ready to get started?{" "}
        </div>
        <div className="max-w-xl mt-3 text-sm text-center text-white md:text-base ">
          Our team is standing by to answer your questions and find the right
          solution for you
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-10 mb-16">
          <button
            onClick={learnMoreClick}
            className="px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
          >
            Contact Us
          </button>
          <button
            className="px-8 py-3 text-sm font-bold text-white border border-white border-solid rounded-lg cursor-pointer hover:bg-white hover:bg-opacity-5 w-fit active:bg-white active:bg-opacity-10"
            onClick={() => router.push("/try-namestone")}
          >
            Try For Free
          </button>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
function Banner({ brand }) {
  return (
    <a href={`/${brand.toLowerCase()}`}>
      <div className="flex justify-center items-center bg-[#A6C8FE] h-10 font-bold text-brownblack-700">
        Claiming now open for {brand} Holders!
      </div>
    </a>
  );
}
