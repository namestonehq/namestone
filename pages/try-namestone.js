import React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import namestoneIcon from "../public/images/namestone-icon.svg";
import sideMenuSvg from "../public/images/try-for-free-side-menu.svg";

export default function TryNamestone() {
  return (
    <div className="flex min-h-screen justify-center bg-white">
      <div className="relative flex w-full max-w-[1536px] flex-col overflow-hidden">
        <Head>
          <title>Service Update | NameStone</title>
          <meta
            name="description"
            content="NameStone is shutting down August 3, 2026, and is no longer issuing new API keys."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <header className="relative z-20 flex w-full items-center justify-between px-6 py-4 backdrop-blur-sm lg:px-32">
          <Link href="/" className="flex items-center text-2xl font-bold">
            <Image
              className="mr-1 h-[30px]"
              priority
              src={namestoneIcon}
              alt="NameStone"
            />
            <span>NameStone</span>
          </Link>
          <Link
            href="/admin"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-brownblack-700 transition-colors hover:bg-orange-700 active:bg-orange-800"
          >
            Admin Login
          </Link>
        </header>

        <main className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-8">
          <Image
            src={sideMenuSvg}
            alt=""
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-6 h-1 w-16 rounded-full bg-orange-500" />
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-orange-800">
              Service update
            </p>
            <h1 className="text-md font-bold leading-tight text-brownblack-700 sm:text-lg">
              NameStone is shutting down August 3, 2026.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-neutral-600 sm:text-base">
              We&apos;re no longer issuing new API keys. Thank you to everyone
              who built with NameStone.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-neutral-200 pt-8 sm:flex-row">
              <Link
                href="/admin"
                className="w-full rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-brownblack-700 transition-colors hover:bg-neutral-100 sm:w-auto"
              >
                Open Admin Panel
              </Link>
              <Link
                href="https://x.com/namestonehq/status/2073272170994979308"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-bold text-brownblack-700 transition-colors hover:bg-neutral-100 sm:w-auto"
              >
                Read the announcement
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
