import React from "react";
import Link from "next/link";
import { shortenAddress, ensFontFallback } from "../../utils/FrontUtils";
import { Dialog } from "@headlessui/react";
import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";

export default function SubdomainTable({
  subdomains,
  admin,
  deleteName,
  openEditNameModal,
}) {
  const [showModal, setShowModal] = useState(null);

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

      <div className="w-full h-full overflow-x-auto border rounded-lg border-1 border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className=" bg-neutral-100">
              <th className="px-6 py-3 text-left ">
                <span className="text-sm font-bold text-brownblack-700">
                  Name
                </span>
                <span className="pl-2 text-xs font-normal text-brownblack-700">
                  Total: {subdomains.length}
                </span>
              </th>
              <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                Address
              </th>

              {admin && (
                <th className="px-6 py-3 text-sm font-bold text-left text-brownblack-700">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {subdomains.map((subdomain, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <Link
                    href={`https://app.ens.domains/${subdomain.name}.${subdomain.domain}`}
                    className="underline "
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: ensFontFallback }}
                  >
                    {subdomain.name}.{subdomain.domain}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`https://etherscan.io/address/${subdomain.address}`}
                    className="underline "
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortenAddress(subdomain.address)}
                  </Link>
                </td>
                {admin && (
                  <td className="px-6 py-2">
                    <button
                      className="mr-4 text-orange-500 rounded-lg hover:underline"
                      onClick={() => openEditNameModal(index)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setShowModal({
                          name: subdomain.name,
                          domain: subdomain.domain,
                          address: subdomain.address,
                        })
                      }
                      className="text-red-600 rounded-lg hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
