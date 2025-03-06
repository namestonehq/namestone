import React from "react";
import Image from "next/image";
import AuthContentContainer from "../components/Admin/AuthContentContainer";
import { useState, useEffect } from "react";
import Link from "next/link";
import SubdomainTable from "../components/Admin/SubdomainTable";
import { useSession } from "next-auth/react";
import Button from "../components/Button";
import { ethers } from "ethers";
import placeholderImage from "../public/images/placeholder-icon-image.png";
import { Icon } from "@iconify/react";
import AddNameModal from "../components/Admin/AddNameModal";
import toast from "react-hot-toast";
import _ from "lodash";
import ConfirmationModal from "../components/Admin/ConfirmationModal";
import { shortenAddress, updateResolver } from "../utils/FrontUtils";
import {
  useEnsName,
  useEnsAvatar,
  useEnsAddress,
  useWalletClient,
  useSwitchChain,
} from "wagmi";
import { isAddress } from "ethers/lib/utils";
import ResolverAlertIcon from "../components/Admin/ResolverAlertIcon";
import OwnershipRequiredModal from "../components/Admin/OwnershipRequiredModal";

const blankNameData = {
  name: "",
  address: "",
  contenthash: "",
  textRecords: [],
  coinTypes: [],
};

export default function Admin() {
  const { data: session, status: authStatus } = useSession();
  const [brandUrls, setBrandUrls] = useState([]);

  const [brandDict, setBrandDict] = useState({});
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [subdomains, setSubdomains] = useState([]);

  const [addNameModalOpen, setAddNameModalOpen] = useState(false);
  const [nameErrorMsg, setNameErrorMsg] = useState("");
  const [addressErrorMsg, setAddressErrorMsg] = useState("");
  const [admins, setAdmins] = useState([]);
  const [saveSettingsDisabled, setSaveSettingsDisabled] = useState(true);
  const [saveSettingsPending, setSaveSettingsPending] = useState(false);
  const [apiKey, setApiKey] = useState("loading");
  const [publicDomain, setPublicDomain] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState("");
  //add or edit
  const [activeTab, setActiveTab] = useState("Subnames");
  const [currentNameData, setCurrentNameData] = useState(blankNameData);
  const [saveNamePending, setSaveNamePending] = useState(false);
  const [mainnetOpen, setMainnetOpen] = useState(true);
  const [sepoliaOpen, setSepoliaOpen] = useState(true);
  const [deleteAdminModalOpen, setDeleteAdminModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState({
    index: null,
    displayName: "",
  });
  // Add new state to track which admin row is being edited
  const [editingIndex, setEditingIndex] = useState(null);
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [resolverButtonText, setResolverButtonText] =
    useState("Update Resolver");
  const [changeResolver, setChangeResolver] = useState(0);
  const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);

  //funtion to help set current name data
  function setCurrentNameHelper(value, key1, key2 = undefined) {
    if (key2 !== undefined) {
      setCurrentNameData({
        ...currentNameData,
        [key1]: { ...currentNameData[key1], [key2]: value },
      });
    } else {
      setCurrentNameData({ ...currentNameData, [key1]: value });
    }
  }

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

  useEffect(() => {
    if (!selectedBrand) return;
    // list subdomains
    fetch(
      "/api/admin/list-subdomains?" +
        new URLSearchParams({
          domain_id: selectedBrand?.domain_id,
        })
    ).then((res) => {
      res.json().then((data) => {
        if (res.status === 200) {
          setSubdomains(data);
        } else {
          console.log(data);
        }
      });
    });
    // Get domain settings (admins and API key)
    fetch(
      "/api/admin/get-domain-settings?" +
        new URLSearchParams({ domain_id: selectedBrand?.domain_id })
    ).then((res) =>
      res.json().then((data) => {
        if (res.status === 200) {
          setAdmins(data.admins);
          setApiKey(data.api_key);
          setPublicDomain(data.public_domain);
        } else {
          console.log(data);
        }
      })
    );
  }, [selectedBrand]);

  function openAddNameModal() {
    setAddNameModalOpen(true);
    let tempBlankNameData = _.cloneDeep(blankNameData);
    tempBlankNameData.domain = selectedBrand.domain;
    tempBlankNameData.id = 0;
    console.log(tempBlankNameData);
    setCurrentNameData(tempBlankNameData);
  }

  function openEditNameModal(index) {
    // set currectNameData to what we know already
    let tempNameData = _.cloneDeep(blankNameData);
    tempNameData.name = subdomains[index].name;
    tempNameData.address = subdomains[index].address;
    tempNameData.id = subdomains[index].id;
    tempNameData.domain = selectedBrand.domain;
    setCurrentNameData(tempNameData);
    // prevent saving when text records havent loaded
    setSaveNamePending(true);
    // fetch name
    const url =
      selectedBrand.network === "mainnet"
        ? "/api/public_v1/search-names?"
        : "/api/public_v1_sepolia/search-names?";
    fetch(
      url +
        new URLSearchParams({
          domain: selectedBrand?.domain,
          name: subdomains[index].name,
        })
    ).then((res) => {
      res.json().then((data) => {
        if (res.status === 200) {
          // Get the latest currentNameData state to preserve any user changes
          setCurrentNameData((prevNameData) => ({
            ...data[0],
            // Preserve the latest user-editable fields from the current state
            name: prevNameData.name,
            address: prevNameData.address,
            id: subdomains[index].id,
          }));
        } else {
          console.log(data);
        }
        setSaveNamePending(false);
      });
    });

    setAddNameModalOpen(true);
  }

  // function to add and edit a name
  async function setName(nameData) {
    if (!nameData.name) {
      setNameErrorMsg("*Name cannot be blank");
      return;
    }
    if (!nameData.address) {
      setAddressErrorMsg("*Address cannot be blank");
      return;
    }
    // check if address is valid ethereum address using ethers and convert to checksum
    let address;
    try {
      address = ethers.utils.getAddress(nameData.address);
    } catch (e) {
      setAddressErrorMsg("*Invalid address");
      return;
    }
    setSaveNamePending(true);

    try {
      const res = await fetch("/api/admin/set-subdomain", {
        method: "POST",
        body: JSON.stringify({
          network: selectedBrand.network,
          id: nameData.id,
          name: nameData.name,
          address: address,
          contenthash: nameData.contenthash,
          domain: selectedBrand.domain,
          text_records: nameData.text_records,
          coin_types: nameData.coin_types,
        }),
      });
      const data = await res.json();

      if (res.status === 200) {
        setAddNameModalOpen(false);
        setNameErrorMsg("");
        setAddressErrorMsg("");
        toast.success("Subdomain set successfully");

        // Refresh the subdomains list
        const subdomainsRes = await fetch(
          "/api/admin/list-subdomains?" +
            new URLSearchParams({
              domain_id: selectedBrand?.domain_id,
            })
        );
        const subdomainsData = await subdomainsRes.json();

        if (subdomainsRes.status === 200) {
          setSubdomains(subdomainsData);
        } else {
          console.log(subdomainsData);
        }
      } else {
        setNameErrorMsg(data.error);
        console.log(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSaveNamePending(false);
    }
  }
  // function to delete a name
  async function deleteName(name) {
    const url =
      selectedBrand.network === "mainnet"
        ? "/api/public_v1/delete-name"
        : "/api/public_v1_sepolia/delete-name";

    try {
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          name: name,
          domain: selectedBrand.domain,
        }),
      });
      const data = await res.json();

      if (res.status === 200) {
        // Refresh the subdomains list
        const subdomainsRes = await fetch(
          "/api/admin/list-subdomains?" +
            new URLSearchParams({
              domain_id: selectedBrand?.domain_id,
            })
        );
        const subdomainsData = await subdomainsRes.json();

        if (subdomainsRes.status === 200) {
          setSubdomains(subdomainsData);
          toast.success("Subdomain deleted successfully");
        } else {
          console.log(subdomainsData);
        }
      } else {
        console.log(data);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // admins
  function addAdmin() {
    const newIndex = admins.length;
    setAdmins((prevState) => {
      return [...prevState, ""];
    });
    setSaveSettingsDisabled(false);
    // Set the new row to be in edit mode
    setEditingIndex(newIndex);
  }
  function deleteAdmin(index, displayName) {
    // If we're deleting the row being edited, clear the editing state
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    // If we're deleting a row before the one being edited, adjust the editing index
    else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    setAdminToDelete({
      index,
      displayName: displayName || admins[index],
    });
    setDeleteAdminModalOpen(true);
  }
  function confirmDeleteAdmin() {
    let tempAdmins = [...admins]; // Create a new array to avoid mutating state directly
    tempAdmins.splice(adminToDelete.index, 1);
    setAdmins(tempAdmins);
    setSaveSettingsDisabled(false);
    setDeleteAdminModalOpen(false);
  }
  function changeAdmin(index, address) {
    setAdmins((prevAdmins) => {
      const newAdmins = [...prevAdmins];
      newAdmins[index] = address;
      return newAdmins;
    });
    setSaveSettingsDisabled(false);
  }
  function saveSettings() {
    setSaveSettingsPending(true);
    const brandData = {
      admins: admins,
      domain_id: selectedBrand.domain_id,
      public_domain: publicDomain,
    };
    fetch("/api/admin/save-domain-settings", {
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
      setCurrentNameData(blankNameData);
    }
  }, [addNameModalOpen]);

  // Update the handleUpdateResolver function to check ownership
  const handleUpdateResolver = async () => {
    if (!selectedBrand || !walletClient) return;

    // Check if the connected wallet is the owner of the domain
    const connectedAddress = session?.address?.toLowerCase();
    const domainOwner = selectedBrand.owner?.toLowerCase();

    if (connectedAddress !== domainOwner) {
      // If not the owner, show the ownership required modal
      setOwnershipModalOpen(true);
      return;
    }

    // If owner, proceed with the update
    await updateResolver({
      walletClient,
      selectedDomain: {
        name: selectedBrand.domain,
        resolver: selectedBrand.resolver,
        owner: selectedBrand.owner,
      },
      network: selectedBrand.network === "mainnet" ? "Mainnet" : "Sepolia",
      address: session?.address,
      setResolverButtonText,
      setChangeResolver,
      switchChain,
    });
  };

  // Add useEffect to refresh brand data when resolver is updated
  useEffect(() => {
    if (changeResolver > 0 && selectedBrand) {
      // Refresh the brand data
      fetch("/api/admin/allowed-brands").then((res) =>
        res.json().then((data) => {
          if (res.status === 200) {
            setBrandUrls(data.brandUrls);
            setBrandDict(data.brandDict);
            // Keep the same selected brand but with updated data
            const updatedBrand = data.brandDict[selectedBrand.url_slug];
            if (updatedBrand) {
              setSelectedBrand(updatedBrand);
            }
          } else {
            console.log(data);
          }
        })
      );
    }
  }, [changeResolver]);

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
            href="mailto:alex@namestone.com"
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
        open={addNameModalOpen}
        setOpen={setAddNameModalOpen}
        currentNameData={currentNameData}
        setCurrentNameHelper={setCurrentNameHelper}
        savePending={saveNamePending}
        deleteName={deleteName}
        setName={setName}
        nameErrorMsg={nameErrorMsg}
        addressErrorMsg={addressErrorMsg}
      />
      <OwnershipRequiredModal
        isOpen={ownershipModalOpen}
        onClose={() => setOwnershipModalOpen(false)}
      />
      {/*Left Bar*/}
      <div className="flex-grow flex-1 max-w-sm border-r-[1px] border-brownblack-20 ">
        <div className="ml-4 md:ml-16 mt-7">
          <div className="w-full mb-4 text-sm font-bold md:text-base text-brownblack-700">
            Names
          </div>
          <div
            className="flex pr-2 cursor-pointer"
            onClick={() => setMainnetOpen(!mainnetOpen)}
          >
            <div className="w-full my-1 text-xs text-brownblack-700">
              Mainnet
            </div>
            {mainnetOpen ? "-" : "+"}
          </div>
          {mainnetOpen && (
            <div className="flex flex-col w-full ">
              {brandUrls
                .filter((brandUrl) => {
                  return brandDict[brandUrl].network === "mainnet";
                })
                .map((brandUrl) => {
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
                      <div className="flex overflow-hidden rounded-full w-[24px] h-[24px] mx-2">
                        <Image
                          src={brand.default_avatar || placeholderImage}
                          width={24}
                          height={24}
                          alt={brand.name}
                        />
                      </div>
                      <span className="hidden md:block">{brand.name}</span>
                      {brand.resolverStatus === "incorrect" && (
                        <div className="ml-auto mr-2">
                          <ResolverAlertIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          {/* Divider */}
          <hr className="my-4 bg-neutral-200"></hr>
          <div
            className="flex pr-2 cursor-pointer"
            onClick={() => setSepoliaOpen(!sepoliaOpen)}
          >
            <div className="w-full my-1 text-xs text-brownblack-700">
              Sepolia
            </div>
            {sepoliaOpen ? "-" : "+"}
          </div>

          {sepoliaOpen && (
            <div className="flex flex-col w-full ">
              {brandUrls
                .filter((brandUrl) => {
                  return brandDict[brandUrl].network === "sepolia";
                })
                .map((brandUrl) => {
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
                      <div className="flex overflow-hidden rounded-full w-[24px] h-[24px] mx-2">
                        <Image
                          src={brand.default_avatar || placeholderImage}
                          width={24}
                          height={24}
                          alt={brand.name}
                        />
                      </div>
                      <span className="hidden md:block">{brand.name}</span>
                      {brand.resolverStatus === "incorrect" && (
                        <div className="ml-auto mr-2">
                          <ResolverAlertIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {/*Main Content*/}
      <div className="flex-grow max-w-3xl flex-2">
        <div className="flex-col items-start w-full p-6">
          {/* Resolver Alert */}
          {selectedBrand?.hasResolverIssue && (
            <div
              className={`flex items-center justify-between w-full p-4 mb-4 rounded-lg ${
                selectedBrand.resolverStatus === "incorrect"
                  ? "bg-red-50"
                  : "bg-orange-20"
              }`}
            >
              <div className="flex items-center gap-2">
                <ResolverAlertIcon
                  color={
                    selectedBrand.resolverStatus === "incorrect"
                      ? "red"
                      : "orange"
                  }
                />
                <span>
                  {selectedBrand.resolverStatus === "incorrect"
                    ? "Resolver issue detected—please update to restore service."
                    : "Your resolver is working but out of date."}
                </span>
              </div>
              <button
                onClick={handleUpdateResolver}
                className={`px-4 py-1 text-sm font-medium ${
                  resolverButtonText === "Success"
                    ? "bg-green-500 text-white"
                    : resolverButtonText === "Failed" ||
                      resolverButtonText === "Failed to update"
                    ? "bg-red-500 text-white"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                } rounded-md transition-colors duration-300`}
                disabled={
                  resolverButtonText === "Waiting for approval..." ||
                  resolverButtonText === "Pending"
                }
              >
                {resolverButtonText}
              </button>
            </div>
          )}

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
              <SubdomainTable
                subdomains={subdomains}
                admin={true}
                deleteName={deleteName}
                openEditNameModal={openEditNameModal}
                selectedBrand={selectedBrand}
                setSubdomains={setSubdomains}
              />
            </>
          )}
          {activeTab === "Settings" && (
            <div className="flex flex-col gap-4 w-[28rem] ">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-col mt-6">
                  <label className="mb-2 text-sm font-bold text-brownblack-700">
                    Make subnames public
                  </label>
                  <p className="mb-2 text-sm text-brownblack-500">
                    Allow your subnames to be discovered and displayed by
                    projects that interact with our api.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="publicDomain"
                  checked={publicDomain}
                  onChange={(e) => {
                    setPublicDomain(e.target.checked);
                    setSaveSettingsDisabled(false);
                  }}
                  className="relative w-11 h-6 rounded-full appearance-none border-2 border-brownblack-200 checked:bg-green-500 cursor-pointer checked:border-green-500 
                    before:content-[''] before:absolute before:w-4 before:h-4 before:bg-brownblack-200 before:rounded-full before:left-0.5 before:top-0.5
                    checked:before:bg-white checked:before:translate-x-5 before:transition-all duration-300 flex-shrink-0"
                />
              </div>

              <ApiKeyDisplay apiKey={apiKey} />
              <div className="mb-2 text-sm font-bold text-brownblack-700">
                Domain Admins
              </div>
              <div className="mb-4">
                {admins.map((address, index) => (
                  <AdminRow
                    key={index}
                    address={address}
                    index={index}
                    onDelete={deleteAdmin}
                    onChange={changeAdmin}
                    totalAdmins={admins.length}
                    editingIndex={editingIndex}
                    setEditingIndex={setEditingIndex}
                    admins={admins}
                    setAdmins={setAdmins}
                    network={selectedBrand.network}
                  />
                ))}
              </div>
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

      <ConfirmationModal
        isOpen={deleteAdminModalOpen}
        onClose={() => setDeleteAdminModalOpen(false)}
        onConfirm={confirmDeleteAdmin}
        title="Delete connected wallet as admin?"
      >
        <b>{adminToDelete.displayName} </b>will not have access to the admin
        panel. Access to admin can be requested again from another admin or
        alex@namestone.xyz.
      </ConfirmationModal>
    </AuthContentContainer>
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

function AdminRow({
  address,
  index,
  onDelete,
  onChange,
  totalAdmins,
  editingIndex,
  setEditingIndex,
  admins,
  setAdmins,
  network,
}) {
  const { data: session } = useSession();
  const [isEditHovering, setIsEditHovering] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Update ENS resolution hooks to use the correct network
  const chainId = network === "mainnet" ? 1 : 11155111; // 11155111 is Sepolia's chain ID

  const { data: initialEnsName } = useEnsName({
    address,
    chainId,
  });

  const { data: ensNameFromAddress } = useEnsName({
    address: isAddress(editValue) ? editValue : undefined,
    chainId,
  });

  const { data: ensAddress } = useEnsAddress({
    name: editValue?.includes(".") ? editValue : undefined,
    chainId,
  });

  const ensName = editValue?.includes(".") ? editValue : ensNameFromAddress;
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId,
  });

  const isValidAddress = editValue && (isAddress(editValue) || ensAddress);
  const resolvedAddress =
    ensAddress || (isAddress(editValue) ? editValue : null);
  const displayName = ensName || shortenAddress(address);

  // Check if current user is this admin
  const isCurrentUser =
    session?.address &&
    session.address.toLowerCase() ===
      (resolvedAddress || editValue).toLowerCase();

  // Replace the isEditing state with computed value
  const isEditing = index === editingIndex;

  // Update setIsEditing calls to use setEditingIndex
  const handleSetAddress = () => {
    if (isValidAddress && resolvedAddress) {
      onChange(index, resolvedAddress);
      setEditingIndex(null);
      setIsEditHovering(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-2 mb-2 transition-colors border rounded-lg border-neutral-200 ${
        isEditing || isEditHovering ? "bg-gray-50" : "bg-white"
      }`}
      onMouseEnter={() => setIsEditHovering(true)}
      onMouseLeave={() => setIsEditHovering(false)}
    >
      {isEditing ? (
        // EDITING MODE
        <div className="flex flex-col w-full">
          {/* Input field and cancel button */}
          <div className="flex items-center justify-between w-full">
            <input
              className="flex-1 px-3 py-2 text-xs font-normal bg-white border rounded-lg text-neutral-900 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              style={{ lineHeight: "16px" }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter ENS name or ETH address"
              autoFocus
            />
            <button
              onClick={() => {
                // If this is a new row (empty address) and we're canceling, remove it
                if (!address) {
                  let tempAdmins = [...admins];
                  tempAdmins.splice(index, 1);
                  setAdmins(tempAdmins);
                }
                setEditingIndex(null);
                setIsEditHovering(false);
                // Reset editValue back to initial value
                setEditValue(initialEnsName || address);
              }}
              className="ml-4 text-sm font-normal text-orange-700 hover:text-orange-600"
              style={{ lineHeight: "16px" }}
            >
              Cancel
            </button>
          </div>

          {/* Dropdown with validation results */}
          <div className="relative mt-1">
            <div className="absolute z-10 w-full p-2 bg-white border rounded-lg shadow-lg border-neutral-200">
              {!editValue ? (
                // Empty state prompt
                <div className="flex items-center px-3 py-2 text-sm text-gray-500">
                  Enter a wallet address or ENS name
                </div>
              ) : isValidAddress ? (
                // Valid address/ENS result
                <button onClick={handleSetAddress}>
                  <div className="flex items-center flex-1">
                    <div className="relative flex items-center group">
                      <div
                        className={`relative w-8 h-8 mr-3 overflow-hidden border border-gray-200 rounded-full x`}
                      >
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                          {ensAvatar ? (
                            <Image
                              src={ensAvatar}
                              alt={displayName || "Admin"}
                              width={32}
                              height={32}
                            />
                          ) : (
                            <Image
                              src="/images/admin-default.svg"
                              alt="Admin"
                              width={32}
                              height={32}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900">
                          {displayName}
                        </div>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 ml-2 text-xs font-normal leading-4 text-neutral-900 bg-white border border-gray-200 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-normal leading-4 text-gray-500">
                        {resolvedAddress || editValue}
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                // Invalid input error
                <div className="flex items-center px-3 py-2 text-sm text-red-500">
                  <Icon
                    icon="ph:warning-circle-fill"
                    className="w-4 h-4 mr-2"
                  />
                  Invalid Address
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // MAIN ROW DISPLAY
        <>
          {/* Admin info (avatar, name, address) */}
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => setEditingIndex(index)}
          >
            <button className="relative flex items-center group">
              <div
                className={`relative w-8 h-8 mr-3 overflow-hidden border border-gray-200 rounded-full ${
                  isEditHovering ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  {isEditHovering ? (
                    <Icon icon="clarity:edit-solid" width="16" />
                  ) : ensAvatar ? (
                    <Image
                      src={ensAvatar}
                      alt={displayName || "Admin"}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Image
                      src="/images/admin-default.svg"
                      alt="Admin"
                      width={32}
                      height={32}
                    />
                  )}
                </div>
              </div>
            </button>

            <div className="flex flex-col">
              {/* Display name and "You" badge */}
              <div className="flex items-center">
                <div className="font-medium text-gray-900">{displayName}</div>
                {isCurrentUser && (
                  <span className="px-2 py-0.5 ml-2 text-xs font-normal leading-4 text-neutral-900 bg-white border border-gray-200 rounded">
                    You
                  </span>
                )}
              </div>
              {/* Resolved address */}
              <div className="text-xs font-normal leading-4 text-gray-500">
                {resolvedAddress || editValue}
              </div>
            </div>
          </div>

          {/* Delete button */}
          {totalAdmins > 1 && (
            <Icon
              icon="ph:trash"
              className="w-5 h-5 text-gray-400 transition-colors cursor-pointer hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index, displayName);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
