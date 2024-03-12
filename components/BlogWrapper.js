import siteMetadata from "../data/siteMetadata";
// import MobileNav from "./MobileNav";

import Link from "next/link";
import Header from "./Header";

function SectionContainer({ children }) {
  return (
    <div className="flex justify-center bg-neutral-50 ">
      <div className="w-full overflow-hidden flex flex-col max-w-[1536px]">
        <Header subtitle="Blog" />
        <div className="max-w-3xl px-6 pt-24 pb-4 mx-auto">{children}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="flex flex-col items-center mt-16">
        <div className="flex mb-3 space-x-4"></div>
        <div className="flex mb-2 space-x-2 text-sm text-brownblack-400 dark:text-brownblack-400">
          <div>{siteMetadata.author}</div>
          <div>{` • `}</div>
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{` • `}</div>
          <Link href="/">NameStone</Link>
        </div>
      </div>
    </footer>
  );
}

function BlogWrapper({ children }) {
  return (
    <>
      <SectionContainer>
        <div className="flex flex-col justify-between ">
          <main className="mb-auto">{children}</main>
          <Footer />
        </div>
      </SectionContainer>
    </>
  );
}

export default BlogWrapper;
