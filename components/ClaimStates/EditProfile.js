import React from "react";
import Image from "next/image";
import Button from "../Button";
import iconTwitterBrown from "../../public/images/logo-twitter-brown.svg";
import iconDiscordBrown from "../../public/images/logo-discord-brown.svg";
import iconGlobeBrown from "../../public/images/icon-globe-brown.svg";
import iconLocationBrown from "../../public/images/icon-location-brown.svg";
import { defaultAvatar } from "../../utils/data/Variables";
import { Icon } from "@iconify/react";
import { Popover, Dialog } from "@headlessui/react";
import LoadingGif from "../../public/images/load-loading.gif";

import { useContext, useState, useEffect, useRef } from "react";
import { ClaimContext } from "../../contexts/ClaimContext";
import LoadingSpinner from "../LoadingSpinner";

export default function EditProfile({ brand, setClaimState }) {
  const { congratsPending, userSubdomain, setFetchUserSubdomain } =
    useContext(ClaimContext);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [selectNFTOpen, setSelectNFTOpen] = useState(false);
  const [imageUploadPending, setImageUploadPending] = useState(false);

  const fileInput = useRef(null);

  //set text values on load
  useEffect(() => {
    if (userSubdomain && userSubdomain.textRecords) {
      if (userSubdomain.textRecords["avatar"]) {
        setAvatar(userSubdomain.textRecords["avatar"]);
      }
      if (userSubdomain.textRecords["com.twitter"]) {
        setTwitter(userSubdomain.textRecords["com.twitter"]);
      }
      if (userSubdomain.textRecords["com.discord"]) {
        setDiscord(userSubdomain.textRecords["com.discord"]);
      }

      if (userSubdomain.textRecords.location) {
        setLocation(userSubdomain.textRecords.location);
      }
      if (userSubdomain.textRecords.url) {
        setWebsite(userSubdomain.textRecords.url);
      }
    }
  }, [userSubdomain]);

  function saveChanges() {
    fetch("/api/save-text-records", {
      method: "POST",
      body: JSON.stringify({
        domain: brand.domain,
        textRecords: {
          avatar: avatar,
          "com.twitter": twitter,
          "com.discord": discord,
          location: location,
          url: website,
          description: brand.default_description,
        },
      }),
    }).then((res) => {
      res.json().then((json) => {
        if (res.status === 200) {
          setFetchUserSubdomain((prev) => prev + 1);
          if (congratsPending) {
            setClaimState("claim_success");
          } else {
            setClaimState("changes_saved");
          }
        } else {
          console.log(json);
          setClaimState("check_eligibility");
        }
      });
    });
  }

  function onImageUpload(event) {
    const file = event.target.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      setImageUploadPending(true);
      fetch("/api/get-upload-url")
        .then((response) => response.json())
        .then((data) => {
          const uploadURL = data.uploadUrl;
          fetch(uploadURL, {
            method: "POST",
            body: formData,
          }).then((response) => {
            if (response.ok) {
              response.json().then((json) => {
                if (json.result?.variants.length > 0) {
                  setAvatar(json.result.variants[0]);
                  setImageUploadPending(false);
                }
                setImageUploadPending(false);
              });
            } else {
              console.error("Error uploading file:", response.statusText);
            }
          });
        })
        .catch((error) => {
          setImageUploadPending(false);
          console.error("Error uploading file:", error);
        });
    }
  }

  return (
    <>
      <div className="flex flex-col mt-4 font-bold text-md text-brownblack-700">
        {congratsPending && (
          <>
            <span className="mb-1 text-center text-md">Create Profile</span>
          </>
        )}
      </div>
      <div className="relative">
        <div className="flex items-center mt-5 mb-4 justify-center overflow-hidden rounded-full ring-4 ring-orange-500/[0.5] w-24 h-24">
          {imageUploadPending && <LoadingSpinner className="w-8 h-8" />}
          {!imageUploadPending && (
            <Image src={avatar} width={100} height={100} alt="Your avatar" />
          )}
        </div>
        {/* hidden input for storing image */}
        <input
          type="file"
          name="file"
          className="hidden"
          ref={fileInput}
          onChange={onImageUpload}
        />
        <NFTSelectDialog
          showModal={selectNFTOpen}
          setShowModal={setSelectNFTOpen}
          setAvatar={setAvatar}
        />
        <Popover>
          {({ open }) => (
            <>
              <Popover.Button
                className={`absolute bottom-[12px] right-[-4px] cursor-pointer w-6 h-6 bg-white rounded-full hover:bg-orange-400 z-10 flex justify-center items-center ${
                  open ? "bg-orange-400" : ""
                }`}
              >
                <Icon icon="clarity:edit-solid" className="w-[14px] h-[14px]" />
              </Popover.Button>
              <Popover.Panel className="absolute mt-[-6px] z-10 flex flex-col py-2 bg-white rounded-xl w-[230px] left-[-66%] shadow-md">
                <Popover.Button
                  onClick={() => {
                    fileInput.current.click();
                  }}
                  className="px-4 py-2 text-sm text-left cursor-pointer text-brownblack-700 hover:bg-brownblack-20"
                >
                  Upload Image
                </Popover.Button>
                <Popover.Button
                  onClick={() => setSelectNFTOpen(true)}
                  className="px-4 py-2 text-sm text-left cursor-pointer text-brownblack-700 hover:bg-brownblack-20"
                >
                  Select NFT
                </Popover.Button>
                <Popover.Button
                  onClick={() => setAvatar(brand.default_avatar)}
                  className="px-4 py-2 text-sm text-left text-red-500 cursor-pointer hover:bg-brownblack-20"
                >
                  Remove
                </Popover.Button>
              </Popover.Panel>
            </>
          )}
        </Popover>
      </div>
      <div className="flex items-start text-base font-bold text-brownblack-700">
        {userSubdomain?.name}.{userSubdomain?.domain}
      </div>
      <div className="flex items-start text-sm font-bold text-brownblack-500">
        {brand.default_description}
      </div>{" "}
      <div className="w-full max-w-md mt-4 mb-3 text-sm font-bold text-left text-brownblack-500">
        Socials
      </div>
      <WhiteInput
        labelText="Twitter"
        placeholderText="@superslobo"
        icon={iconTwitterBrown}
        value={twitter}
        onChange={(e) => setTwitter(e.target.value)}
      />
      <WhiteInput
        labelText="Discord"
        placeholderText="fancyname#1234"
        icon={iconDiscordBrown}
        value={discord}
        onChange={(e) => setDiscord(e.target.value)}
      />
      <div className="w-full max-w-md mb-3 text-sm font-bold text-left text-brownblack-500">
        Location
      </div>
      <WhiteInput
        labelText="Location"
        placeholderText="chicago"
        icon={iconLocationBrown}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <div className="w-full max-w-md mb-3 text-sm font-bold text-left text-brownblack-500">
        Website
      </div>
      <WhiteInput
        labelText="Website"
        placeholderText="www.nftychat.xyz"
        icon={iconGlobeBrown}
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <div className="w-full max-w-md mb-3 text-sm font-bold text-left text-brownblack-500">
        Expires
      </div>
      {userSubdomain?.domain !== "80fierce.eth" && (
        <div className="w-full max-w-md mb-3 text-sm text-left text-brownblack-500">
          May 31, 2024
        </div>
      )}
      {userSubdomain?.domain === "80fierce.eth" && (
        <div className="w-full max-w-md mb-3 text-sm text-left text-brownblack-500">
          September 6, 2024
        </div>
      )}
      <div className="flex flex-row gap-6 mt-4">
        {!congratsPending && (
          <Button
            onClick={() => setClaimState("claim_success")}
            className=""
            buttonText="Back"
            color="brownblack"
          />
        )}

        <Button
          onClick={() => saveChanges()}
          buttonText={congratsPending ? "Complete" : "Save"}
        />
      </div>
      <div className="w-full max-w-md mt-4 text-xs text-center text-brownblack-400">
        Profile changes are gasless.
      </div>
    </>
  );
}

function WhiteInput({ labelText, placeholderText, icon, value, onChange }) {
  return (
    <div className="flex flex-col items-start w-full max-w-md mb-4">
      <input
        type="text"
        id={labelText.toLowerCase()}
        placeholder={placeholderText}
        className="w-full h-12 p-4 pl-12 rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
        value={value}
        onChange={onChange}
      />
      <div className="absolute pl-4 my-4">
        <Image
          src={icon}
          alt={labelText}
          width={20}
          height={20}
          className="my-auto"
        />
      </div>
    </div>
  );
}

function NFTSelectDialog({ showModal, setShowModal, setAvatar }) {
  const [walletNFTs, setWalletNFTs] = useState([]);
  const [searchedNFTs, setSearchedNFTs] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [NFTsLoading, setNFTsLoading] = useState(false);
  // useEffect to get nfts on load
  useEffect(() => {
    if (!showModal) return;
    if (walletNFTs.length > 0) return;
    setNFTsLoading(true);
  }, [showModal, walletNFTs]);

  // useEffect to filter nfts on search
  useEffect(() => {
    if (searchText === "") {
      setSearchedNFTs(walletNFTs);
    } else {
      setSearchedNFTs(
        walletNFTs.filter(
          (nft) =>
            nft.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            nft.description?.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, walletNFTs]);

  return (
    <Dialog
      className="relative z-50"
      open={showModal}
      onClose={() => setShowModal(false)}
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-[348px] px-6 py-4 bg-white rounded-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-base font-bold text-brownblack-700">
              Select NFT
            </Dialog.Title>
            <Icon
              icon="ph:x-bold"
              className="w-5 h-5 cursor-pointer text-brownblack-700"
              onClick={() => setShowModal(false)}
            />
          </div>
          <input
            className="px-5 py-4 mb-3 border rounded-lg border-1  focus:ring focus:ring-orange-400/[0.5] focus:outline-none border-brownblack-50"
            type="text"
            placeholder="Search by token ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {NFTsLoading && (
            <div className="flex items-center justify-center w-full h-[420px]">
              <Image src={LoadingGif} alt="loading" className="w-8 h-8" />
            </div>
          )}
          {searchedNFTs.length === 0 && !NFTsLoading && (
            <div className="flex items-center justify-center w-full h-[420px]">
              <div className="text-xs text-brownblack-400">
                No NFTs Available
              </div>
            </div>
          )}
          {searchedNFTs.length > 0 && !NFTsLoading && (
            <div className="grid grid-cols-3 gap-2 overflow-scroll h-[420px] content-start">
              {searchedNFTs.map((nft) => (
                <div
                  key={nft.nft_id}
                  onClick={() => {
                    setAvatar(nft.image_url);
                    setShowModal(false);
                  }}
                  className="relative flex flex-col items-start justify-start w-full cursor-pointer overflow-ellipsis h-fit"
                >
                  {/* cover for image that shows up when not hovered */}
                  <div className="absolute inset-0  w-[90px] h-[90px] transition-opacity duration-300 ease-in-out bg-white rounded-md opacity-30 hover:opacity-0" />
                  <Image
                    src={nft?.previews?.image_small_url}
                    width={90}
                    height={90}
                    alt={nft.name}
                    className="flex items-center justify-center w-[90px] h-[90px] mb-2 rounded-md overflow-hidden"
                  />
                  <div className="w-full px-1 overflow-hidden text-xs text-brownblack-700 overflow-ellipsis whitespace-nowrap">
                    {nft.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
