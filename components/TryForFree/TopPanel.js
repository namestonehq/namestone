import React from "react";
import Image from "next/image";
import sideMenuSvg from "../../public/images/try-for-free-side-menu.svg";
// import keyIcon from "../../public/images/try-for-free-key-icon.svg";
import keyIcon from "../../public/images/try-for-free-key-2.png";

import scriptIcon from "../../public/images/try-for-free-script-icon-non-filled.svg";
import scriptIconFilled from "../../public/images/try-for-free-script-icon-filled.svg";
import { FormState } from "./formStates";

/**
 * TopPanel component that displays the top section on the Try for Free page for mobile devices.
 * Shows a key icon and script icon with connecting line to illustrate the setup flow.
 * This is the mobile version of the SidePanel component.
 * @param {Object} props Component props
 * @param {FormState} props.formState Whether the API key has been sent
 * @returns {JSX.Element} The TopPanel component
 */
export const TopPanel = ({ formState }) => {
  return (
    <div className="lg:hidden w-full relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image 
          src={sideMenuSvg} 
          alt="Background" 
          className="object-cover w-full h-full"
          priority
        />
      </div>
        
      {/* Content */}
      <div className="relative z-10 max-w-md p-6 pb-10">
        <h2 className="text-lg font-semibold mb-6">Get Started</h2>

        <div className="space-y-6">
          {/* First Step */}
          <div className="flex">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-white">
                <Image 
                  src={keyIcon} 
                  alt="Key Icon" 
                />
              </div>
              {/* Connecting line */}
              <div className="absolute top-10 left-1/2 w-0.5 h-14 bg-gray-300 -translate-x-1/2"></div>
            </div>

            <div className="ml-4">
              <h3 className="font-medium">Get a key</h3>
              <p className="text-sm text-gray-600">
                Configure domain and receive a key
              </p>
            </div>
          </div>

          {/* Second Step */}
          <div className="flex">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-white transition-all duration-300 ease-in-out">
                <Image
                  src={
                    formState === FormState.API_KEY_SENT
                      ? scriptIconFilled
                      : scriptIcon
                  }
                  alt="Script Icon"
                  width={formState === FormState.API_KEY_SENT ? 48 : 32}
                  height={formState === FormState.API_KEY_SENT ? 48 : 32}
                />
              </div>
            </div>

            <div className="ml-4">
              <h3 className="font-medium">Create a subname</h3>
              <p className="text-sm text-gray-600">
                Use your key to make a subname
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Stylish Divider */}
      <div className="relative w-full h-[28px] mt-2">
               {/* Fancy divider */}
        <div className="flex w-full h-8">
          <div className="w-8 h-full"></div>
          <div className="w-0 h-0 border-l-[50px] border-l-transparent border-b-[50px] border-b-white"></div>
          <div className="flex-1 h-full bg-white"></div>
          <div className="w-0 h-0 border-b-[50px] border-b-white border-r-[50px] border-r-transparent"></div>
          <div className="w-8 h-full"></div>
        </div>
      </div>
    </div>
  );
};

export default TopPanel;
