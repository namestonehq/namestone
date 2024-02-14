import { getFileBySlug, getFiles } from "../../utils/mdx";
import { PageSEO } from "../../components/SEO";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Header from "../../components/Header";
import { Icon } from "@iconify/react";

const navDict = {
  Introduction: { file: "index" },
  API: {
    file: "api_routes",
    children: {
      "Set Name": { file: "set-name" },
      "Claim Name": { file: "claim-name" },
      "Get Names": { file: "get-names" },
      "Search Names": { file: "search-names" },
      "Revoke Name": { file: "revoke-name" },
      "Set Domain": { file: "set-domain" },
    },
  },
  "Admin Panel": { file: "admin_panel" },
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
  return (
    <>
      <div className="flex flex-col justify-between bg-white h-fit">
        <Header subtitle="Docs" />
        <PageSEO title={"NameStone Docs"} description={"NameStone Docs"} />

        <div className="flex flex-wrap justify-start w-full px-6 pt-16 pb-4 mx-auto md:justify-center md:pt-24">
          <div className="flex flex-col items-start justify-start p-4 mt-4 mr-20 border rounded-md border-brownblack-50 h-fit ">
            {Object.keys(navDict).map((item) => (
              <div key={item}>
                <Link
                  href={`/docs/${navDict[item].file}`}
                  className={`flex text-base text-left justify-between items-center rounded-md py-1 my-1 px-3 cursor-pointer w-[250px] ${
                    fileName === navDict[item].file
                      ? "bg-orange-300"
                      : "bg-white"
                  }`}
                >
                  {item}
                  <div>
                    {navDict[item].children &&
                      !(
                        fileName === navDict[item].file ||
                        Object.keys(navDict[item].children)
                          .map(
                            (childName) =>
                              navDict[item].children[childName].file
                          )
                          .includes(fileName)
                      ) && (
                        <Icon
                          icon="tabler:chevron-right"
                          className={`text-base text-black `}
                        />
                      )}
                    {navDict[item].children &&
                      (fileName === navDict[item].file ||
                        Object.keys(navDict[item].children)
                          .map(
                            (childName) =>
                              navDict[item].children[childName].file
                          )
                          .includes(fileName)) && (
                        <Icon
                          icon="tabler:chevron-down"
                          className={`text-base text-black `}
                        />
                      )}
                  </div>
                </Link>
                {navDict[item].children &&
                  (fileName === navDict[item].file ||
                    Object.keys(navDict[item].children)
                      .map(
                        (childName) => navDict[item].children[childName].file
                      )
                      .includes(fileName)) && (
                    <div className="flex flex-col items-start justify-start ml-4">
                      {Object.keys(navDict[item].children).map((child) => (
                        <Link
                          key={child}
                          href={`/docs/${navDict[item].children[child].file}`}
                          className={`flex text-sm  text-left justify-between items-center my-1  rounded-md py-1 px-3 cursor-pointer w-full ${
                            fileName === navDict[item].children[child].file
                              ? "bg-orange-300"
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
          <div className="flex justify-start ">
            <div className="max-w-[100%] md:w-[768px] mx-auto">
              <ReactMarkdown
                components={{
                  // Map `h1` (`# heading`)
                  h1: ({ node, ...props }) => (
                    <div
                      className="my-4 text-[32px] font-semibold whitespace-normal break-all"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <div
                      className="mt-2 text-[20px] font-bold whitespace-normal break-all"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <div
                      className="mt-2 whitespace-normal text-[16px] font-bold break-word"
                      {...props}
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <div
                      className="my-[1.25rem] text-[16px] font-bold whitespace-normal break-word"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <div
                      className="my-[1.25rem] text-[16px] whitespace-normal break-word leading-5"
                      {...props}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-orange-500 break-all whitespace-normal"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => {
                    if (typeof props.inline === "boolean")
                      props.inline = props.inline.toString();
                    return (
                      <code
                        className="px-2 py-1 whitespace-pre  rounded-md bg-orange-20 break-all text-[16px]  leading-5 "
                        {...props}
                      />
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
