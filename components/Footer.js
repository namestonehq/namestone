import React from "react";
import Image from "next/image";
import namestoneLogoWhite from "../public/images/namestone-logo-white.svg";
import logoTwitterWhite from "../public/images/logo-twitter-white.svg";
import logoGithubWhite from "../public/images/logo-github-white.svg";
import ensLogo from "../public/images/ens-logo.png";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center w-full px-6 bg-neutral-900 lg:px-32">
      <div className="flex flex-col md:flex-row w-full mt-[24px] pb-6 items-center justify-center md:justify-between relative border-b border-orange-500 border-opacity-30">
        <Link href="/">
          <Image
            className="h-[30px] md:mr-1 flex-shrink-0"
            priority
            src={namestoneLogoWhite}
            alt="Forging Commmunity Identity"
          />
        </Link>
        <div className="flex flex-col items-center justify-between w-full space-x-0 md:flex-row md:flex-nowrap md:justify-start md:w-auto">
          <div className="flex items-center justify-center mt-6 md:flex-nowrap md:justify-start md:mt-0 md:w-auto">
            <div className="flex-shrink-0 mx-3 text-xs font-bold text-white">
              <Link href="/admin" className="hover:underline">
                Admin Login
              </Link>
            </div>
            <div className="flex-shrink-0 mx-4 text-xs text-white">
              <Link href="/legal/tos" className="hover:underline">
                Terms of Service
              </Link>
            </div>
            <div className="flex-shrink-0 mx-4 text-xs text-white">
              <Link href="/legal/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="flex items-start justify-start flex-shrink-0 mt-6 md:flex-nowrap md:justify-start md:mt-0 md:w-auto">
            <Link href="https://twitter.com/namestonehq">
              <Image
                className="h-[20px] flex-shrink-0 mx-4"
                src={logoTwitterWhite}
                alt="NameStone Twitter"
              />
            </Link>
            <Link href="https://github.com/resolverworks">
              <Image
                className="h-[20px] flex-shrink-0 mx-4"
                src={logoGithubWhite}
                alt="NameStone Github"
              />
            </Link>
          </div>
        </div>
      </div>
      <a href="https://ens.domains/" target="_blank">
        <div className="flex flex-row w-full my-[24px] items-center justify-center relative space-x-3">
          <Image
            className="h-[21px] w-[19px]"
            src={ensLogo}
            width={33}
            height={37}
            alt="ens logo"
          />
          <div className="text-[14px] text-white">Built on ENS</div>
        </div>
      </a>
    </div>
  );
}
