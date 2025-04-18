import React from "react";
import AuthContentContainer from "../components/Admin/AuthContentContainer";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Listbox, Dialog } from "@headlessui/react";
import { Icon } from "@iconify/react";
import Button from "../components/Button";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

export default function SuperAdmin() {
  const { data: session, status: authStatus } = useSession();
  const [brandUrls, setBrandUrls] = useState([]);

  const [brandDict, setBrandDict] = useState({});
  const [selectedBrand, setSelectedBrand] = useState(null);

  // keep track of which tab is selected
  // brand_info, domain_info, admins, api_key
  const [selectedTab, setSelectedTab] = useState("brand_info");
  const [dataLoading, setDataLoading] = useState(false);
  const [brandData, setBrandData] = useState({});

  const [saveDisabled, setSaveDisabled] = useState(true);
  const [savePending, setSavePending] = useState(false);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // fetch to get allowed domains after connect
  useEffect(() => {
    if (authStatus === "authenticated" && brandUrls.length === 0) {
      fetch("/api/admin/allowed-brands").then((res) =>
        res.json().then((data) => {
          if (res.status === 200 && data.superAdmin) {
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
  }, [authStatus, session, brandUrls]);
  // fetch to populate data
  useEffect(() => {
    if (!selectedBrand) return;
    setDataLoading(true);
    setBrandData({});
    if (selectedTab === "brand_info") {
      fetch(
        "/api/admin/get-brand-info?" +
          new URLSearchParams({ domain: selectedBrand?.domain })
      ).then((res) =>
        res.json().then((data) => {
          if (res.status === 200) {
            setBrandData(data);
            setDataLoading(false);
          } else {
            console.log(data);
          }
        })
      );
    } else if (selectedTab === "api_key") {
      fetch(
        "/api/admin/get-api-key?" +
          new URLSearchParams({ domain_id: selectedBrand?.domain_id })
      ).then((res) =>
        res.json().then((data) => {
          if (res.status === 200) {
            data.domain_id = selectedBrand?.domain_id;
            setBrandData(data);
            setDataLoading(false);
          } else {
            console.log(data);
          }
        })
      );
    }
  }, [selectedBrand, selectedTab]);

  function changeTab(tab) {
    setSelectedTab(tab);
  }

  function createBrand(domain, name, url, network) {
    fetch("/api/admin/create-brand", {
      method: "POST",
      body: JSON.stringify({
        domain,
        name,
        url,
        network,
      }),
    }).then((res) => {
      setBrandModalOpen(false);
      if (res.status === 200) {
        fetch("/api/admin/allowed-brands").then((res) =>
          res.json().then((data) => {
            if (res.status === 200 && data.superAdmin) {
              setBrandUrls(data.brandUrls);
              setBrandDict(data.brandDict);
              setSelectedBrand(data.brandDict[url]);
            } else {
              setBrandUrls([]);
              console.log(data);
            }
          })
        );
      }
    });
  }

  function changeBrandData(key, value) {
    setBrandData((prevState) => {
      return { ...prevState, [key]: value };
    });
    setSaveDisabled(false);
  }

  function addTextRecord() {
    let textRecords = brandData.text_records;
    textRecords.push(["", ""]);
    setBrandData((prevState) => {
      // shallow copy
      let tempState = Object.assign({}, prevState);
      tempState.text_records = textRecords;
      return tempState;
    });
    setSaveDisabled(false);
  }

  function deleteTextRecord(index) {
    let textRecords = brandData.text_records;
    textRecords.splice(index, 1);
    setBrandData((prevState) => {
      // shallow copy
      let tempState = Object.assign({}, prevState);
      tempState.text_records = textRecords;
      return tempState;
    });
    setSaveDisabled(false);
  }

  function saveChanges() {
    let url;
    if (selectedTab === "brand_info") {
      url = "/api/admin/save-brand-info";
    } else if (selectedTab === "api_key") {
      url = "/api/admin/save-api-key";
      if (!brandData.domain_id && selectedBrand) {
        brandData.domain_id = selectedBrand.domain_id;
      }
    }
    setSavePending(true);
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        brandData,
      }),
    })
      .then((res) => {
        res.json().then((json) => {
          setSavePending(false);
          setSaveDisabled(true);

          // Add toast notification for successful API key save
          if (res.status === 200 && selectedTab === "api_key") {
            toast.success("API key saved successfully");
          }
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // if they haven't authenticated, they need to click connect
  if (authStatus !== "authenticated") {
    return (
      <AuthContentContainer>
        <div className="flex items-center justify-center mx-auto text-center">
          <div className="text-sm font-bold text-brownblack-700">
            Connect your wallet to view.
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
      {/*Left Bar*/}
      <div className="flex-grow flex-1 max-w-sm border-r-[1px] border-brownblack-20 ">
        <div className="ml-4 md:ml-16 mt-7">
          <div className="flex flex-col w-full ">
            <div className="w-full text-sm font-bold md:text-base text-brownblack-700">
              Brands
            </div>

            <Button
              buttonText="+ Create Brand"
              className={"float-left ml-0 mt-2 mb-6"}
              onClick={() => setBrandModalOpen(true)}
            />
            <div className="flex-col w-full pr-8 mb-1">
              <Listbox
                value={selectedBrand.name}
                onChange={(brandUrl) => setSelectedBrand(brandDict[brandUrl])}
              >
                <Listbox.Button className="flex items-center justify-between w-full px-2 py-1 text-sm font-bold text-left rounded-md bg-brownblack-50">
                  {selectedBrand.name}
                  <Icon icon="ep:arrow-down-bold" className="w-4 h-4" />
                </Listbox.Button>
                <Listbox.Options className="border rounded-md border-brownblack-50">
                  {brandUrls.map((brandUrl) => {
                    if (brandUrl === selectedBrand.url_slug) return null;
                    return (
                      <Listbox.Option
                        className="px-2 py-1 text-sm font-bold text-left rounded-md cursor-pointer hover:bg-brownblack-50"
                        key={brandUrl}
                        value={brandUrl}
                      >
                        {brandDict[brandUrl].name}
                      </Listbox.Option>
                    );
                  })}
                </Listbox.Options>
              </Listbox>
            </div>
            <div
              onClick={() => changeTab("brand_info")}
              className={`px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-brownblack-20 ${
                selectedTab === "brand_info" ? "bg-brownblack-20" : ""
              }`}
            >
              Brand Information
            </div>

            <div
              onClick={() => changeTab("api_key")}
              className={`px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-brownblack-20 ${
                selectedTab === "api_key" ? "bg-brownblack-20" : ""
              }`}
            >
              API Key
            </div>
          </div>
          <Button
            buttonText="Delete Brand"
            color="red"
            className={"mt-20 float-left ml-0"}
            onClick={() => setDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/*Main Content*/}
      <BrandModal
        setOpen={setBrandModalOpen}
        open={brandModalOpen}
        createBrand={createBrand}
      />
      <DeleteModal
        setOpen={setDeleteModalOpen}
        open={deleteModalOpen}
        selectedBrand={selectedBrand}
      />
      <div className="flex-grow max-w-3xl flex-2">
        {dataLoading && (
          <div className="flex-col items-start w-full h-[100rem] p-6"></div>
        )}
        {!dataLoading && selectedTab === "brand_info" && (
          <div className="flex-col items-start w-full p-6">
            <div className="mb-1 text-base font-bold text-brownblack-700">
              Brand Information
            </div>
            <div className="mb-4 text-sm text-brownblack-700">
              General information. Required for giveaways.
            </div>
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Subname Limit{" "}
              <span className="mb-2 text-xs italic font-normal opacity-75 text-brownblack-700">
                (0 for no limit)
              </span>
            </div>

            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData?.name_limit}
              onChange={(e) => changeBrandData("name_limit", e.target.value)}
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Brand Name
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.name}
              onChange={(e) => changeBrandData("name", e.target.value)}
            />

            <div className="mb-2 text-sm font-bold text-brownblack-500">
              URL Slug
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.url_slug}
              onChange={(e) => changeBrandData("url_slug", e.target.value)}
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Claim Link (overrides URL Slug for claims)
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.claim_slug || ""}
              onChange={(e) => changeBrandData("claim_slug", e.target.value)}
            />

            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Description
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.description}
              onChange={(e) => changeBrandData("description", e.target.value)}
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Banner Image
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.banner_image}
              onChange={(e) => changeBrandData("banner_image", e.target.value)}
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Footer Image
            </div>
            <input
              className="w-full px-4 py-2 mb-8 border rounded-md border-brownblack-50"
              value={brandData.footer_image}
              onChange={(e) => changeBrandData("footer_image", e.target.value)}
            />
            <div className="my-1 text-base font-bold text-brownblack-700">
              Sharing Settings
            </div>
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Share with Data providers
            </div>
            <input
              type="checkbox"
              className="w-6 h-6 px-4 py-2 mb-4 border rounded-md cursor-pointer border-brownblack-50"
              checked={brandData.share_with_data_providers}
              onChange={(e) =>
                changeBrandData(
                  "share_with_data_providers",
                  !brandData.share_with_data_providers
                )
              }
            />
            <div className="my-1 text-base font-bold text-brownblack-700">
              Community Page
            </div>
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Show converse link
            </div>
            <input
              type="checkbox"
              className="w-6 h-6 px-4 py-2 mb-4 border rounded-md cursor-pointer border-brownblack-50"
              checked={brandData.show_converse_link}
              onChange={(e) =>
                changeBrandData(
                  "show_converse_link",
                  !brandData.show_converse_link
                )
              }
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Show mailchain link
            </div>
            <input
              type="checkbox"
              className="w-6 h-6 px-4 py-2 mb-4 border rounded-md cursor-pointer border-brownblack-50"
              checked={brandData.show_mailchain_link}
              onChange={(e) =>
                changeBrandData(
                  "show_mailchain_link",
                  !brandData.show_mailchain_link
                )
              }
            />
            <div className="my-1 text-base font-bold text-brownblack-700">
              User Defaults
            </div>

            <div className="mb-4 text-sm text-brownblack-700">
              Required for giveaways.
            </div>
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Description
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.default_description}
              onChange={(e) =>
                changeBrandData("default_description", e.target.value)
              }
            />
            <div className="mb-2 text-sm font-bold text-brownblack-500">
              Avatar
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={brandData.default_avatar}
              onChange={(e) =>
                changeBrandData("default_avatar", e.target.value)
              }
            />
          </div>
        )}
        {/* API Key */}
        {!dataLoading && selectedTab === "api_key" && (
          <div className="flex-col items-start w-full p-6">
            <div className="mb-1 text-base font-bold text-brownblack-700">
              API Key
            </div>
            <div className="mb-4 text-sm text-brownblack-700">
              Key that allows access to the API
            </div>
            {brandData?.api_key && (
              <>
                <div className="mb-2 text-sm font-bold text-brownblack-500">
                  Key
                </div>
                <div className="flex items-center w-full mb-4">
                  <input
                    className="w-full px-4 py-2 border rounded-md border-brownblack-50"
                    value={brandData?.api_key}
                    onChange={(e) => changeBrandData("api_key", e.target.value)}
                  />
                  <div
                    className="flex items-center justify-center w-10 h-10 ml-2 text-white bg-orange-600 rounded-md cursor-pointer hover:bg-orange-700"
                    onClick={() => {
                      // Generate a UUID v4 for the API key
                      const randomKey = uuidv4();
                      changeBrandData("api_key", randomKey);
                    }}
                    title="Generate New Key"
                  >
                    <Icon icon="mdi:refresh" className="w-5 h-5" />
                  </div>
                </div>
              </>
            )}
            {!brandData?.api_key && (
              <>
                <div className="mb-2 text-sm font-bold text-brownblack-500">
                  No API key found. Generate one?
                </div>
                <Button
                  buttonText="Generate API Key"
                  onClick={() => {
                    // Generate a UUID v4 for the API key
                    const randomKey = uuidv4();
                    changeBrandData("api_key", randomKey);
                  }}
                />
              </>
            )}
          </div>
        )}

        <Button
          buttonText="Save"
          disabled={saveDisabled}
          pending={savePending}
          className={"mb-16"}
          onClick={saveChanges}
        />
      </div>
      {/*Right Bar*/}
      <div className="flex-1 bg-white"></div>
    </AuthContentContainer>
  );
}

function BrandModal({ open, setOpen, createBrand }) {
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [network, setNetwork] = useState("mainnet");

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
            Create Brand
          </Dialog.Title>
          <div className="flex flex-col mt-8">
            <div className="text-sm font-bold text-brownblack-700">
              Brand Name
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="text-sm font-bold text-brownblack-700">
              Domain Name
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <div className="text-sm font-bold text-brownblack-700">
              url slug
            </div>
            <input
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="text-sm font-bold text-brownblack-700">network</div>
            {/* network select */}
            <select
              className="w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              <option value="mainnet">Mainnet</option>
              <option value="sepolia">Sepolia</option>
            </select>
          </div>
          <div className="flex items-center justify-around mt-6">
            <Button
              buttonText="Create Brand"
              onClick={() => {
                createBrand(domain, name, url, network);
              }}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function DeleteModal({ open, setOpen, selectedBrand }) {
  const [errorMessages, setErrorMessages] = useState("");
  // Clear error state on every open/close
  useEffect(() => {
    setErrorMessages("");
  }, [open]);

  // Delete brand
  function deleteBrand(domain_id) {
    fetch("/api/admin/delete-domain", {
      method: "POST",
      body: JSON.stringify({
        domain_id,
      }),
    })
      .then((res) => {
        if (res.status === 200) {
          setOpen(false);
          window.location.reload();
        } else {
          res.json().then((json) => {
            setErrorMessages(json.error);
          });
        }
      })
      .catch((err) => {
        setErrorMessages(err);
        console.log(err);
      });
  }
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
            Delete Brand
          </Dialog.Title>
          <div className="flex flex-col mt-8">
            <div className="text-sm font-bold text-brownblack-700">
              Are you sure you want to delete this brand?
            </div>
            <div className="text-sm text-brownblack-700">
              domain_id: {selectedBrand?.domain_id} <br />
              domain: {selectedBrand?.domain} <br />
              url_slug: {selectedBrand?.url_slug}
              <br />
              brand_name: {selectedBrand?.name}
              <br />
            </div>
            <div className="text-sm font-bold text-red-500">
              {errorMessages}
            </div>
          </div>
          <div className="flex items-center justify-around mt-6">
            <Button
              buttonText="Delete"
              color="red"
              onClick={() => {
                deleteBrand(selectedBrand.domain_id);
              }}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
