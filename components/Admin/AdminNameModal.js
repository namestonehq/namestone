import { Dialog } from "@headlessui/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { chains } from "../../utils/ChainUtils";
import { ensFontFallback } from "../../utils/FrontUtils";

export default function AdminNameModal({
  editingDomain,
  open,
  setOpen,
  currentNameData,
  setCurrentNameHelper,
  setName,
  savePending,
  errorMsg,
  errorField,
}) {
  const [activeTab, setActiveTab] = useState("subname"); // subname, text, address
  const tabs = ["text", "addresses"];

  // reset active tab when modal is opened or closed
  useEffect(() => {
    setActiveTab("subname");
  }, [open]);

  const TAB_CONTENT = {
    text: (
      <div className="flex flex-col h-[66vh] overflow-y-scroll px-1">
        <div className="flex flex-col mt-4">
          {/* Avatar */}
          <div className="flex flex-row justify-between">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Avatar
            </div>
          </div>
          <InputRow
            fieldName="avatar"
            value={currentNameData.text_records?.avatar}
            placeholder="https://"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />

          {/* Description */}
          <div className="flex flex-row justify-between">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Description
            </div>
          </div>
          <InputRow
            fieldName="description"
            value={currentNameData.text_records?.description}
            placeholder="Open source developer coding on ens"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />

          {/* Location */}
          <div className="flex flex-row justify-between">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Location
            </div>
          </div>
          <InputRow
            fieldName="location"
            value={currentNameData.text_records?.location}
            placeholder="New York City"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />

          {/* Header */}
          <div className="flex flex-row justify-between">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Header
            </div>
          </div>
          <InputRow
            fieldName="header"
            value={currentNameData.text_records?.header}
            placeholder="https://"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />

          {/* Status */}
          <div className="flex flex-row justify-between">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Status
            </div>
          </div>
          <InputRow
            fieldName="status"
            value={currentNameData.text_records?.status}
            placeholder="Going to the moon!"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
        </div>
        {/* links */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-row justify-between ">
            <div className="mb-2 text-sm font-bold text-brownblack-700">
              Links
            </div>
          </div>
          {/* Website */}
          <InputRow
            imgUrl="/images/icon-link.png"
            fieldName="url"
            value={currentNameData.text_records?.url}
            placeholder="https://"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* X */}
          <InputRow
            imgUrl="/images/logo-x-black.png"
            fieldName="com.twitter"
            value={currentNameData.text_records?.["com.twitter"]}
            placeholder="@namestonehq"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* Github */}
          <InputRow
            imgUrl="/images/logo-github-brown.svg"
            fieldName="com.github"
            value={currentNameData.text_records?.["com.github"]}
            placeholder="resolverworks"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* Discord */}
          <InputRow
            imgUrl="/images/logo-discord.png"
            fieldName="com.discord"
            value={currentNameData.text_records?.["com.discord"]}
            placeholder="slobo.eth"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* Telegram */}
          <InputRow
            imgUrl="/images/logo-telegram.png"
            fieldName="com.telegram"
            value={currentNameData.text_records?.["com.telegram"]}
            placeholder="superslobo"
            key2="text_records"
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* IPFS */}
          <InputRow
            imgUrl="/images/logo-ipfs.png"
            fieldName="contenthash"
            value={currentNameData.contenthash}
            placeholder="ipfs://bafyb...."
            key2={undefined}
            setCurrentNameHelper={setCurrentNameHelper}
            errorField={errorField}
          />
          {/* <button className="text-xs text-left text-orange-800">
          + Text Record
        </button> */}
        </div>
      </div>
    ),
    addresses: (
      <div className="flex flex-col gap-2 mt-4 h-[66vh] overflow-y-scroll px-1">
        {chains.map((chain) => (
          <div key={chain.coin_type}>
            <div className="text-sm font-bold text-brownblack-700">
              {chain.name}
            </div>
            <InputRow
              imgUrl={chain.logo}
              fieldName={chain.coin_type.toString()}
              value={currentNameData.coin_types?.[chain.coin_type]}
              placeholder={chain.placeholder}
              key2="coin_types"
              setCurrentNameHelper={setCurrentNameHelper}
              errorField={errorField}
            />
          </div>
        ))}
        {/* <button className="text-xs text-left text-orange-800">+ Address</button> */}
      </div>
    ),
  };

  const SUBNAME_CONTENT = (
    <>
      <Dialog.Title
        className="text-base font-bold text-brownblack-700"
        style={{ fontFamily: ensFontFallback }}
      >
        {editingDomain
          ? `Edit ${currentNameData.domain}`
          : currentNameData === 0
          ? "Add a Name"
          : "Edit Name"}
      </Dialog.Title>
      <hr className="border-0 h-[0.5px] bg-brownblack-200/50 my-4"></hr>
      <button
        className="flex items-center gap-1 mt-2 ml-auto text-xs text-orange-800 hover:text-orange-600"
        onClick={() => {
          setActiveTab("text");
        }}
      >
        More Records <span className="text-sm">&gt;</span>
      </button>
      <div className="flex flex-col">
        {!editingDomain && (
          <>
            <div className="flex flex-row justify-between">
              <div className="text-sm font-bold text-brownblack-700">Name</div>
            </div>
            <InputRow
              fieldName="name"
              value={currentNameData.name}
              placeholder=""
              key2={undefined}
              setCurrentNameHelper={setCurrentNameHelper}
              errorField={errorField}
            />
          </>
        )}
        <div className="flex flex-row justify-between">
          <div className="text-sm font-bold text-brownblack-700">Address</div>
        </div>
        <InputRow
          fieldName="address"
          value={currentNameData.address}
          placeholder=""
          key2={undefined}
          setCurrentNameHelper={setCurrentNameHelper}
          errorField={errorField}
        />
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
          {activeTab === "subname" ? (
            SUBNAME_CONTENT
          ) : (
            <>
              <button
                className="flex items-center gap-1 mt-2 mb-8 mr-auto text-xs text-orange-800 transition-colors duration-300 hover:text-orange-400"
                onClick={() => setActiveTab("subname")}
                style={{ fontFamily: ensFontFallback }}
              >
                <span className="text-sm">&lt;</span>
                {editingDomain
                  ? currentNameData.domain
                  : `${currentNameData.name}.${currentNameData.domain}`}
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
          )}
          <ButtonRow
            currentNameData={currentNameData}
            setName={setName}
            savePending={savePending}
            errorMsg={errorMsg}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function ButtonRow({ currentNameData, setName, savePending, errorMsg }) {
  return (
    <div className="flex flex-row-reverse items-center justify-between w-full gap-2">
      <button
        className={`flex items-center justify-center py-2 min-w-[100px] text-sm font-bold rounded-lg disabled:cursor-not-allowed text-brownblack-700 md:block ${
          savePending || errorMsg ? "bg-orange-300" : "bg-orange-500"
        }`}
        onClick={() => {
          setName(currentNameData);
        }}
        disabled={savePending || !!errorMsg}
      >
        {savePending ? "..." : "Save"}
      </button>
      {errorMsg && <div className="text-sm text-red-500">{errorMsg}</div>}
    </div>
  );
}

function InputRow({
  imgUrl,
  fieldName,
  value,
  placeholder,
  key2,
  setCurrentNameHelper,
  errorField,
}) {
  // Helper function to determine input class based on error field
  const getInputClass = (field) => {
    const baseClass =
      "w-full px-4 py-2 mb-4 border rounded-md border-brownblack-50";
    const focusClass = "focus:ring-2 focus:ring-orange-400 focus:outline-none";
    const errorClass =
      "ring-2 ring-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none";

    if (errorField === field) {
      return `${baseClass} ${errorClass}`;
    }
    return `${baseClass} ring-1 ring-gray-300 ${focusClass}`;
  };

  return (
    <div className="relative">
      {imgUrl && (
        <Image
          src={imgUrl}
          width={18}
          height={18}
          alt="icon"
          className="absolute top-3 left-3"
        ></Image>
      )}
      <input
        className={`${getInputClass(fieldName)} ${imgUrl ? "pl-[40px]" : ""}`}
        placeholder={placeholder}
        value={value || ""}
        style={{ fontFamily: ensFontFallback }}
        onChange={(e) => setCurrentNameHelper(e.target.value, fieldName, key2)}
      />
    </div>
  );
}
