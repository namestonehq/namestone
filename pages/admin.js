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
  //add or edit
  const [modalType, setModalType] = useState("add");

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
          if (data.error.includes("claimed")) {
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
          if (data.error.includes("claimed")) {
            setNameErrorMsg(data.error);
          }
          console.log(data);
        }
      });
    });
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
                  className={`flex items-center h-10 mb-2 mr-6 md:text-sm text-xs md:font-bold rounded-lg text-brownblack-700 cursor-pointer ${
                    selectedBrand?.url_slug === brand.url_slug
                      ? "bg-brownblack-20"
                      : ""
                  }`}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div className="flex  overflow-hidden rounded-full  w-[24px] h-[24px] mx-2">
                    {brand.default_avatar && (
                      <Image
                        src={brand.default_avatar}
                        width={24}
                        height={24}
                        alt={brand.name}
                      />
                    )}
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
            <div className="flex overflow-hidden rounded-full  w-[24px] h-[24px] mr-2">
              {selectedBrand.default_avatar && (
                <Image
                  src={selectedBrand.default_avatar}
                  width={24}
                  height={24}
                  alt={selectedBrand.name}
                />
              )}
            </div>
            <div>{selectedBrand.name}</div>
          </div>
          {/* Tab selection */}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-row my-3 text-sm">
              <div className="py-[2px] px-[6px] border-b-4 border-brownblack-200 rounded-b-sm">
                Claimed Names
              </div>

              {/* <div className="flex flex-row items-center">
                <div className="w-[16px] h-[16px] mr-1 ">
                  <Image
                    src={BlockIcon}
                    width={14}
                    height={14}
                    alt="blockIcon"
                  />
                </div>
                Blocked
              </div> */}
            </div>
            <button
              className={
                "py-1 px-3 mr-0 text-sm h-fit text-brownblack-700 bg-orange-500 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-500/[0.50] flex items-center justify-center min-w-[150px] mx-auto rounded-lg disabled:cursor-not-allowed md:block"
              }
              onClick={() => openAddNameModal()}
            >
              + Add Name
            </button>
          </div>
          {/* Table */}
          <SubdomainsTable
            subdomains={subdomains}
            setSubdomains={setSubdomains}
            openEditNameModal={openEditNameModal}
            admin={true}
          />
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
  return (
    <Dialog
      className="relative z-50"
      open={open}
      onClose={() => setOpen(false)}
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm px-6 py-4 bg-white border-2 rounded-lg border-brownblack-200">
          <Dialog.Title className="text-base font-bold text-brownblack-700">
            {modalType === "add" ? "Add a Name" : "Edit Name"}
          </Dialog.Title>
          <div className="flex flex-col mt-8">
            <div className="flex flex-row justify-between">
              <div className="text-sm font-bold text-brownblack-700">Name</div>
              <div className="text-sm text-red-500">{nameErrorMsg}</div>
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <div className="flex flex-row justify-between">
              <div className="text-sm font-bold text-brownblack-700">
                Address
              </div>
              <div className="text-sm text-red-500">{addressErrorMsg}</div>
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-around mt-6">
            <Button
              buttonText="Save"
              onClick={() => {
                if (modalType === "edit") {
                  editName(nameInput, addressInput, nameId);
                } else {
                  addName(nameInput, addressInput);
                }
              }}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
