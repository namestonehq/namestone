import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import placeholderImage from "../../../public/images/placeholder-icon-image.png";
import { ensFontFallback } from "../../../utils/FrontUtils";

const isValidImageUrl = (url) => {
  if (!url) return false;
  try {
    return (
      typeof url === "string" &&
      (url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:image/"))
    );
  } catch (e) {
    return false;
  }
};

export default function NameSelector({
  mainnetDomains = [],
  sepoliaDomains = [],
  selectedDomain,
  onSelectDomain,
  onEditDomain,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Mainnet");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (domain) => {
    onSelectDomain(domain);
    setIsOpen(false);
  };

  const handleEdit = (e, domain) => {
    e.stopPropagation();
    onEditDomain(domain);
  };

  return (
    <div
      className="relative w-full sm:hidden border-b border-gray-300"
      ref={dropdownRef}
    >
      {/* Selected domain display */}
      <div
        className="flex items-center justify-between p-2 bg-white rounded-md cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="px-4">
          <Icon
            icon={isOpen ? "heroicons:chevron-up" : "heroicons:chevron-down"}
            className="w-5 h-5 mr-2 text-gray-500"
          />
        </div>
        <span className="font-medium" style={{ fontFamily: ensFontFallback }}>
          {selectedDomain
            ? `${selectedDomain.name} (${selectedDomain.network})`
            : "Select a domain"}
        </span>
        <div className="flex items-center">
          <div className="bg-gray-300 my-auto h-6 w-px"></div>
          {selectedDomain && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditDomain(selectedDomain);
              }}
              className="p-1 text-gray-500 transition-colors hover:text-gray-700 px-4"
            >
              <Icon icon="heroicons:pencil-square" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-300">
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "Mainnet"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("Mainnet")}
            >
              Mainnet
            </button>
            <button
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === "Sepolia"
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("Sepolia")}
            >
              Sepolia
            </button>
          </div>

          {/* Domain list */}
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {activeTab} Names
            </div>
            <div className="max-h-60 overflow-y-auto">
              {(activeTab === "Mainnet" ? mainnetDomains : sepoliaDomains).map(
                (domain) => (
                  <div
                    key={domain.url_slug}
                    className={`flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer ${
                      selectedDomain?.url_slug === domain.url_slug
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onClick={() => handleSelect(domain)}
                  >
                    <div className="flex items-center">
                      <div className="relative flex items-center justify-center w-6 h-6 mr-2">
                        {domain.hasResolverIssue ? (
                          <div
                            className={`absolute w-2 h-2 rounded-full ${
                              domain.resolverStatus === "incorrect"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            } right-0 bottom-0`}
                          ></div>
                        ) : null}
                        <div className="overflow-hidden rounded-full w-6 h-6">
                          <Image
                            src={
                              isValidImageUrl(domain.avatar)
                                ? domain.avatar
                                : placeholderImage
                            }
                            width={24}
                            height={24}
                            alt={domain.name}
                          />
                        </div>
                      </div>
                      <span
                        className="text-sm"
                        style={{ fontFamily: ensFontFallback }}
                      >
                        {domain.name}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
