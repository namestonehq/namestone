import { getFileBySlug, getFiles } from "../../utils/mdx";
import BlogWrapper from "../../components/BlogWrapper";
import { PageSEO } from "../../components/SEO";
import siteMetadata from "../../data/siteMetadata";
import ReactMarkdown from "react-markdown";

export async function getStaticPaths() {
  const posts = getFiles("blog");
  return {
    paths: posts.map((p) => ({
      params: {
        slug: p.replace(/\.(mdx|md)/, "").split("/"),
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const frontMatter = await getFileBySlug(params.slug.join("/"), "blog");
  const post = frontMatter.data;
  const content = frontMatter.content;

  return { props: { content, post } };
}

export default function Blog({ content, post }) {
  return (
    <>
      <BlogWrapper>
        <PageSEO title={post.title} description={post.summary} />
        <h1 className="py-4 mt-4 text-3xl font-extrabold leading-9 tracking-tight text-center sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
          {post.title}
        </h1>
        <div className="my-6 text-center border border-brownblack-100 border-1"></div>
        <ReactMarkdown
          components={{
            // Map `h1` (`# heading`) to use `h2`s.
            h1: ({ node, ...props }) => (
              <h1 className="my-4 text-3xl" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="my-6 text-[24px] font-bold" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="my-4 text-l" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <div className="my-[1.25rem] text-[16px] font-bold" {...props} />
            ),
            p: ({ node, ...props }) => (
              <div className="my-[1.25rem] text-[16px]" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-orange-500" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </BlogWrapper>
    </>
  );
}
