/**
 * StylishVerticalDivider component that displays a vertical divider on the Try for Free page.
 * @returns {JSX.Element} The StylishVerticalDivider component
 */
import React from "react";

export const StylishVerticalDivider = () => {
    return (
        <div className="hidden lg:flex fixed left-1/2 transform -translate-x-[274px] h-[calc(100vh-60px)] z-20 flex-col justify-between">
            {/* First zigzag wrapper - positioned at the top */}
            <div className="flex flex-col items-center">
                {/* Box with only right border */}
                <div className="w-[28px] h-[30px] bg-[#FAFAFA] border-r-2 border-r-[#DDDDDD]"></div>
                {/* First zigzag - right pointing triangle with border */}
                <div className="relative">
                    <div className="w-0 h-0 border-t-[28px] border-t-[#FAFAFA] border-r-[28px] border-r-transparent"></div>
                    {/* Diagonal border for the triangle */}
                    <div className="absolute top-0 right-0 w-[40px] h-[2px] bg-[#DDDDDD] transform -rotate-45 origin-top-right"></div>
                </div>
            </div>
            
            {/* Empty flex spacer to push content to top and bottom */}
            <div className="flex-grow"></div>
            
            {/* Second zigzag and box wrapper - positioned at the bottom */}
            <div className="flex flex-col items-end">
                {/* Second zigzag - left to right, top to bottom triangle with border */}
                <div className="relative">
                    <div className="w-0 h-0 border-t-[28px] border-t-transparent border-l-[28px] border-l-[#FAFAFA]"></div>
                    {/* Diagonal border for the triangle */}
                    <div className="absolute top-0 left-0 w-[40px] h-[2px] bg-[#DDDDDD] transform rotate-45 origin-top-left"></div>
                </div>
                
                {/* Box with only right border */}
                <div className="w-[28px] h-[60px] bg-[#FAFAFA] border-r-2 border-r-[#DDDDDD]"></div>
            </div>
        </div>
    );
};


