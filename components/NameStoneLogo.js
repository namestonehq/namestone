import React from "react";
import namestoneLogo from "../public/images/namestone-icon.svg";
import Image from "next/image";
import Link from "next/link";

export default function NameStoneLogo() {
  return (
    <Link href="/" className="flex items-center text-2xl font-bold">
      <Image
        className="h-[30px] mr-1  my-auto"
        priority
        src={namestoneLogo}
        alt="Forging Commmunity Identity"
      />
      <span className={`mr-1 text-white `}> NameStone </span>
    </Link>
  );
}
