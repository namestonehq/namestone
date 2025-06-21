import React, { useState } from "react";
import Link from "next/link";
import {
  shortenAddress,
  ensFontFallback,
  formatNameCount,
} from "../../../utils/FrontUtils";
import ConfirmationModal from "../ConfirmationModal";
import pencilIcon from "../../../public/images/icon-pencil-fill.svg";
import Image from "next/image";

export default function MobileSubdomainList({
  subdomains,
  deleteName,
  openEditNameModal,
  totalNames,
}) {
  const [showModal, setShowModal] = useState(null);

  if (!subdomains || subdomains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-8 text-center border rounded-lg border-1 border-neutral-200">
        <span className="text-sm text-gray-500">No names found</span>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showModal !== null}
        onClose={() => setShowModal(null)}
        onConfirm={() => {
          deleteName(showModal.name);
          setShowModal(null);
        }}
        title="Are you sure?"
      >
        This will remove{" "}
        <span className="font-bold" style={{ fontFamily: ensFontFallback }}>
          {showModal?.name}.{showModal?.domain}
        </span>{" "}
        from{" "}
        <span className="font-bold">
          {shortenAddress(showModal?.address || "")}
        </span>{" "}
        and they will have to claim a new subdomain.
      </ConfirmationModal>

      <div className="w-full">
        <div className="text-base font-bold text-black bg-gray-100 py-2 px-4 border-t border-b border-neutral-200">
          Subname
          <span className="pl-2 text-xs font-normal text-brownblack-700">
            {formatNameCount(totalNames)}
          </span>
        </div>
        <div className="w-full overflow-hidden">
          {subdomains.map((subdomain, index) => (
            <div
              key={index}
              className="flex flex-col py-3 px-4 border-b border-neutral-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`https://app.ens.domains/${subdomain.name}.${subdomain.domain}`}
                    className="font-medium text-black"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: ensFontFallback }}
                  >
                    {subdomain.name}.{subdomain.domain}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">
                    <Link
                      href={`https://etherscan.io/address/${subdomain.address}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortenAddress(subdomain.address)}
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => openEditNameModal(index)}
                  className="text-gray-500"
                  aria-label="Edit subdomain"
                >
                  <Image src={pencilIcon} alt="pencil" className="w-8 h-8" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
