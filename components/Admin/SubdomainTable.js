import React from "react";
import Link from "next/link";
import { shortenAddress } from "../../utils/FrontUtils";
import { Dialog } from "@headlessui/react";
import { useState } from "react";

export default function SubdomainTable({
  subdomains,
  admin,
  deleteName,
  openEditNameModal,
}) {
  const [showModal, setShowModal] = useState(null);

  return (
    <>
      <Dialog
        className="relative z-50"
        open={showModal !== null}
        onClose={() => setShowModal(null)}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm px-6 py-4 bg-white rounded-xl">
            <Dialog.Title className="text-base font-bold text-brownblack-700">
              Are you sure?
            </Dialog.Title>
            <Dialog.Description className="mt-4 text-left">
              This will remove{" "}
              <span className="font-bold">
                {showModal?.name}.{showModal?.domain}
              </span>{" "}
              from{" "}
              <span className="font-bold">
                {shortenAddress(showModal?.address || "")}
              </span>{" "}
              and they will have to claim a new subdomain.
            </Dialog.Description>
            <div className="flex mt-6 items-left">
              <button
                className="px-6 py-2 mr-6 rounded-lg outline outline-1 outline-brownblack-100 text-brownblack-700 hover:bg-brownblack-20"
                onClick={() => setShowModal(null)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                onClick={() => {
                  deleteName(showModal.name);
                  setShowModal(null);
                }}
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="w-full h-full overflow-x-auto border rounded-lg border-1 border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className=" bg-neutral-100">
              <th className="px-6 py-3 text-left ">
                <span className="text-sm font-bold text-brownblack-700">
                  Subname
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
