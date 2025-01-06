import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import obviousLogo from "../public/images/obvious-logo.svg";
import poolLogo from "../public/images/pooltogether-landing-logo.png";
import owockiImg from "../public/images/owocki-img.png";
import { Fragment } from "react";
import landingProductImage3 from "../public/images/landing-product-image4.png";

import quote from "../public/images/quote.svg";
import burner from "../public/images/burner.svg";
import burnerSite from "../public/images/burnersite.svg";
import divider from "../public/images/divider-orangespot.svg";
import durinLogo from "../public/images/durin-logo.png";
import ethIcon from "../public/images/eth-icon.svg";
import rocketIcon from "../public/images/rocket-icon.svg";
import writeIcon from "../public/images/write-icon.svg";
import durinExample from "../public/images/durin-example.png";
import ensproLogo from "../public/images/enspro-logo.svg";
import pencil from "../public/images/pencil.svg";
import xscreen from "../public/images/xscreen.svg";

import logoList from "../public/images/logos1.png";
import namestoneIcon from "../public/images/namestone-icon.svg";
import proofPointAdminPanelIcon from "../public/images/admin-icon-black.svg";
import proofPointConnectionIcon from "../public/images/connection-icon-black.svg";
import proofPointGaslessIcon from "../public/images/gasless-icon-black.svg";

import darianCoin from "../public/images/darian-coin.png";
import sloboCoin from "../public/images/slobo-coin.png";
import churinaCoin from "../public/images/churina-coin.png";
import raffyCoin from "../public/images/raffy-coin.png";

import { useRouter } from "next/router";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Home() {
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
          <title> Create ENS Subdomains via API | NameStone</title>
          <meta
            name="description"
            content="Create and issue free ENS subdomains via a REST API. Trusted by web3 leaders. Supported by ENS DAO."
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
              {/* TITLE */}
              <h1 className="max-w-lg font-bold text-md sm:text-lg md:text-5xl md:leading-tight text-brownblack-700">
                Create ENS Subdomains
              </h1>
              <span className="max-w-lg mt-3 text-sm text-left md:text-base text-brownblack-700">
                NameStone&apos;s API is trusted by Web3{" "}
                <span className="font-bold">businesses and developers</span> for
                seamless, gasless subdomain management and issuance. Get started
                today with a free API key.
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
        {/* Fancy divider */}
        <div className="flex w-full h-8">
          <div className="w-8 h-full"></div>
          <div className="w-0 h-0 border-l-[50px] border-l-transparent border-b-[50px] border-b-white"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-b-[50px] border-b-white border-r-[50px] border-r-transparent"></div>
          <div className="w-8 h-full"></div>
        </div>
        {/* Logos section */}
        <div className="flex flex-col w-full px-6 pt-16 bg-white lg:pl-32">
          <Image
            src={logoList}
            height={64}
            className="mx-auto"
            alt="Logos of web3 companies 'Pooltogether', 'POAP', 'Obvious', 'Mailchain', 'dappling', 'GreenPill', and Azurbala'  "
          />
        </div>
        {/* Product Section */}
        <div className="w-full px-6 pb-20 text-center bg-white lg:px-32">
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <h2 className="flex leading-tight text-md md:text-lg text-brownblack-700">
                <Image
                  className="mr-3"
                  width={42}
                  src={namestoneIcon}
                  alt="NameStone Icon"
                ></Image>{" "}
                <span className="mr-2 font-bold">NameStone</span> API
              </h2>
              <div className="mt-3 text-sm md:text-base">
                Issue gasless ENS subdomains with NameStone&apos;s REST API.
                Manage all subnames in one dashboard with the no-code Admin
                Panel.
              </div>
              <div className="flex gap-3 mt-5">
                <Link
                  className="px-4 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg shadow-lg cursor-pointer md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
                  href="/try-namestone"
                >
                  Get Started
                </Link>
                <Link
                  className="px-4 py-2 text-sm font-bold transition-all duration-200 bg-white border rounded-lg cursor-pointer md:text-sm hover:bg-neutral-100 border-neutral-300 text-brownblack-700 active:bg-neutral-200"
                  href="/docs"
                >
                  View Docs
                </Link>
              </div>
              {/* Proof Points */}
              <div className="flex flex-col gap-6 mt-10">
                <div className="flex gap-2">
                  {" "}
                  <Image
                    src={proofPointAdminPanelIcon}
                    alt="admin panel icon"
                  />{" "}
                  No-code Admin Panel for easy management
                </div>
                <div className="flex gap-2">
                  {" "}
                  <Image
                    src={proofPointConnectionIcon}
                    alt="connection icon"
                  />{" "}
                  Integrate via Rest API or QuickStart SDK
                </div>
                <div className="flex gap-2">
                  <Image src={proofPointGaslessIcon} alt="gasless icon" /> Zero
                  gas fees
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={landingProductImage3}
                width={472}
                alt="Managing subdomains in NameStone admin panel"
              />
            </div>
          </div>
        </div>
        {/* Fancy divider */}
        <div className="flex w-full h-8">
          <div className="w-8 h-full bg-neutral-900"></div>
          <div className="w-0 h-0 border-r-[50px] border-r-white border-b-[50px] border-b-neutral-900"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-l-[50px] border-b-neutral-900 border-b-[50px] border-l-white"></div>
          <div className="w-8 h-full bg-neutral-900"></div>
        </div>
        <div className="w-full px-6 pb-20 text-center h-fit bg-neutral-900 lg:px-32">
          {/* Testimonial Burner */}
          <div className="flex flex-col gap-4 mt-32 xl:gap-0 xl:flex-row">
            <div className="flex flex-col flex-1 p-8 text-white bg-neutral-800 mx-auto w-full sm:w-[600px] xl:w-auto">
              <Image
                src={quote}
                width={48}
                height={48}
                alt="Quote Icon"
                className="mb-4"
              />
              <p className="text-[24px] text-left leading-relaxed">
                <span className="text-orange-500">NameStone</span> makes it
                incredibly easy for any{" "}
                <span className="text-emerald-600">
                  <Link href={"https://burner.pro/"}>Burner</Link>
                </span>{" "}
                owner to claim a<strong> brnr.eth </strong> ENS subdomain during
                setup. And, with thousands of Burners shipped, NameStone&apos;s
                offchain registration is crucial to save gas and enable an
                otherwise costly feature.
              </p>
              <span className="self-end mt-4 text-right text-neutral-300">
                Cameron
              </span>
              <Image src={burner} width={120} alt="burner Logo" />
              <span className="mt-4 text-left">
                Easy to use, low cost hardware wallet designed for gifting
                stablecoins.
              </span>
            </div>

            <div className="flex items-center justify-center flex-1 xl:bg-neutral-800">
              <Image
                src={burnerSite}
                alt="burner site"
                className="w-full sm:w-[600px]"
              />
            </div>
          </div>
          {/* Statistics */}
          <div className="flex justify-between gap-12 mt-40 text-white">
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-bold">20,000</div>
              <div>Subdomains Issued</div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-bold">190</div>
              <div>Domains Managed</div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-bold">100,000</div>
              <div>Resolutions Per Month</div>
            </div>
          </div>
        </div>
        {/* Fancy Divider */}
        <div className="flex w-full h-8 ">
          <div className="w-8 h-full bg-neutral-900"></div>
          <div className="w-0 h-0 border-l-[50px] border-l-neutral-900 border-b-[50px] border-b-white"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-r-[50px] border-r-neutral-900 border-b-[50px] border-b-white"></div>
          <div className="w-8 h-full bg-neutral-900"></div>
        </div>
        {/* Durin */}
        <div className="w-full px-6 pb-20 text-center bg-white h-fit lg:px-32">
          <div className="mt-10 mb-6 text-[32px] font-bold text-left">
            Building onchain?
          </div>
          <Image src={divider} alt="divider" />
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <div className="px-4 py-1 mb-8 font-light border shadow-inner rounded-xl text-neutral-900 border-neutral-200 drop-shadow bg-neutral-50 w-fit">
                For {"{"}developers{"}"}
              </div>
              <Image
                className="mb-2 mr-3"
                src={durinLogo}
                width={196}
                alt="NameStone Icon"
              ></Image>{" "}
              <div className="mt-3 text-sm md:text-base">
                Issue subdomains on the L2 of your choice. Project docs,
                contracts, and architecture can be found on{" "}
                <Link
                  className="text-orange-500"
                  href={"https://github.com/namestonehq/durin"}
                >
                  GitHub
                </Link>
                .
              </div>
              <div className="flex gap-3 mt-5">
                <Link
                  className="px-8 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg shadow-xl cursor-pointer drop--sm md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
                  href="https://durin.dev/"
                  target="_blank"
                >
                  Durin{" "}
                </Link>
              </div>
              {/* Proof Points */}
              <div className="flex flex-col gap-6 mt-10">
                <div className="flex gap-2">
                  {" "}
                  <Image src={rocketIcon} alt="admin panel icon" /> Deploy L2
                  subdomains in minutes
                </div>
                <div className="flex gap-2">
                  {" "}
                  <Image src={writeIcon} alt="connection icon" /> Helpful
                  factory and template contracts
                </div>
                <div className="flex gap-2">
                  <Image src={ethIcon} alt="gasless icon" /> Supports ENS
                  resolution on Sepolia and Mainnet
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={durinExample}
                width={472}
                alt="Managing subdomains in NameStone admin panel"
              />
            </div>
          </div>
        </div>
        {/* Fancy divider */}
        <div className="flex w-full h-8">
          <div className="w-8 h-full bg-neutral-100"></div>
          <div className="w-0 h-0 border-r-[50px] border-r-white border-b-[50px] border-b-neutral-100"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-l-[50px] border-b-neutral-100 border-b-[50px] border-l-white"></div>
          <div className="w-8 h-full bg-neutral-100"></div>
        </div>
        <div className="w-full px-6 pb-20 text-center bg-neutral-100 h-fit lg:px-32">
          <div className="mt-10 mb-6 text-[32px] font-bold text-left">
            Need no-code subdomains?
          </div>
          <Image src={divider} alt="divider" />
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <div className="px-4 py-1 mb-8 font-light border shadow-inner rounded-xl text-neutral-900 border-neutral-200 drop-shadow bg-neutral-50 w-fit">
                For Everyone
              </div>
              <Image
                className="mr-3"
                width={200}
                src={ensproLogo}
                alt="NameStone Icon"
              ></Image>{" "}
              <div className="mt-3 text-sm md:text-base">
                Create, edit and manage your own gasless subdomains with the
                easiest no-code subdomain maker around.
              </div>
              <div className="flex gap-3 mt-5">
                <Link
                  className="px-6 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg shadow-lg cursor-pointer md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
                  href="https://enspro.xyz/"
                  target="_blank"
                >
                  ENSPro
                </Link>
              </div>
              {/* Proof Points */}
              <div className="flex flex-col gap-6 mt-10">
                <div className="flex gap-2">
                  {" "}
                  <Image src={xscreen} alt="admin panel icon" /> No-code web app
                </div>
                <div className="flex gap-2">
                  {" "}
                  <Image
                    src={proofPointGaslessIcon}
                    alt="connection icon"
                  />{" "}
                  100% Free personal subdomains
                </div>
                <div className="flex gap-2">
                  <Image src={pencil} alt="gasless icon" /> Supports text
                  records, avatars, and BTC
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <div className="flex items-center justify-center min-h-screen ">
                <video
                  src="/enspro-small-vid.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full h-auto max-w-xs rounded-lg shadow-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
        {/* Fancy Divider */}
        <div className="flex w-full h-8 ">
          <div className="w-8 h-full bg-neutral-100"></div>
          <div className="w-0 h-0 border-l-[50px] border-l-neutral-100 border-b-[50px] border-b-white"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-r-[50px] border-r-neutral-100 border-b-[50px] border-b-white"></div>
          <div className="w-8 h-full bg-neutral-100"></div>
        </div>
        <div className="w-full px-6 pb-20 text-center bg-white h-fit lg:px-32">
          <div className="text-[40px] font-bold text-left">
            Find the right product for you
          </div>
          <div className="mt-2 mb-20 text-left">
            It&apos;s your name, your way. Issue on a leading L2 chain or go
            gasless.
          </div>
          <div className="flex justify-between">
            <div>
              <div className="font-bold">For Any Project</div>
              <div className="flex items-center justify-center p-2 bg-neutral-900">
                <Image
                  src={namestoneIcon}
                  alt="namestone"
                  className="object-contain w-20 h-20 "
                />
              </div>
            </div>
            <div className="font-bold">For Developers</div>
            <div className="font-bold">For Everyone</div>
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
