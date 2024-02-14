import Link from "next/link";
import { PageSEO } from "../../components/SEO";
import siteMetadata from "../../data/siteMetadata";
import { getAllFilesFrontMatter } from "../../utils/mdx";
import formatDate from "../../utils/formatDate";
import BlogWrapper from "../../components/BlogWrapper";

export async function getStaticProps() {
  const posts = await getAllFilesFrontMatter("blog");

  return { props: { posts } };
}

export default function Home({ posts }) {
  return (
    <BlogWrapper>
      <PageSEO
        title={siteMetadata.title}
        description={siteMetadata.description}
      />
      <div className="divide-y divide-brownblack-100 ">
        <ul className="divide-y divide-brownblack-100">
          {!posts.length && "No posts found."}
          {posts.map((frontMatter) => {
            const { slug, date, title, summary, tags } = frontMatter;
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-brownblack-500 ">
                        <time dateTime={date}>{formatDate(date)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link href={`/blog/${slug}`} className="">
                              {title}
                            </Link>
                          </h2>
                        </div>
                        <div className="prose text-brownblack-500 max-w-none">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base font-medium leading-6">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-orange-500 hover:text-orange-600 "
                          aria-label={`Read "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </BlogWrapper>
  );
}
