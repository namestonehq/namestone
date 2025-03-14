import React from "react";
import Image from "next/image";
import sideMenuSvg from "../../public/images/try-for-free-side-menu.svg";
import sideMenuPng from "../../public/images/try-for-free-side-menu.png";
import keyIcon from "../../public/images/try-for-free-key-icon.svg";
import scriptIcon from "../../public/images/try-for-free-script-icon-non-filled.svg";
import scriptIconFilled from "../../public/images/try-for-free-script-icon-filled.svg";
import { FormState } from "./formStates";


/**
 * SidePanel component that displays the left sidebar on the Try for Free page.
 * Shows a key icon and script icon with connecting line to illustrate the setup flow.
 * @param {Object} props Component props
 * @param {FormState} props.formState Whether the API key has been sent
 * @returns {JSX.Element} The SidePanel component
 */
export const SidePanel = ({ formState }) => {
    return (
      <div className="hidden lg:block w-[494px] fixed left-1/2 transform -translate-x-[768px] h-[calc(100vh-60px)] z-10">
        <div className="relative w-full h-full">
          <Image 
            src={sideMenuSvg} 
            alt="Side Menu" 
            className="absolute top-0 left-0 w-full h-full object-cover"
            priority
          />

          <div className="relative z-10 flex flex-col items-start p-12 pt-16 text-left">            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-6">Get Started</h2>
              
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 relative">
                {/* Connecting line that spans from first icon to second icon */}
                <div className="absolute left-[26px] top-[45px] w-[2px] h-[48px] bg-neutral-300 z-0"></div>
                
                {/* First Row - Key Icon and Text */}
                <div className="flex justify-center items-start">
                  <Image
                    src={keyIcon}
                    alt="Key Icon"
                    width={52}
                    height={52}
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Get a key</h3>
                  <p className="text-sm text-neutral-600">Configure domain and receive a key</p>
                </div>
                
                {/* Second Row - Empty space for the line */}
                <div className="h-[30px]"></div>
                <div></div> {/* Empty cell */}
                
                {/* Third Row - Script Icon and Text */}
                <div className="flex justify-center items-start">
                  <div className="transition-all duration-300 ease-in-out">
                    <Image
                      src={formState === FormState.API_KEY_SENT ? scriptIconFilled : scriptIcon}
                      alt="Script Icon"
                      width={formState === FormState.API_KEY_SENT ? 52 : 40}
                      height={formState === FormState.API_KEY_SENT ? 52 : 40}
                    />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Create a subname</h3>
                  <p className="text-sm text-neutral-600">Use your key to make a subname</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };