import { getFileBySlug, getFiles } from "../../utils/mdx";
import { PageSEO } from "../../components/SEO";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Header from "../../components/Header";
import { Icon } from "@iconify/react";
import { useState } from "react";

const navDict = {
  Introduction: { file: "index" },
  API: {
    file: "api_routes",
    children: {
      "Set Name": { file: "set-name" },
      "Claim Name": { file: "claim-name" },
      "Get Names": { file: "get-names" },
      "Search Names": { file: "search-names" },
      "Delete Name": { file: "delete-name" },
      "Set Domain": { file: "set-domain" },
      "Get Domain": { file: "get-domain" },
    },
  },
  "Admin Panel": { file: "admin_panel" },
  "Gasless DNS": { file: "gasless-dns" },
};
const fileNameLookup = {
  index: "Introduction",
  api_routes: "API",
  "set-name": "Set Name",
  "claim-name": "Claim Name",
  "get-names": "Get Names",
  "search-names": "Search Names",
  "delete-name": "Delete Name",
  "set-domain": "Set Domain",
  "get-domain": "Get Domain",
  admin_panel: "Admin Panel",
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
  return (
    <>
      <div className="flex justify-center bg-neutral-50 ">
        <div className="w-full overflow-hidden flex flex-col max-w-[1536px]">
          <Header subtitle="Docs" />
          <PageSEO title={"NameStone Docs"} description={"NameStone Docs"} />

          <div className="flex justify-start w-full px-8 lg:px-32 pt-[76px] md:pt-[88px]  max-w-[1536px]">
            {/* Desktop Menu */}
            <div className="flex-col items-start justify-start hidden py-10 border-t border-brownblack-50 sm:flex">
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

              <div className="justify-start flex-1 border-t sm:border-l border-brownblack-50 ">
                <div className="w-full py-6 sm:py-10 sm:pl-10 ">
                  <ReactMarkdown
                    components={{
                      li: ({ node, ...props }) => {
                        if (typeof props.inline === "boolean")
                          props.inline = props.inline.toString();
                        return <li className="mb-6" {...props} />;
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
                        if (props.inline) {
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
                    {content}
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
