import { Dialog } from "@headlessui/react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Delete",
}) {
  return (
    <Dialog className="relative z-50" open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm px-6 py-4 bg-white rounded-xl">
          <Dialog.Title className="text-base font-bold text-brownblack-700">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-4 text-left">
            {children}
          </Dialog.Description>
          <div className="flex mt-6 items-left">
            <button
              className="px-6 py-2 mr-6 rounded-lg outline outline-1 outline-brownblack-100 text-brownblack-700 hover:bg-brownblack-20"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
