import React from "react";
import Image from "next/image";
import namestoneLogoWhite from "../public/images/namestone-logo-white.svg";
import logoXWhite from "../public/images/logo-x-white.svg";
import logoGithubWhite from "../public/images/logo-github-white.svg";
import ensLogo from "../public/images/logo-ens.svg";
import divider from "../public/images/divider-black-orangespot.svg";

import Link from "next/link";

export default function Footer() {
  return (
    <div className="w-full px-6 py-12 bg-neutral-900 lg:px-32">
      <Image src={divider} alt="divider" />
      <div className="mx-auto mt-8 max-w-7xl">
        <div className="flex flex-col items-start justify-between lg:flex-row">
          {/* Logo and Built with ENS section */}
          <div className="flex items-center mb-8 space-x-2 lg:mb-0">
            <Image src={namestoneLogoWhite} alt="NameStone Logo" />
          </div>

          {/* Navigation Sections */}
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
            {/* Products Section */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Products</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/api"
                    className="text-neutral-400 hover:text-white"
                  >
                    NameStone API
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://durin.dev/"
                    className="text-neutral-400 hover:text-white"
                    target="_blank"
                  >
                    Durin
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://enspro.xyz/"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                    target="_blank"
                  >
                    ENSPro
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </div>

            {/* Docs Section */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Docs</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/docs/sdk-quickstart"
                    className="text-neutral-400 hover:text-white"
                  >
                    SDK Quickstart
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/api-routes"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    API
                  </Link>
                </li>

                <li>
                  <Link
                    href="/docs/gasless-dns"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Gasless DNS
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/blog"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact-us"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/tos"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy-policy"
                    className="transition-colors duration-300 text-neutral-400 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Section */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Social</h3>
              <div className="flex space-x-4">
                <Link
                  href="https://x.com/namestonehq"
                  target="_blank"
                  className="text-neutral-400 hover:text-white"
                >
                  <Image
                    src={logoXWhite}
                    alt="X"
                    className="transition-opacity duration-300 opacity-60 hover:opacity-100"
                  />
                </Link>
                <Link
                  href="https://github.com/namestonehq"
                  className="text-neutral-400 hover:text-white"
                  target="_blank"
                >
                  <Image
                    src={logoGithubWhite}
                    alt="Github"
                    className="transition-opacity duration-300 opacity-60 hover:opacity-100"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
