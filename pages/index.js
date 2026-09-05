import Head from "next/head";
import Image from "next/image";
import namestoneIcon from "../public/images/namestone-icon.svg";

const announcementUrl =
  "https://x.com/namestonehq/status/2073272170994979308";

export default function Home() {
  return (
    <>
      <Head>
        <title>NameStone has ceased operations</title>
        <meta
          name="description"
          content="NameStone ceased operations on August 3, 2026."
        />
      </Head>

      <div className="flex min-h-[calc(100vh-44px)] items-center justify-center bg-neutral-50 px-6 py-16 text-brownblack-700">
        <div className="flex max-w-xl flex-col items-center text-center">
          <div className="mb-8 flex items-center text-2xl font-bold">
            <Image
              className="mr-2 h-[34px] w-auto"
              priority
              src={namestoneIcon}
              alt="NameStone"
            />
            <span>NameStone</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            NameStone has ceased operations.
          </h1>
          <p className="mt-5 text-base text-neutral-600 sm:text-lg">
            NameStone ceased operations on August 3, 2026.
          </p>
          <a
            className="mt-8 rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold transition-colors hover:bg-orange-700"
            href={announcementUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the announcement
          </a>
        </div>
      </div>
    </>
  );
}

Home.hideShutdownBanner = true;
