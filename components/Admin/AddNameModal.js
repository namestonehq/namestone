import { Dialog } from "@headlessui/react";
import Image from "next/image";
import { useState } from "react";

export default function AddNameModal({
  modalType,
  open,
  setOpen,
  currentNameData,
  setCurrentNameHelper,
  setName,
  deleteName,
  nameErrorMsg,
  addressErrorMsg,
}) {
  const [activeTab, setActiveTab] = useState("text"); // subname, text, address
  const tabs = ["text", "addresses"];

  const TAB_CONTENT = {
    text: (
      <div className="flex flex-col h-[66vh] overflow-y-scroll">
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
            value={currentNameData.text_records?.avatar || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "text_records", "avatar")
            }
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
            value={currentNameData.text_records?.description || ""}
            onChange={(e) =>
              setCurrentNameHelper(
                e.target.value,
                "text_records",
                "description"
              )
            }
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
            value={currentNameData.text_records?.location || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "text_records", "location")
            }
            placeholder="New York City"
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
              value={currentNameData.text_records?.url || ""}
              onChange={(e) =>
                setCurrentNameHelper(e.target.value, "text_records", "url")
              }
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
              value={currentNameData.text_records?.["com.twitter"] || ""}
              onChange={(e) =>
                setCurrentNameHelper(
                  e.target.value,
                  "text_records",
                  "com.twitter"
                )
              }
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
              value={currentNameData.text_records?.["com.github"] || ""}
              onChange={(e) =>
                setCurrentNameHelper(
                  e.target.value,
                  "text_records",
                  "com.github"
                )
              }
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
              value={currentNameData.text_records?.["com.discord"] || ""}
              onChange={(e) =>
                setCurrentNameHelper(
                  e.target.value,
                  "text_records",
                  "com.discord"
                )
              }
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
              value={currentNameData.text_records?.["com.telegram"] || ""}
              onChange={(e) =>
                setCurrentNameHelper(
                  e.target.value,
                  "text_records",
                  "com.telegram"
                )
              }
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
              value={currentNameData.contenthash}
              onChange={(e) =>
                setCurrentNameHelper(e.target.value, "contenthash")
              }
            />
          </div>
          {/* <button className="text-xs text-left text-orange-800">
          + Text Record
        </button> */}
        </div>
      </div>
    ),
    addresses: (
      <div className="flex flex-col gap-2 mt-4 h-[66vh] overflow-y-scroll">
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
            value={currentNameData.coin_types?.["0"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "0")
            }
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
            value={currentNameData.coin_types?.["501"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "501")
            }
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
            value={currentNameData.coin_types?.["8453"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "8453")
            }
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
            value={currentNameData.coin_types?.["614"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "614")
            }
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
            value={currentNameData.coin_types?.["534352"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "534352")
            }
          />
        </div>
        {/* Arbitrum */}
        <div className="text-sm font-bold text-brownblack-700">Arbitrum</div>
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
            value={currentNameData.coin_types?.["42161"] || ""}
            onChange={(e) =>
              setCurrentNameHelper(e.target.value, "coin_types", "42161")
            }
          />
        </div>
        {/* <button className="text-xs text-left text-orange-800">+ Address</button> */}
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
        onClick={() => {
          setActiveTab("text");
        }}
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
          value={currentNameData.name}
          onChange={(e) => setCurrentNameHelper(e.target.value, "name")}
        />
        <div className="flex flex-row justify-between">
          <div className="text-sm font-bold text-brownblack-700">Address</div>
          <div className="text-sm text-red-500">{addressErrorMsg}</div>
        </div>
        <input
          className="w-full px-4 py-2 mb-4 font-mono text-sm border rounded-md border-brownblack-50"
          value={currentNameData.address}
          onChange={(e) => setCurrentNameHelper(e.target.value, "address")}
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
              >
                <span className="text-sm">&lt;</span> {currentNameData.name}.
                {currentNameData.domain}
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
            setOpen={setOpen}
            deleteName={deleteName}
            modalType={modalType}
          />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function ButtonRow({
  currentNameData,
  setOpen,
  setName,
  deleteName,
  modalType,
}) {
  return (
    <div className="flex flex-row-reverse justify-between w-full">
      <button
        className="flex bg-orange-500 items-center justify-center py-2 min-w-[100px] text-sm font-bold rounded-lg disabled:cursor-not-allowed text-brownblack-700 md:block"
        onClick={() => {
          console.log(currentNameData);
          setName(currentNameData);
          setOpen(false);
        }}
      >
        Save
      </button>
      {/* {modalType === "edit" && (
        <button
          onClick={() => {
            deleteName(currentNameData.name);
            setOpen(false);
          }}
          className="flex items-end mb-2 ml-1 text-sm font-bold text-red-500 transition-colors duration-300 hover:text-red-600 hover:cursor-pointer"
        >
          Delete
        </button>
      )} */}
    </div>
  );
}
