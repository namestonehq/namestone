import { getFileBySlug, getFiles } from "../../utils/mdx";
import { PageSEO } from "../../components/SEO";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Header from "../../components/Header";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

const navDict = {
  Introduction: { file: "index" },
  "SDK Quickstart": { file: "sdk-quickstart" },
  API: {
    file: "api-routes",
    children: {
      "Set Name": { file: "set-name" },
      "Get Names": { file: "get-names" },
      "Search Names": { file: "search-names" },
      "Delete Name": { file: "delete-name" },
      "Set Domain": { file: "set-domain" },
      "Get Domain": { file: "get-domain" },
      "Enable Domain": { file: "enable-domain" },
      "Get SIWE Message": { file: "get-siwe-message" },
    },
  },
  "Admin Panel": { file: "admin_panel" },
  "Gasless DNS": { file: "gasless-dns" },
};
const fileNameLookup = {
  index: "Introduction",
  "sdk-quickstart": "SDK Quickstart",
  "api-routes": "API",
  "set-name": "Set Name",
  "get-names": "Get Names",
  "search-names": "Search Names",
  "delete-name": "Delete Name",
  "set-domain": "Set Domain",
  "get-domain": "Get Domain",
  admin_panel: "Admin Panel",
  "get-siwe-message": "Get Siwe Message",
  "enable-domain": "Enable Domain",
};

export async function getStaticPaths() {
  const posts = getFiles("docs");
  let paths = posts.map((p) => {
    let slug = p.replace(/\.(mdx|md)/, "");
    return {
      params: {
        slug: [slug],
      },
    };
  });
  paths.push({ params: { slug: [""] } });
  return {
    paths: paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  let fileName;
  if (!params.slug) {
    fileName = "index";
  } else {
    fileName = params.slug.join("/");
  }
  const frontMatter = await getFileBySlug(fileName, "docs");
  const content = frontMatter.content;

  return { props: { content, fileName } };
}

export default function Docs({ content, fileName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [network, setNetwork] = useState("Mainnet");
  return (
    <>
      <div className="flex justify-center bg-neutral-50 ">
        <div className="w-full overflow-hidden flex flex-col max-w-[1536px]">
          <Header subtitle="Docs" />
          <PageSEO title={"NameStone Docs"} description={"NameStone Docs"} />

          <div className="flex justify-start w-full px-8 lg:px-32 pt-[76px] md:pt-[88px]  max-w-[1536px]">
            {/* Desktop Menu */}
            <div className="flex-col items-start justify-start hidden py-10 border-t border-brownblack-50 sm:flex">
              {/* Toggle Network */}
              <div className="flex p-1 mt-2 mb-4 text-sm rounded-lg bg-neutral-200">
                <button
                  onClick={() => setNetwork("Mainnet")}
                  className={`px-4  rounded-lg transition ${
                    network === "Mainnet"
                      ? "bg-white shadow text-stone-900  py-1"
                      : "bg-neutral-200"
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => setNetwork("Sepolia")}
                  className={`px-4 rounded-lg transition ${
                    network === "Sepolia"
                      ? "bg-white shadow text-black py-1"
                      : "bg-neutral-200"
                  }`}
                >
                  Sepolia
                </button>
              </div>
              {Object.keys(navDict).map((item) => (
                <div key={item}>
                  <Link
                    href={`/docs/${navDict[item].file}`}
                    className={`flex text-sm  text-neutral-900 font-bold text-left justify-between items-center rounded-md py-1 my-1 px-3 cursor-pointer w-[250px] ${
                      fileName === navDict[item].file ? "bg-neutral-200" : ""
                    }`}
                  >
                    {item}
                  </Link>
                  {navDict[item].children && (
                    <div className="flex flex-col items-start justify-start ml-4">
                      {Object.keys(navDict[item].children).map((child) => (
                        <Link
                          key={child}
                          href={`/docs/${navDict[item].children[child].file}`}
                          className={`flex text-sm  text-left justify-between items-center my-1  rounded-md py-1 px-3 cursor-pointer w-full ${
                            fileName === navDict[item].children[child].file
                              ? "bg-neutral-200"
                              : ""
                          }`}
                        >
                          {child}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-start justify-between py-2 border-t border-brownblack-50 sm:hidden text-neutral-900"
              >
                {/* Name of current page */}
                <div className="text-sm font-bold text-left">
                  {fileNameLookup[fileName]}
                </div>
                {/* chevron down to open menu */}
                <Icon icon="bi:chevron-down" className="w-6 h-6" />
              </div>
              {/* Mobile Menu */}
              {menuOpen && (
                <div className="flex flex-col items-start justify-start w-full p-2 bg-white border rounded-md border-brownblack-50 sm:hidden">
                  {/* Toggle Network */}
                  <div className="flex p-1 mt-2 mb-4 text-sm rounded-lg bg-neutral-200">
                    <button
                      onClick={() => setNetwork("Mainnet")}
                      className={`px-4  rounded-lg transition ${
                        network === "Mainnet"
                          ? "bg-white shadow text-stone-900  py-1"
                          : "bg-neutral-200"
                      }`}
                    >
                      Mainnet
                    </button>
                    <button
                      onClick={() => setNetwork("Sepolia")}
                      className={`px-4 rounded-lg transition ${
                        network === "Sepolia"
                          ? "bg-white shadow text-black py-1"
                          : "bg-neutral-200"
                      }`}
                    >
                      Sepolia
                    </button>
                  </div>
                  {Object.keys(navDict).map((item) => (
                    <div key={item}>
                      <Link
                        href={`/docs/${navDict[item].file}`}
                        onClick={() => setMenuOpen(false)}
                        className={`flex text-sm  text-neutral-900 font-bold text-left justify-between items-center rounded-md py-1 my-1 px-3 cursor-pointer w-[250px] ${
                          fileName === navDict[item].file
                            ? "bg-neutral-200"
                            : ""
                        }`}
                      >
                        {item}
                      </Link>
                      {navDict[item].children && (
                        <div className="flex flex-col items-start justify-start">
                          {Object.keys(navDict[item].children).map((child) => (
                            <Link
                              key={child}
                              onClick={() => setMenuOpen(false)}
                              href={`/docs/${navDict[item].children[child].file}`}
                              className={`flex text-sm  text-left justify-between items-center my-1  rounded-md py-1 px-3 cursor-pointer w-full ${
                                fileName === navDict[item].children[child].file
                                  ? "bg-neutral-200"
                                  : ""
                              }`}
                            >
                              {child}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="justify-start flex-1 border-t sm:border-l border-brownblack-50">
                <div className="w-full max-w-full py-6 sm:py-10 sm:pl-10 ">
                  <ReactMarkdown
                    components={{
                      li: ({ node, ordered, ...props }) => {
                        if (typeof props.inline === "boolean")
                          props.inline = props.inline.toString();
                        return (
                          <li
                            className={`mb-6 ${
                              ordered ? "" : "list-disc"
                            } ml-6`}
                            {...props}
                          />
                        );
                      },
                      // Map `h1` (`# heading`)
                      h1: ({ node, ...props }) => (
                        <div
                          className="mb-5 text-[32px] font-semibold whitespace-normal break-all"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <div
                          className="mb-5  text-[20px] font-bold whitespace-normal break-all"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <div
                          className="mb-5 whitespace-normal text-[16px] font-bold break-word"
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <div
                          className="mb-5 text-[16px] font-bold whitespace-normal break-word"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <div
                          className="mb-5 text-[16px] whitespace-normal break-word leading-7"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-orange-800 break-all whitespace-normal"
                          {...props}
                        />
                      ),
                      pre: ({ node, ...props }) => {
                        if (typeof props.inline === "boolean")
                          props.inline = props.inline.toString();
                        return (
                          <div
                            className="p-5 mb-6 rounded-lg bg-neutral-800"
                            {...props}
                          />
                        );
                      },
                      code: ({ node, ...props }) => {
                        const match = /language-(\w+)/.exec(
                          props.className || ""
                        );
                        const language = match ? match[1] : "";

                        const codeString = String(props.children).replace(
                          /\n$/,
                          ""
                        );
                        console.log("language:", language);
                        console.log("Code content:", codeString);
                        if (match) {
                          return (
                            <div className="relative max-w-full overflow-hidden">
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="pre"
                                {...props}
                                customStyle={{}}
                                codeTagProps={{
                                  className: "whitespace-pre break-words",
                                }}
                                wrapLines={true}
                                wrapLongLines={true}
                                className="!mt-0 !mb-0 p-4"
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        } else if (props.inline) {
                          if (typeof props.inline === "boolean")
                            props.inline = props.inline.toString();
                          return (
                            <code
                              className="px-2 py-1 whitespace-break-spaces flex-wrap  border-neutral-200 border bg-neutral-100 rounded-lg break-all text-[14px]  leading-5 "
                              {...props}
                            />
                          );
                        } else {
                          if (typeof props.inline === "boolean")
                            props.inline = props.inline.toString();
                          return (
                            <code
                              className=" py-1 whitespace-break-spaces flex-wrap text-white  bg-neutral-800 rounded-lg break-all text-[16px]  leading-5 "
                              {...props}
                            />
                          );
                        }
                      },
                    }}
                  >
                    {network === "Mainnet"
                      ? content
                      : content
                          .replace(/public_v1/g, "public_v1_sepolia")
                          .replace(
                            "NameStone(<YOUR_API_KEY_HERE>)",
                            "NameStone(<YOUR_API_KEY_HERE>, {network: 'sepolia'})"
                          )}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
