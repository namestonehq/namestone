import React from "react";
import XIcon from "../public/images/x-icon.png";
import SuccessIcon from "../public/images/success-icon.png";
import LoadingGif from "../public/images/load-loading.gif";
import Image from "next/image";

export default function EligibilityItem({ eligibilityItemText, status }) {
  return (
    <div className="flex items-center justify-between w-full h-12 max-w-md px-4 bg-white rounded-lg mt-4">
      <div className="flex gap-4">
        <span className="text-sm">{eligibilityItemText}</span>
      </div>
      <div
        className={`w-5 h-5 border-2 border-brownblack-200 rounded-full opacity-70 ${
          status === "success"
            ? "border-hidden"
            : status === "fail"
            ? "border-hidden"
            : status === "pending"
            ? "bg-orange-300"
            : "bg-white"
        }`}
      >
        {status === "fail" && <Image src={XIcon} alt="X" className="w-5 h-5" />}
        {status === "success" && (
          <Image
            src={SuccessIcon}
            alt="success"
            height={20}
            className="w-5 h-5"
          />
        )}
        {status === "pending" && (
          <Image src={LoadingGif} alt="loading" className="w-5 h-5" />
        )}
      </div>
    </div>
  );
}
