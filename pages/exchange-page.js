import React from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Image from "next/image";
import exchangeBanner from "../public/images/exchange-page-banner.png";
import clockFast from "../public/images/mdi_clock-fast.svg";
import moneyFalling from "../public/images/money-falling.svg";
import addressBook from "../public/images/ph_address-book.svg";
import chatsCircle from "../public/images/ph_chats-circle.svg";

export default function ExchangePage() {
  const router = useRouter();
  return (
    <div>
      <Header />
      <div className="flex flex-col items-center justify-center px-20 pt-32 bg-white">
        <div className="flex flex-col items-center justify-center gap-8 ">
          <div className="flex flex-col items-center justify-center gap-3 ">
            <div className="text-5xl font-bold text-center text-stone-950">
              Name the Wallet, Get Deposits
            </div>
            <div className="text-base font-normal leading-7 text-center text-stone-950">
              Simplify crypto deposits on centralized exchanges with branded
              subdomains.
            </div>
          </div>
          <button
            onClick={() => {
              router.push("/contact-us");
            }}
            className="px-10 py-4 text-base font-bold bg-orange-500 rounded-lg cursor-pointer hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
          >
            Contact Us
          </button>
        </div>
        <div className="pt-[69px] pb-10 bg-white rounded-[30px] justify-center items-center inline-flex">
          <Image
            className=""
            width={823}
            height={405}
            src={exchangeBanner}
            alt="placeholder"
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-8 px-20 py-16 bg-brownblack-20">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className=" text-center text-stone-950 text-[40px] font-bold">
            Transactions can get complex
          </div>
          <div className="text-base font-normal leading-7 text-center text-stone-950">
            The typical user journey for receiving money on a centralized
            exchange looks something like this:
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-8 ">
          <div className="max-w-[480px] px-5 py-2  bg-white rounded-[18px] justify-start items-center gap-[27px] inline-flex">
            <div className="text-sm font-normal text-center grow shrink basis-0 text-stone-950">
              Locate where to access wallet addresses on your centralized
              exchange app
            </div>
          </div>
          <div className="max-w-[480px] px-5 py-2  bg-white rounded-[18px] justify-start items-center gap-[27px] inline-flex">
            <div className="text-sm font-normal text-center grow shrink basis-0 text-stone-950">
              Find (or generate) one for the right currency on the right
              blockchain
            </div>
          </div>
          <div className="max-w-[480px] px-5 py-2   bg-white rounded-[18px] justify-start items-center gap-[27px] inline-flex">
            <div className="text-sm font-normal text-center grow shrink basis-0 text-stone-950">
              Copy the address exactly right, then double check the pasted
              address
            </div>
          </div>
          <div className="text-base font-bold text-center text-stone-950">
            Streamline the journey for easy-to-repeat deposits.
          </div>
        </div>
      </div>
      <div className="px-20 pt-20 pb-[104px] bg-white flex-col justify-center items-center gap-16 flex">
        <div className="self-stretch justify-center items-center gap-2.5 inline-flex">
          <div className="text-center grow shrink basis-0">
            <span className="text-stone-950 text-[40px] font-bold">
              A memorable name beats <br />
              copy and paste{" "}
            </span>
            <span className="text-orange-400 text-[40px] font-bold">
              every time
            </span>
          </div>
        </div>
        <div className="grid items-center self-stretch justify-center grid-cols-1 gap-16 md:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="inline-flex flex-col items-start justify-center gap-4 max-w-[520px]">
              <Image
                className="h-[80px] flex-shrink-0"
                src={clockFast}
                alt="NameStone Github"
              />
              <div className="text-base font-bold text-stone-950">
                Quick and easy transactions{" "}
              </div>
              <div className="self-stretch text-base font-normal text-stone-950">
                Reduce the fear of mistyping a long wallet address with a simple
                username.
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="inline-flex flex-col items-start justify-center gap-4 max-w-[520px]">
              <Image
                className="h-[80px] flex-shrink-0"
                src={moneyFalling}
                alt="NameStone Github"
              />
              <div className="self-stretch text-base font-bold text-stone-950">
                Save time sending money
              </div>
              <div className="self-stretch text-base font-normal text-stone-950">
                Let users spend their time doing more important things than
                triple checking an address is written correctly.{" "}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="inline-flex flex-col items-start justify-start gap-4 max-w-[520px]">
              <Image
                className="h-[80px] flex-shrink-0"
                src={addressBook}
                alt="NameStone Github"
              />
              <div className="self-stretch text-base font-bold text-stone-950">
                Facilitate address books
              </div>
              <div className="self-stretch text-base font-normal text-stone-950">
                Enable address books for saving the contacts that matter most.{" "}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="inline-flex flex-col items-start justify-center gap-4 max-w-[520px]">
              <Image
                className="h-[80px] flex-shrink-0"
                src={chatsCircle}
                alt="NameStone Github"
              />
              <div className="self-stretch text-base font-bold text-stone-950">
                A shareable name
              </div>
              <div className="self-stretch text-base font-normal text-stone-950">
                Give a name users can share with anyone. More sharing means more
                awareness of your brand.{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-start w-full px-16 text-center bg-brownblack-700">
        <div className="text-[32px] md:text-[40px] font-bold text-white mt-16">
          Ready to get started?{" "}
        </div>
        <div className="text-base text-center text-white ">
          Our team is standing by to answer your questions and find the <br />{" "}
          right solution for you
        </div>
        <button
          onClick={() => {
            router.push("/contact-us");
          }}
          className="px-10 py-4 mt-10 mb-8 text-base font-bold bg-orange-500 rounded-lg hover:bg-orange-700 text-brownblack-700 w-fit active:bg-orange-800"
        >
          Contact Us
        </button>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
