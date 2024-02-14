import React from "react";
import namestoneIcon from "../public/images/namestone-icon.svg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Header({ subtitle }) {
  const router = useRouter();
  function learnMoreClick() {
    router.push("/contact-us");
  }

  return (
    <div className="fixed z-40 flex justify-between w-full px-6 py-4 backdrop-blur-sm md:px-20">
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
      <div className="flex items-center space-x-6 md:space-x-10">
        <Link className="text-xs font-bold md:text-sm" href="/docs">
          {" "}
          Docs
        </Link>

        <Link className="text-xs font-bold md:text-sm" href="/blog">
          {" "}
          Blog
        </Link>
        <button
          onClick={learnMoreClick}
          className="z-20 hidden px-6 py-3 text-sm font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 md:block active:bg-orange-800"
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}
