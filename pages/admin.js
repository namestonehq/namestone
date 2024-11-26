import React from "react";
import Image from "next/image";
import AuthContentContainer from "../components/Admin/AuthContentContainer";
import { useState, useEffect } from "react";
import Link from "next/link";
import SubdomainsTable from "../components/Admin/SubdomainTable";
import { useSession } from "next-auth/react";
import Button from "../components/Button";
import { Dialog } from "@headlessui/react";
import { ethers } from "ethers";
import placeholderImage from "../public/images/placeholder-icon-image.png";
import { Icon } from "@iconify/react";
import { normalize } from "viem/ens";

export default function Admin() {
  const { data: session, status: authStatus } = useSession();
  const [brandUrls, setBrandUrls] = useState([]);

  const [brandDict, setBrandDict] = useState({});
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [subdomains, setSubdomains] = useState([]);

  const [addNameModalOpen, setAddNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [nameErrorMsg, setNameErrorMsg] = useState("");
  const [addressErrorMsg, setAddressErrorMsg] = useState("");
  const [nameId, setNameId] = useState(null); // id of name to edit
  const [admins, setAdmins] = useState([]);
  const [domainId, setDomainId] = useState(null);
  const [saveSettingsDisabled, setSaveSettingsDisabled] = useState(true);
  const [saveSettingsPending, setSaveSettingsPending] = useState(false);
  const [apiKey, setApiKey] = useState("loading");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");
  //add or edit
  const [modalType, setModalType] = useState("add");
  const [activeTab, setActiveTab] = useState("Subnames");

  // fetch to get allowed domains after connect
  useEffect(() => {
    if (authStatus === "authenticated" && selectedBrand === null) {
      fetch("/api/admin/allowed-brands").then((res) =>
        res.json().then((data) => {
          if (res.status === 200) {
            setBrandUrls(data.brandUrls);
            setBrandDict(data.brandDict);
            setSelectedBrand(data.brandDict[data.brandUrls[0]]);
          } else {
            setBrandUrls([]);
            console.log(data);
          }
        })
      );
    }
  }, [authStatus, session, selectedBrand]);

  // fetch to populate table
  useEffect(() => {
    if (!selectedBrand) return;
    fetch(
      "/api/admin/list-subdomains?" +
        new URLSearchParams({ domain: selectedBrand?.domain })
    ).then((res) =>
      res.json().then((data) => {
        if (res.status === 200) {
          setSubdomains(data);
        } else {
          console.log(data);
        }
      })
    );
    fetch(
      "/api/admin/get-domain-admins?" +
        new URLSearchParams({ domain: selectedBrand?.domain })
    ).then((res) =>
      res.json().then((data) => {
        if (res.status === 200) {
          setAdmins(data.admins);
          setDomainId(data.domain_id);
        } else {
          console.log(data);
        }
      })
    );
    fetch(
      "/api/admin/get-api-key?" +
        new URLSearchParams({ domain: selectedBrand?.domain })
    ).then((res) =>
      res.json().then((data) => {
        if (res.status === 200) {
          setApiKey(data.api_key);
        } else {
          console.log(data);
        }
      })
    );
  }, [selectedBrand]);

  function openAddNameModal() {
    setModalType("add");
    setAddNameModalOpen(true);
  }

  function openEditNameModal(id, name, address) {
    setNameId(id);
    setNameInput(name);
    setAddressInput(address);
    setModalType("edit");
    setAddNameModalOpen(true);
  }

  // function to add a name
  function addName(name, address) {
    if (!name) {
      setNameErrorMsg("*Name cannot be blank");
      return;
    }
    if (!address) {
      setAddressErrorMsg("*Address cannot be blank");
      return;
    }
    // check if address is valid ethereum address using ethers and convert to checksum
    try {
      address = ethers.utils.getAddress(address);
    } catch (e) {
      setAddressErrorMsg("*Invalid address");
      return;
    }
    // check if name is valid
    try {
      name = normalize(name);
    } catch (e) {
      setNameErrorMsg("*Invalid name");
      return;
    }

    fetch("/api/admin/add-subdomain", {
      method: "POST",
      body: JSON.stringify({
        name: name,
        address: address,
        domain: selectedBrand.domain,
      }),
    }).then((res) => {
      res.json().then((data) => {
        if (res.status === 200) {
          setAddNameModalOpen(false);
          setSubdomains([...subdomains, data]);
          setNameErrorMsg("");
          setAddressErrorMsg("");
          setNameInput("");
          setAddressInput("");
        } else {
          if (data.error.includes("claimed") || data.error.includes("ens")) {
            setNameErrorMsg(data.error);
          }
          console.log(data);
        }
      });
    });
  }
  // function to edit a name
  function editName(name, address, id) {
    if (!name) {
      setNameErrorMsg("*Name cannot be blank");
      return;
    }
    if (!address) {
      setAddressErrorMsg("*Address cannot be blank");
      return;
    }
    // check if address is valid ethereum address using ethers and convert to checksum
    try {
      address = ethers.utils.getAddress(address);
    } catch (e) {
      setAddressErrorMsg("*Invalid address");
      return;
    }
    // check if name is valid
    try {
      name = normalize(name);
    } catch (e) {
      setNameErrorMsg("*Invalid name");
      return;
    }

    fetch("/api/admin/edit-subdomain", {
      method: "POST",
      body: JSON.stringify({
        name: name,
        address: address,
        domain: selectedBrand.domain,
        id: id,
      }),
    }).then((res) => {
      res.json().then((data) => {
        if (res.status === 200) {
          setAddNameModalOpen(false);
          // get index of old name
          let index = subdomains.findIndex((sub) => sub.id === id);
          // replace old name with data
          let tempSubdomains = subdomains;
          tempSubdomains[index] = data;
          setSubdomains(tempSubdomains);
          // clear inputs
          setNameErrorMsg("");
          setAddressErrorMsg("");
          setNameInput("");
          setAddressInput("");
        } else {
          if (data.error.includes("claimed") || data.error.includes("ens")) {
            setNameErrorMsg(data.error);
          }

          console.log(data);
        }
      });
    });
  }

  // admins
  function addAdmin() {
    setAdmins((prevState) => {
      return [...prevState, ""];
    });
    setSaveSettingsDisabled(false);
  }
  function deleteAdmin(index) {
    let tempAdmins = admins;
    tempAdmins.splice(index, 1);
    setAdmins([...tempAdmins]);
    setSaveSettingsDisabled(false);
  }
  function changeAdmin(index, address) {
    let tempAdmins = admins;
    tempAdmins.splice(index, 1);
    tempAdmins[index] = address;
    setAdmins([...tempAdmins]);
    setSaveSettingsDisabled(false);
  }
  function saveSettings() {
    setSaveSettingsPending(true);
    const brandData = {
      admins: admins,
      domain_id: domainId,
    };
    fetch("/api/admin/save-admins", {
      method: "POST",
      body: JSON.stringify({ brandData: brandData }),
    })
      .then((res) => {
        setSaveSettingsPending(false);
        res.json().then((data) => {
          if (res.status === 200) {
            setAdminErrorMsg("");
            setSaveSettingsDisabled(true);
          } else {
            console.log(data);
            setAdminErrorMsg(data.error);
          }
        });
      })
      .catch((err) => {
        setSaveSettingsPending(false);
        setSaveSettingsDisabled(false);
        setAdminErrorMsg(err);
      });
    return;
  }

  // useEffect to wipe inputs and errors when modal is closed
  useEffect(() => {
    if (!addNameModalOpen) {
      setNameErrorMsg("");
      setAddressErrorMsg("");
      setNameInput("");
      setAddressInput("");
    }
  }, [addNameModalOpen]);
  // if they haven't authenticated, they need to click connect
  if (authStatus !== "authenticated") {
    return (
      <AuthContentContainer>
        <div className="flex items-center justify-center mx-auto text-center">
          <div className="text-sm font-bold text-brownblack-700">
            Connect your wallet to view.{" "}
          </div>
        </div>
      </AuthContentContainer>
    );
  }
  // if not permission to view or no brand selected
  if (brandUrls.length === 0 || !selectedBrand) {
    return (
      <AuthContentContainer>
        <div className="flex flex-col items-center justify-center px-8 mx-auto text-center">
          <div className="text-sm font-bold text-brownblack-700">
            <div> This wallet does not have access to the admin panel.</div>
            <div> Is this a mistake?</div>
          </div>
          <Link
            className="mt-2 text-sm text-orange-800 hover:underline"
            href="mailto:alex@namestone.xyz"
          >
            Contact Alex
          </Link>
        </div>
      </AuthContentContainer>
    );
  }

  return (
    <AuthContentContainer>
      <AddNameModal
        modalType={modalType}
        open={addNameModalOpen}
        setOpen={setAddNameModalOpen}
        nameId={nameId}
        addName={addName}
        editName={editName}
        nameInput={nameInput}
        setNameInput={setNameInput}
        addressInput={addressInput}
        setAddressInput={setAddressInput}
        nameErrorMsg={nameErrorMsg}
        addressErrorMsg={addressErrorMsg}
      />
      {/*Left Bar*/}
      <div className="flex-grow flex-1 max-w-sm border-r-[1px] border-brownblack-20 ">
        <div className="ml-4 md:ml-16 mt-7">
          <div className="w-full mb-4 text-sm font-bold md:text-base text-brownblack-700">
            Brands
          </div>
          <div className="flex flex-col w-full ">
            {brandUrls.map((brandUrl) => {
              const brand = brandDict[brandUrl];
              return (
                <div
                  key={brand.url_slug}
                  className={`flex items-center h-10 mb-2 mr-6 md:text-sm text-xs rounded-lg text-brownblack-700 cursor-pointer ${
                    selectedBrand?.url_slug === brand.url_slug
                      ? " bg-neutral-100"
                      : ""
                  }`}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div className="flex  overflow-hidden rounded-full  w-[24px] h-[24px] mx-2">
                    <Image
                      src={brand.default_avatar || placeholderImage}
                      width={24}
                      height={24}
                      alt={brand.name}
                    />
                  </div>
                  <span className="hidden md:block">{brand.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/*Main Content*/}
      <div className="flex-grow max-w-3xl flex-2">
        <div className="flex-col items-start w-full p-6">
          {/* Brand Name */}
          <div className="flex items-center text-base font-bold text-brownblack-700">
            <div className="flex overflow-hidden rounded-full  w-[48px] h-[48px] mr-2">
              <Image
                src={selectedBrand.default_avatar || placeholderImage}
                width={48}
                height={48}
                alt={selectedBrand.name}
              />
            </div>
            <div className="text-2xl">{selectedBrand.name}</div>
          </div>
          {/* Tab selection */}
          <div className="relative">
            <div className="flex gap-8 mt-8">
              <button
                onClick={() => setActiveTab("Subnames")}
                className={`relative border-b-2 transition-colors duration-300 pb-2 
                ${
                  activeTab === "Subnames"
                    ? "border-orange-500" // Selected state
                    : "border-transparent hover:border-orange-400" // Unselected with hover effect
                }`}
              >
                Subnames
              </button>
              <button
                onClick={() => setActiveTab("Settings")}
                className={`relative border-b-2 transition-colors duration-300 pb-2 
                  ${
                    activeTab === "Settings"
                      ? "border-orange-500" // Selected state
                      : "border-transparent hover:border-orange-400" // Unselected with hover effect
                  }`}
              >
                Settings
              </button>
            </div>
            <hr className="bg-neutral-200"></hr>
          </div>

          {/* Table */}
          {activeTab === "Subnames" && (
            <>
              <div className="flex w-full">
                <button
                  className={
                    "py-1 px-3 mr-0 my-4 h-11 font-bold text-sm  text-brownblack-700 bg-orange-500 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-500/[0.50] flex items-center justify-center min-w-[150px] mx-auto rounded-lg disabled:cursor-not-allowed md:block"
                  }
                  onClick={() => openAddNameModal()}
                >
                  + Add Name
                </button>
              </div>
              <SubdomainsTable
                subdomains={subdomains}
                setSubdomains={setSubdomains}
                openEditNameModal={openEditNameModal}
                admin={true}
              />
            </>
          )}
          {activeTab === "Settings" && (
            <div className="flex flex-col gap-4 ">
              <ApiKeyDisplay apiKey={apiKey} />
              <div className="mb-2 text-sm font-bold text-brownblack-700">
                Domain Admins
              </div>
              {admins &&
                admins.map((address, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-start mb-4"
                  >
                    <input
                      className="w-[28rem] px-4 py-2 border rounded-md border-brownblack-50"
                      value={address}
                      onChange={(e) => changeAdmin(index, e.target.value)}
                    />
                    <Icon
                      icon="bi:trash"
                      className="w-6 h-6 mx-4 text-red-500 cursor-pointer"
                      onClick={() => deleteAdmin(index)}
                    />
                  </div>
                ))}
              <button
                className="mb-4 font-bold text-left text-orange-700 transition-colors duration-300 w-fit hover:text-orange-400"
                onClick={addAdmin}
              >
                + Add Admin
              </button>
              <hr className="bg-zinc-100"></hr>

              <div className="flex items-center self-start mb-16">
                <Button
                  buttonText="Save"
                  disabled={saveSettingsDisabled}
                  pending={saveSettingsPending}
                  onClick={saveSettings}
                />
                <div className="ml-6 text-sm text-red-500">{adminErrorMsg}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/*Right Bar*/}
      <div className="flex-1 bg-white"></div>
    </AuthContentContainer>
  );
}

function AddNameModal({
  modalType,
  open,
  setOpen,
  nameId,
  addName,
  editName,
  nameInput,
  setNameInput,
  addressInput,
  setAddressInput,
  nameErrorMsg,
  addressErrorMsg,
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [showSubname, setShowSubname] = useState(false);
  const tabs = ["profile", "links", "addresses"];

  const TAB_CONTENT = {
    profile: (
      <div className="flex flex-col mt-4">
        {/* Avatar */}
        <div className="flex flex-row justify-between">
          <div className="mb-2 text-sm font-bold text-brownblack-700">
            Avatar
          </div>
          <div className="text-sm text-red-500">{nameErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="https://"
        />
        {/* Description */}
        <div className="flex flex-row justify-between">
          <div className="mb-2 text-sm font-bold text-brownblack-700">
            Description
          </div>
          <div className="text-sm text-red-500">{nameErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Open source developer coding on ens"
        />
        {/* Location */}
        <div className="flex flex-row justify-between">
          <div className="mb-2 text-sm font-bold text-brownblack-700">
            Location
          </div>
          <div className="text-sm text-red-500">{nameErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="New York City"
        />
      </div>
    ),
    links: (
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex flex-row justify-between ">
          <div className="mb-2 text-sm font-bold text-brownblack-700">
            Links
          </div>
        </div>
        {/* Website */}
        <div className="relative">
          <Image
            src="/images/icon-link.png"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="https://"
          />
        </div>
        {/* X */}
        <div className="relative">
          <Image
            src="/images/logo-x-black.png"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="@namestonehq"
          />
        </div>
        {/* Github */}
        <div className="relative">
          <Image
            src="/images/logo-github-brown.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="resolverworks"
          />
        </div>
        {/* Discord */}
        <div className="relative">
          <Image
            src="/images/logo-discord.png"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="slobo.eth"
          />
        </div>
        {/* Telegram */}
        <div className="relative">
          <Image
            src="/images/logo-telegram.png"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="superslobo"
          />
        </div>
        {/* IPFS */}
        <div className="relative">
          <Image
            src="/images/logo-ipfs.png"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="ipfs://bafyb...."
          />
        </div>
        <button className="text-xs text-left text-orange-800">
          + Text Record
        </button>
      </div>
    ),
    addresses: (
      <div className="flex flex-col gap-2 mt-4">
        <div className="text-sm font-bold text-brownblack-700">Bitcoin</div>
        {/* Bitcoin */}
        <div className="relative">
          <Image
            src="/images/logo-bitcoin.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="bc1q...aw4n"
          />
        </div>
        {/* Solana */}
        <div className="text-sm font-bold text-brownblack-700">Solana</div>
        <div className="relative">
          <Image
            src="/images/logo-solana.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="Ge83...S2bh"
          />
        </div>
        {/* Base */}
        <div className="text-sm font-bold text-brownblack-700">Base</div>
        <div className="relative">
          <Image
            src="/images/logo-base.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="0x5346...D42CF"
          />
        </div>
        {/* Optimism */}
        <div className="text-sm font-bold text-brownblack-700">Optimism</div>
        <div className="relative">
          <Image
            src="/images/logo-op.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="0x5346...D42CF"
          />
        </div>
        {/* Scroll */}
        <div className="text-sm font-bold text-brownblack-700">Scroll</div>
        <div className="relative">
          <Image
            src="/images/logo-scroll.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="0x5346...D42CF"
          />
        </div>
        {/* Optimism */}
        <div className="text-sm font-bold text-brownblack-700">arbitrum</div>
        <div className="relative">
          <Image
            src="/images/logo-arb.svg"
            width={18}
            height={18}
            alt="x"
            className="absolute top-3 left-3"
          ></Image>
          <input
            className="w-full px-4 py-2 pl-10 mb-4 border rounded-md ring-1 ring-gray-300 border-brownblack-50 focus:ring-2 focus:ring-orange-400 focus:outline-none"
            placeholder="0x5346...D42CF"
          />
        </div>
        <button className="text-xs text-left text-orange-800">+ Address</button>
      </div>
    ),
  };

  const SUBNAME_CONTENT = (
    <>
      <Dialog.Title className="text-base font-bold text-brownblack-700">
        {modalType === "add" ? "Add a subname" : "Edit Subname"}
      </Dialog.Title>
      <hr className="border-0 h-[0.5px] bg-brownblack-200/50 my-4"></hr>
      <button
        className="flex items-center gap-1 mt-2 ml-auto text-xs text-orange-800 hover:text-orange-600"
        onClick={() => {}}
      >
        More Records <span className="text-sm">&gt;</span>
      </button>
      <div className="flex flex-col">
        <div className="flex flex-row justify-between">
          <div className="text-sm font-bold text-brownblack-700">Subname</div>
          <div className="text-sm text-red-500">{nameErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <div className="flex flex-row justify-between">
          <div className="text-sm font-bold text-brownblack-700">Address</div>
          <div className="text-sm text-red-500">{addressErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 font-mono text-sm border rounded-md border-brownblack-50"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
      </div>
      <div className="flex justify-between w-full">
        <button className="flex items-end mb-2 ml-1 text-sm font-bold text-red-500 transition-colors duration-300 hover:text-red-600 hover:cursor-pointer">
          Delete
        </button>
        <div className="flex items-center justify-around mt-6">
          <button
            className="flex bg-orange-500 items-center justify-center py-2 min-w-[100px] mx-auto text-sm font-bold rounded-lg disabled:cursor-not-allowed text-brownblack-700 md:block"
            onClick={() => {
              if (modalType === "edit") {
                editName(nameInput, addressInput, nameId);
              } else {
                addName(nameInput, addressInput);
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );

  return (
    <Dialog
      className="relative z-50"
      open={open}
      onClose={() => setOpen(false)}
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-[496px] px-6 py-4 bg-white rounded-lg">
          {!showSubname ? (
            <>
              <button
                className="flex items-center gap-1 mt-2 mb-8 mr-auto text-xs text-orange-800 transition-colors duration-300 hover:text-orange-400"
                onClick={() => setShowSubname(true)}
              >
                <span className="text-sm">&lt;</span> name.name.eth
              </button>

              <div className="flex gap-6 mt-2 text-neutral-400">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`relative border-b-2 transition-colors duration-300 pb-2
                      ${
                        activeTab === tab
                          ? "text-orange-500 border-orange-500"
                          : "border-transparent hover:border-orange-400 hover:text-orange-400"
                      }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <hr className="-mt-[1px] bg-neutral-200" />

              {TAB_CONTENT[activeTab]}
            </>
          ) : (
            SUBNAME_CONTENT
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function ApiKeyDisplay({ apiKey }) {
  const [isObscured, setIsObscured] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="flex flex-col my-6">
      <label className="mb-2 text-sm font-bold text-brownblack-700">
        API Key
      </label>
      <div
        className="relative flex items-center h-10 pl-3 border rounded-lg border-neutral-200 hover:cursor-pointer bg-gray-50 w-[28rem]"
        onMouseEnter={() => setIsObscured(false)}
        onMouseLeave={() => setIsObscured(true)}
      >
        <span className="font-mono text-sm text-gray-700 truncate">
          {isObscured ? "•••••••••••••••••••••••••••••••••" : apiKey}
        </span>

        <button
          onClick={copyToClipboard}
          className="absolute text-gray-500 transform -translate-y-1/2 right-2 top-1/2 hover:text-gray-700 focus:outline-none"
          aria-label="Copy API key"
        >
          {isCopied ? (
            <CheckIcon size={20} className="text-green-500" />
          ) : (
            <ClipboardIcon size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

const ClipboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
