import React, { useState } from "react";
import namestoneIcon from "../public/images/namestone-icon.svg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";

export default function Header({ subtitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  function toggleMenu() {
    setMenuOpen(!menuOpen);
  }

  return (
    <div className="flex justify-center w-full">
      <div className="fixed z-40 flex justify-between w-full px-6 py-4 backdrop-blur-sm lg:px-32 max-w-[1536px]">
        {!menuOpen ? (
          <>
            <div className="flex items-center text-2xl font-bold">
              <Link href="/" className="flex">
                <Image
                  className="h-[30px] mr-1  my-auto"
                  priority
                  src={namestoneIcon}
                  alt="Forging Commmunity Identity"
                />{" "}
                <span className={`mr-1 ${subtitle ? "hidden md:block" : ""}`}>
                  {" "}
                  NameStone{" "}
                </span>
                {subtitle}
              </Link>
            </div>
            <div className="items-center space-x-6 md:space-x-10 lg:hidden">
              <button onClick={toggleMenu}>
                <Icon icon="charm:menu-hamburger" className="w-6 h-6" />
              </button>
            </div>
            <div className="items-center hidden space-x-6 md:space-x-10 lg:flex">
              <Link className="text-xs font-bold md:text-sm" href="/docs">
                {" "}
                Docs
              </Link>

              <Link className="text-xs font-bold md:text-sm" href="/blog">
                {" "}
                Blog
              </Link>
              <Link className="text-xs font-bold md:text-sm" href="/admin">
                {" "}
                Admin Login
              </Link>
              <Link className="text-xs font-bold md:text-sm" href="/contact-us">
                {" "}
                Contact Us
              </Link>
              <button
                onClick={() => router.push("/try-namestone")}
                className="z-20 px-6 py-3 text-sm font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 active:bg-orange-800"
              >
                Try for Free
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="py-4 bg-white rounded-[7px] shadow border border-neutral-300 flex-col justify-start items-center gap-[29px] inline-flex w-full">
              <div className="self-stretch h-[455px] pb-[170px] border-b border-neutral-300 flex-col justify-start items-center gap-[29px] flex">
                <div className="flex items-start justify-between w-full px-4 text-2xl font-bold">
                  <Link href="/" className="flex">
                    <Image
                      className="h-[30px] mr-1  my-auto"
                      priority
                      src={namestoneIcon}
                      alt="Forging Commmunity Identity"
                    />{" "}
                    <span
                      className={`mr-1 ${subtitle ? "hidden md:block" : ""}`}
                    >
                      {" "}
                      NameStone{" "}
                    </span>
                    {subtitle}
                  </Link>
                  <div className="items-center space-x-6">
                    <button onClick={toggleMenu}>
                      <Icon icon="octicon:x-16" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center self-stretch justify-start h-56">
                  <Link
                    className="inline-flex items-center self-stretch justify-start gap-3 p-4 hover:bg-neutral-100"
                    href="/docs"
                  >
                    <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                      Docs
                    </div>
                  </Link>
                  <Link
                    className="inline-flex items-center self-stretch justify-start gap-3 p-4 hover:bg-neutral-100"
                    href="/blog"
                  >
                    <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                      Blog
                    </div>
                  </Link>
                  <Link
                    className="inline-flex items-center self-stretch justify-start gap-3 p-4 hover:bg-neutral-100"
                    href="/admin"
                  >
                    <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                      Admin Login
                    </div>
                  </Link>
                  <Link
                    className="inline-flex items-center self-stretch justify-start gap-3 p-4 hover:bg-neutral-100"
                    href="/contact-us"
                  >
                    <div className="text-base font-bold leading-normal grow shrink basis-0 text-neutral-900">
                      Contact Us
                    </div>
                  </Link>
                </div>
              </div>
              <div className="inline-flex items-end justify-center gap-3">
                <button
                  onClick={() => router.push("/try-namestone")}
                  className="z-20 px-6 py-3 text-sm font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 active:bg-orange-800"
                >
                  Try for Free
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
