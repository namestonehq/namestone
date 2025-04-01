import React from "react";
import ConfirmationModal from "./ConfirmationModal";
import { shortenAddress, ensFontFallback } from "../../utils/FrontUtils";
export default function DeleteSubnameDialog({
  isOpen,
  onClose,
  onDelete,
  subname,
  domain,
  address,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => {
        onDelete(subname);
      }}
      title="Are you sure?"
    >
      This will remove{" "}
      <span className="font-bold" style={{ fontFamily: ensFontFallback }}>
        {subname}.{domain}
      </span>{" "}
      from{" "}
      <span className="font-bold">
        {shortenAddress(address || "")}
      </span>{" "}
      and they will have to claim a new subdomain.
    </ConfirmationModal>
  );
}
