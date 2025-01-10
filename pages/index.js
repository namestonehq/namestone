import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
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
import ensproExample from "../public/images/enspro.png";
import pencil from "../public/images/pencil.svg";
import xscreen from "../public/images/xscreen.svg";
import orangeArrow from "../public/images/orange-arrow.svg";
import durinIcon from "../public/images/icon-durin.svg";
import ensproIcon from "../public/images/icon-enspro.svg";

import logoList from "../public/images/logos1.png";
import namestoneIcon from "../public/images/namestone-icon.svg";
import proofPointAdminPanelIcon from "../public/images/admin-icon-black.svg";
import proofPointConnectionIcon from "../public/images/connection-icon-black.svg";
import proofPointGaslessIcon from "../public/images/gasless-icon-black.svg";

import darianCoin from "../public/images/darian-coin.png";
import sloboCoin from "../public/images/slobo-coin.png";
import churinaCoin from "../public/images/churina-coin.png";
import raffyCoin from "../public/images/raffy-coin.png";
import kirillCoin from "../public/images/kirill-coin.png";
import nickCoin from "../public/images/nick-coin.jpeg";
import timCoin from "../public/images/tim-coin.jpg";
import zachCoin from "../public/images/zach-coin.jpg";

import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Home() {
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
        <Header />
        {/* Main Section */}
        <div className="w-full overflow-hidden text-center flex  bg-neutral-50 md:text-left  h-[676px] lg:px-32 px-8 justify-center md:justify-start sm:mt-[76px] relative">
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
          <div className="z-10 flex flex-wrap items-center justify-start sm:mb-8 ">
            <div className="z-20 flex flex-col items-start">
              {/* TITLE */}
              <h1 className="max-w-lg font-bold text-left text-md sm:text-lg md:text-5xl md:leading-tight text-brownblack-700">
                Create ENS Subdomains
              </h1>
              <span className="max-w-lg mt-3 text-sm text-left md:text-base text-brownblack-700">
                NameStone&apos;s API is trusted by Web3{" "}
                <span className="font-bold">businesses and developers</span> for
                seamless, gasless subdomain management and issuance. Get started
                today with a free API key.
              </span>
              <div className="flex flex-wrap gap-4 mt-10 sm:mb-16 ">
                <Link
                  className="px-4 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg cursor-pointer md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
                  href="/try-namestone"
                >
                  Get Started
                </Link>
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
        <div className="flex flex-col w-full px-6 pt-4 pb-4 bg-white lg:px-0 ">
          <Image
            src={logoList}
            height={64}
            className="mx-auto"
            alt="Logos of web3 companies that use NameStone"
          />
        </div>
        {/* NameStone API */}
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
                  className="px-4 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg cursor-pointer md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
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
                – Cameron
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
              <div>Resolutions per Month</div>
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
              <div className="px-4 py-1 mb-8 font-light border shadow-inner rounded-xl text-neutral-900 border-neutral-200 bg-neutral-50 w-fit">
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
                  className="text-orange-500 transition-colors duration-300 hover:text-orange-700"
                  href={"https://github.com/namestonehq/durin"}
                >
                  GitHub
                </Link>
                .
              </div>
              <div className="flex gap-3 mt-5">
                <Link
                  className="px-8 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg cursor-pointer drop--sm md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
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
        {/* ENS Pro */}
        <div className="w-full px-6 pb-20 text-center bg-neutral-100 h-fit lg:px-32">
          <div className="mt-10 mb-6 text-[32px] font-bold text-left">
            Need no-code subdomains?
          </div>
          <Image src={divider} alt="divider" />
          <div className="flex flex-wrap items-center gap-10 mt-16">
            <div className="flex flex-col justify-start flex-1 text-left min-w-[280px]">
              <div className="px-4 py-1 mb-8 font-light border shadow-inner rounded-xl text-neutral-900 border-neutral-200 bg-neutral-50 w-fit">
                For everyone
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
                  className="px-6 py-2 text-sm font-bold transition-all duration-200 bg-orange-500 border border-black rounded-lg cursor-pointer md:text-sm hover:bg-orange-700 text-brownblack-700 active:bg-orange-800 "
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
                  100% free personal subdomains
                </div>
                <div className="flex gap-2">
                  <Image src={pencil} alt="gasless icon" /> Supports text
                  records, avatars, and BTC
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center min-w-[280px] flex-1">
              <Image
                src={ensproExample}
                width={472}
                alt="Managing subdomains in NameStone admin panel"
              />
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
        {/* Right Product For You Section */}
        <div className="w-full px-6 pb-40 text-center bg-white h-fit lg:px-32">
          <div className="mt-20 mb-4 text-[32px] font-bold text-left">
            Find the right product for you
          </div>
          <div className="mb-20 text-left ">
            It&apos;s your name, your way. Issue on a leading L2 chain or go
            gasless.
          </div>
          <div className="flex flex-col justify-between gap-20 xl:gap-5 xl:flex-row">
            <Card
              title="For Any Project"
              product="NameStone API"
              description="Issue gasless ENS subdomains with our REST API."
              iconSrc={namestoneIcon}
              linkHref="/try-namestone"
              backgroundColor="bg-neutral-900"
            />
            <Card
              title="For Hackers"
              product="Durin"
              description="Create subdomains on an L2 of your choice in minutes."
              iconSrc={durinIcon}
              linkHref="https://durin.dev/"
              backgroundColor="bg-stone-200"
            />
            <Card
              title="For Everyone"
              product="ENSPro"
              description="A no-code solution to create personal subdomains."
              iconSrc={ensproIcon}
              linkHref="https://enspro.xyz/"
              backgroundColor="bg-neutral-900"
            />
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
        {/* Builders & Contributors */}

        <div className="w-full px-6 pb-20 text-white bg-neutral-900 h-fit lg:px-32">
          <div className="mt-20 mb-6 text-[32px] font-bold  text-left">
            Builders & Contributors
          </div>
          <div className="grid grid-cols-1 gap-12 md:gap-8 md:grid-cols-2">
            {/* Slobo */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image width={88} src={sloboCoin} alt="slobo" />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/slobo.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    slobo.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Web3 Founder, open source developer and ENS Steward.
                </div>
              </div>
            </div>
            {/* Darian */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image width={88} src={darianCoin} alt="darian" />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/darianb.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    darianb.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Web3 Founder, builder and leader of tech teams.
                </div>
              </div>
            </div>
            {/* Churina */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image width={88} src={churinaCoin} alt="churina" />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/churina.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    churina.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  UI/UX Designer crafting intuitive product experiences.
                </div>
              </div>
            </div>
            {/* Raffy */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image
                width={88}
                src={raffyCoin}
                alt="raffy"
                className=" grayscale"
              />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/raffy.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    raffy.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Financial software engineer with a passion for solving
                  problems.
                </div>
              </div>
            </div>
            {/* Zach */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image
                width={88}
                src={zachCoin}
                alt="Tim"
                className="rounded-full grayscale"
              />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/zachterrell.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    zachterrell.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Full Stack Developer
                </div>
              </div>
            </div>
            {/* Kirill */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image width={88} src={kirillCoin} alt="Kirill" />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/kp3556.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    kp3556.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Product Manager
                </div>
              </div>
            </div>
            {/* Nick */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image
                width={88}
                src={nickCoin}
                alt="Nick"
                className="rounded-full grayscale"
              />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/ncale.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    ncale.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Open Source Developer
                </div>
              </div>
            </div>

            {/* Tim */}
            <div className="inline-flex items-center justify-start max-w-xl gap-6">
              <Image
                width={88}
                src={timCoin}
                alt="Tim"
                className="rounded-full grayscale"
              />
              <div className="inline-flex flex-col items-start justify-center gap-2 grow shrink basis-0">
                <div className="self-stretch text-base font-bold leading-7 ">
                  <Link
                    href={"https://app.ens.domains/timcox.eth"}
                    target="_blank"
                    className="transition-colors duration-300 hover:text-ens-100"
                  >
                    timcox.eth
                  </Link>
                </div>
                <div className="self-stretch text-sm font-normal leading-normal">
                  Hype Man
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  iconSrc,
  linkHref,
  product,
  backgroundColor,
}) {
  return (
    <div className="h-24 max-w-md max-h-24">
      <div className="mb-5 font-bold text-left">{title}</div>
      <div className="flex items-center justify-center max-w-full max-h-full overflow-hidden rounded-lg bg-neutral-100">
        <Link
          href={linkHref}
          className="flex items-center transition-colors duration-500 hover:bg-orange-100"
          target="_blank"
        >
          <div
            className={`flex items-center justify-center flex-shrink-0 max-w-full max-h-full rounded-l-lg aspect-square ${backgroundColor}`}
          >
            <Image
              src={iconSrc}
              alt={title}
              width={48}
              height={48}
              className="object-contain m-6"
            />
          </div>
          <div className="flex flex-1 m-4 text-left">
            <div className="flex flex-col gap-2">
              <div className="font-bold">{product}</div>
              <div className="text-xs line-clamp-2">{description}</div>
            </div>

            <Image
              src={orangeArrow}
              alt="arrow"
              width={36}
              height={36}
              className="ml-2"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
