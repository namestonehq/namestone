import React from "react";
import { Dialog } from "@headlessui/react";
import { Icon } from "@iconify/react";

export default function OwnershipRequiredModal({ isOpen, onClose }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative z-10 w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-bold text-gray-900">
              Ownership Required
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <Icon icon="ph:x" className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 text-sm text-gray-500">
            <p className="mb-4">
              This wallet <b>does not</b> own this domain.
            </p>
            <p>
              Please connect with the wallet that owns the domain and try again.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-orange-500 rounded-md text-neutral-900 hover:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
