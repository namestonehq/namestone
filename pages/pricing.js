import React from "react";
import Footer from "../components/Footer";
import NameStoneLogo from "../components/NameStoneLogo";
import { useRouter } from "next/router";
import Image from "next/image";
import SuccessIcon from "../public/images/success-icon.png";
import { Icon } from "@iconify/react";
import ensLogo from "../public/images/logo-ens-brown.png";

export default function Pricing() {
  const router = useRouter();
  function contactUsClick() {
    router.push("/contact-us");
  }

  return (
    <div>
      <div className="fixed z-40 flex justify-between w-full px-8 py-4 backdrop-blur-sm md:px-20">
        <div className="flex items-center">
          <NameStoneLogo />
        </div>
        <button
          onClick={contactUsClick}
          className="z-20 hidden px-6 py-3 text-sm font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 md:block active:bg-orange-800"
        >
          Contact Us
        </button>
      </div>
      <div className=" px-20 pt-[130px] pb-16 bg-white flex-col justify-center items-center gap-10 flex">
        <div className="h-[98px] flex-col justify-center items-center gap-3 flex">
          <div className=" text-center text-stone-950 text-[48px] font-bold">
            Pricing
          </div>
          <div className="w-[635px] text-center text-stone-950 text-[20px] font-normal leading-7">
            We offer solutions for a variety of community sizes.
          </div>
        </div>
        <div className=" h-[50px] flex-col justify-start items-center gap-10 flex">
          <button
            onClick={contactUsClick}
            className="z-20 hidden px-8 py-3 text-sm font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 md:block active:bg-orange-800"
          >
            Contact Us
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-center rounded-lg ">
          <div className="flex-col items-start justify-start gap-8 py-6 ">
            {/* 250 names */}
            <div className=" h-[19px] px-4 flex-col justify-center items-start gap-2 flex">
              <div className="text-center text-orange-600 text-[16px] font-bold">
                250 Names
              </div>
            </div>
            <div className="mt-8 px-4 justify-start items-end gap-1.5 inline-flex">
              <div className="text-center text-stone-950 text-[32px] font-bold leading-7">
                $500
              </div>
              <div className="text-center text-stone-600 text-[16px] font-normal">
                /year
              </div>
            </div>
            <div className="mt-8 h-[190px] px-4 flex-col justify-start items-center gap-6 flex">
              <div className=" h-[190px] py-1 flex-col justify-start items-start gap-4 flex">
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    1 domain
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    250 names
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="grow shrink basis-0 text-stone-600 text-[14px] font-normal">
                    $2.00 per additional name
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Turnkey setup
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 1,000 names */}
          <div className=" flex-col items-start justify-start gap-8 py-6 border-l-[1px] border-stone-200 h-[280px]">
            <div className="h-[19px] px-4 flex-col justify-start items-start gap-2 flex">
              <div className="text-center text-orange-600 text-[16px] font-bold">
                1,000 Names
              </div>
            </div>
            <div className="mt-8 px-4 justify-start items-end gap-1.5 inline-flex">
              <div className="text-center text-stone-950 text-[32px] font-bold leading-7">
                $1.5k
              </div>
              <div className="text-center text-stone-600 text-[16px] font-normal">
                /year
              </div>
            </div>
            <div className="mt-8 h-[190px] px-4 flex-col justify-start items-start flex">
              <div className="h-[190px] py-1 flex-col justify-start items-start gap-4 flex">
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    3 domains
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    1,000 names
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="grow shrink basis-0 text-stone-600 text-[14px] font-normal">
                    $1.50 per additional name
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Turnkey setup
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5,000 names */}
          <div className="flex-col items-start justify-start gap-8 py-6 border-l-[1px] border-stone-200 h-[280px]">
            <div className="h-[19px] px-4 flex-col justify-start items-start gap-2 flex">
              <div className="text-orange-600 text-[16px] font-bold">
                5,000 Names
              </div>
            </div>
            <div className="mt-8 px-4 justify-start items-end gap-1.5 inline-flex">
              <div className="text-center text-stone-950 text-[32px] font-bold leading-7">
                $5k
              </div>
              <div className="text-center text-stone-600 text-[16px] font-normal">
                /year
              </div>
            </div>
            <div className="mt-8 h-[190px] px-4 flex-col justify-start items-center gap-6 flex">
              <div className=" h-[190px] py-1 flex-col justify-start items-start gap-4 flex">
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    10 domains
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    5,000 names
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="grow shrink basis-0 text-stone-600 text-[14px] font-normal">
                    $1.00 per additional name
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Turnkey setup
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ENTERPRISE */}
          <div className="flex-col items-start justify-start gap-8 py-6 border-l-[1px] border-stone-200 h-[280px]">
            <div className="h-[19px] px-4 flex-col justify-start items-start gap-2 flex">
              <div className=" text-orange-600 text-[16px] font-bold">
                Enterprise
              </div>
            </div>
            <div className="mt-8 px-4 justify-start items-end gap-1.5 inline-flex">
              <div className="text-center text-stone-950 text-[32px] font-bold leading-7">
                Custom
              </div>
            </div>

            <div className=" mt-8 h-[190px] px-4 flex-col justify-start items-start flex">
              <div className=" h-[190px] py-1 flex-col justify-start items-start gap-4 flex">
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-bold">
                    API Access
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Unlimited domains
                  </div>
                </div>
                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Unlimited names
                  </div>
                </div>

                <div className="inline-flex items-center justify-start gap-2">
                  <Image
                    src={SuccessIcon}
                    alt="success"
                    height={16}
                    className="w-4 h-4"
                  />
                  <div className="w-[165px] text-stone-600 text-[14px] font-normal">
                    Custom setup
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-col items-center justify-center w-full gap-16 px-48 pt-16 pb-32 bg-orange-50">
        <div className="self-stretch text-center text-stone-950 text-[32px] font-bold mb-16">
          All solutions come with the following
        </div>
        <div className="flex items-start self-stretch justify-center gap-16">
          <div className="inline-flex flex-col items-start justify-center gap-4 ">
            <div className="w-16 h-16 bg-gradient-to-l from-orange-400 to-red-500 rounded-[120px] justify-center items-center gap-2.5 inline-flex">
              <Icon icon="mdi:present-outline" className="w-10 h-10" />
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-bold">
              Custom Claim Flow
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-normal">
              Take advantage of our branded claim flow. Set custom requirements
              like NFTs, POAPs, and allowlists.
            </div>
          </div>

          <div className="inline-flex flex-col items-start justify-center gap-4 ">
            <div className="w-16 h-16 bg-gradient-to-l from-orange-400 to-red-500 rounded-[120px] justify-center items-center gap-2.5 inline-flex">
              <Icon
                icon="eos-icons:cluster-management-outlined"
                className="w-10 h-10"
              />
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-bold">
              Admin Management Panel
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-normal">
              Manage all community names in one place. Edit, delete, revoke and
              block names.{" "}
            </div>
          </div>
        </div>

        <div className="flex items-start self-stretch justify-center gap-16 mt-16">
          <div className="inline-flex flex-col items-start justify-center gap-4 ">
            <div className="w-16 h-16 bg-gradient-to-l from-orange-400 to-red-500 rounded-[120px] justify-center items-center gap-2.5 inline-flex">
              <Icon
                icon="fluent:people-community-32-regular"
                className="w-10 h-10"
              />
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-bold">
              Community Directory
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-normal">
              All claimed names in one place. Users can view text records and
              connect with each other through Discord, Twitter, and more.{" "}
            </div>
          </div>
          <div className="inline-flex flex-col items-start justify-center gap-4 ">
            <div className="w-16 h-16 bg-gradient-to-l from-orange-400 to-red-500 rounded-[120px] justify-center items-center gap-2.5 inline-flex">
              <Image
                className="h-[40px] w-[40px]"
                src={ensLogo}
                width={40}
                height={40}
                alt="ens logo"
              />
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-bold">
              Expert Support
            </div>
            <div className="self-stretch text-stone-950 text-[20px] font-normal">
              Co-founders Alex Slobodnik and Darian Bailey bring deep ENS and
              building expertise to assist you.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
