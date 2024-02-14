import React from "react";
import Link from "next/link";
import { shortenAddress } from "../../utils/FrontUtils";
import { Dialog } from "@headlessui/react";
import { useState } from "react";
import Button from "../Button";

export default function SubdomainsTable({
  subdomains,
  setSubdomains,
  admin,
  openEditNameModal,
}) {
  const [showModal, setShowModal] = useState(null);

  function revokeName(fullSubdomain, address) {
    const lastIndex = fullSubdomain.lastIndexOf(".");
    const secondLastIndex = fullSubdomain
      .substring(0, lastIndex)
      .lastIndexOf(".");
    const name = fullSubdomain.substring(0, secondLastIndex);
    const domain = fullSubdomain.substring(secondLastIndex + 1);
    fetch("/api/admin/revoke-subdomain", {
      method: "POST",
      body: JSON.stringify({
        subdomain: {
          name: name,
          domain: domain,
          address: address,
        },
      }),
    }).then((res) => {
      if (res.status === 200) {
        setSubdomains(subdomains.filter((sub) => sub.name !== name));
      } else {
        res.json().then((data) => {
          console.log(data);
        });
      }
    });
  }
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
              <span className="font-bold">{showModal?.name}</span> from{" "}
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
                  revokeName(showModal.name, showModal.address);
                  setShowModal(null);
                }}
              >
                Revoke
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="w-full h-full overflow-x-auto border rounded-lg border-1 border-brownblack-50">
        <table className="min-w-full divide-y divide-brownblack-50">
          <thead>
            <tr>
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
          <tbody className="bg-white divide-y divide-brownblack-50">
            {subdomains.map((subdomain, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  {subdomain.name}.{subdomain.domain}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`https://etherscan.io/address/${subdomain.address}`}
                    className="underline "
                  >
                    {shortenAddress(subdomain.address)}
                  </Link>
                </td>
                {admin && (
                  <td className="px-6 py-2">
                    <button
                      className="mr-4 text-orange-500 rounded-lg hover:underline"
                      buttonText={"Edit"}
                      onClick={() =>
                        openEditNameModal(
                          subdomain.id,
                          subdomain.name,
                          subdomain.address
                        )
                      }
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setShowModal({
                          name: subdomain.name + "." + subdomain.domain,
                          address: subdomain.address,
                        })
                      }
                      className="text-red-600 rounded-lg hover:underline"
                    >
                      Revoke
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
