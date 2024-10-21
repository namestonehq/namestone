import React from "react";
import avatarImage from "../public/images/default-avatar-brown.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "./Button";
import Image from "next/image";
import { ClaimContext } from "../contexts/ClaimContext";
import { useContext } from "react";

export default function CustomConnectButton() {
  const { userSubdomain } = useContext(ClaimContext);
  const [userAvatar, setUserAvatar] = React.useState("");
  React.useEffect(() => {
    if (userSubdomain) {
      if (userSubdomain.textRecords.avatar) {
        setUserAvatar(userSubdomain.textRecords.avatar);
      }
    }
  }, [userSubdomain]);
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const connected =
          mounted &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              // need to connect
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="px-6 cursor-pointer"
                    buttonText="Connect"
                  />
                );
              }
              // wrong chain
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    type="button"
                    buttonText="Wrong network"
                    className="px-6 cursor-pointer"
                  />
                );
              }

              // connected
              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="px-4 max-w-[300px] py-2 text-sm font-bold bg-white rounded-lg text-brownblack-700 flex items-center justify-center  transition-colors duration-300 ease-in-out hover:bg-orange-300 active:bg-orange-400"
                >
                  <Image
                    className="w-6 h-6 rounded-full sm:mr-2"
                    src={
                      account.ensAvatar
                        ? account.ensAvatar
                        : userAvatar
                        ? userAvatar
                        : avatarImage
                    }
                    width={24}
                    height={24}
                    alt="avatar"
                  />
                  <span className="hidden sm:block">
                    {account.ensName
                      ? account.ensName
                      : userSubdomain
                      ? userSubdomain.name + "." + userSubdomain.domain
                      : account.displayName}
                  </span>
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
