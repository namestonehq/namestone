import React from "react";
import namestoneLogo from "../public/images/namestone-logo.svg";
import Image from "next/image";
import Link from "next/link";

export default function NameStoneLogo() {
  return (
    <Link href="/">
      <Image
        className="h-[30px] mr-1  my-auto"
        priority
        src={namestoneLogo}
        alt="Forging Commmunity Identity"
      />
    </Link>
  );
}
