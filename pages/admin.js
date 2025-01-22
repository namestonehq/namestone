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
  const [nameId, setNameId] = useState(null); // id of name to edit
  const [admins, setAdmins] = useState([]);
  const [domainId, setDomainId] = useState(null);
  const [saveSettingsDisabled, setSaveSettingsDisabled] = useState(true);
  const [saveSettingsPending, setSaveSettingsPending] = useState(false);
  const [apiKey, setApiKey] = useState("loading");
  const [adminErrorMsg, setAdminErrorMsg] = useState("");
  //add or edit
  const [activeTab, setActiveTab] = useState("Subnames");
  const [currentNameData, setCurrentNameData] = useState(blankNameData);
  const [saveNamePending, setSaveNamePending] = useState(false);
  const [mainnetOpen, setMainnetOpen] = useState(true);
  const [sepoliaOpen, setSepoliaOpen] = useState(true);

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

  // fetch to populate table
  useEffect(() => {
    if (!selectedBrand) return;
    // get names and replace data
    fetch(
      "/api/admin/list-subdomains?" +
        new URLSearchParams({
          domain: selectedBrand?.domain,
          network: selectedBrand?.network,
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
  function setName(nameData) {
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

    fetch("/api/admin/set-subdomain", {
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
    }).then((res) => {
      res
        .json()
        .then((data) => {
          if (res.status === 200) {
            setAddNameModalOpen(false);
            setNameErrorMsg("");
            setAddressErrorMsg("");
            toast.success("Subdomain set successfully");
          } else {
            setNameErrorMsg(data.error);
            console.log(data);
          }
        })
        .catch((err) => {
          console.log(err);
          console.res;
        })
        .finally(() => {
          setSaveNamePending(false);
          // get names and replace data
          fetch(
            "/api/admin/list-subdomains?" +
              new URLSearchParams({
                domain: selectedBrand?.domain,
                network: selectedBrand?.network,
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
        });
    });
  }
  // function to delete a name
  function deleteName(name) {
    const url =
      selectedBrand.network === "mainnet"
        ? "/api/public_v1/delete-name"
        : "/api/public_v1_sepolia/delete-name";

    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        name: name,
        domain: selectedBrand.domain,
      }),
    }).then((res) => {
      res
        .json()
        .then((data) => {
          if (res.status === 200) {
            // get names and replace data
            fetch(
              "/api/admin/list-subdomains?" +
                new URLSearchParams({
                  domain: selectedBrand?.domain,
                  network: selectedBrand?.network,
                })
            ).then((res) => {
              res.json().then((data) => {
                if (res.status === 200) {
                  setSubdomains(data);
                  toast.success("Subdomain deleted successfully");
                } else {
                  console.log(data);
                }
              });
            });
          } else {
            console.log(data);
          }
        })
        .catch((err) => {
          console.log(err);
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
      setCurrentNameData(blankNameData);
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
          )}
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
              <SubdomainTable
                subdomains={subdomains}
                deleteName={deleteName}
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
