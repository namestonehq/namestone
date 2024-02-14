import React from "react";

export default function HorizontalScrollingClaims() {
  const nameClaimSample = [
    "sam.buidl.eth was claimed!",
    "0xemily.nfty.eth was claimed!",
    "0xcole.wassie.eth was claimed!",
    "h2o.community.eth was claimed!",
    "slobo.community.eth was claimed!",
    "0xplayer.fire.eth was claimed!",
    "bob.wassie.eth was claimed!",
    "degen.pooltogether.eth was claimed!",
    "420.nfty.eth was claimed!",
    "notadegen.nfty.eth was claimed!",
    "clueless.degen.eth was claimed!",
    "maximo.roman.eth was claimed!",
    "alex.ratking.eth was claimed!",
    "matt.salmon.eth was claimed!",
  ];
  return (
    <div className="absolute w-full overflow-hidden text-sm bg-white bg-opacity-50 top-20">
      <div className="whitespace-nowrap animate-marquee">
        {Array(3)
          .fill()
          .map((_, i) => (
            <div key={i} className="inline-block">
              {nameClaimSample.map((nameClaim, index) => (
                <span key={`${nameClaim}-${index}`} className="mr-2">
                  {nameClaim}
                </span>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
