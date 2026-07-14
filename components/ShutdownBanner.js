import React from "react";

export default function ShutdownBanner() {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center w-full gap-x-2 px-4 py-2 text-center bg-orange-500">
      <span className="text-xs font-bold md:text-sm text-brownblack-700">
        NameStone is shutting down August 3, 2026.
      </span>
      <a
        href="https://x.com/namestonehq/status/2073272170994979308"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-bold underline md:text-sm text-brownblack-700 underline-offset-4 cursor-pointer transition-colors duration-300 ease-in-out hover:text-brownblack-500"
      >
        Read the announcement
      </a>
    </div>
  );
}
