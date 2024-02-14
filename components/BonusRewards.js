import React from "react";

export default function BonusReward({ blur }) {
  return (
    <div className="z-40 flex justify-center w-full ">
      <div className="flex flex-col w-full mt-16 bg-gradient-to-r to-orange-500/[0.50] from-red-400/[0.5] rounded-3xl max-w-md">
        <span className="mt-6 font-bold text-md text-brownblack-700 ">
          Bonus Rewards
        </span>
        <span className="text-xs font-bold text-brownblack-500">
          Connect to Show!
        </span>
        <div className="flex flex-row flex-wrap justify-around gap-6 px-4 mt-8 mb-8">
          <RewardPill pillText="$100 Delegated" pillIcon="🎁" blur={blur} />

          <RewardPill pillText="2 $OP Tokens" pillIcon="🏖️" blur={blur} />
        </div>
      </div>
    </div>
  );
}

function RewardPill({ pillText, pillIcon, blur }) {
  return (
    <div
      className={`flex items-center justify-center w-full max-w-[175px] bg-white rounded-lg text-brownblack-700 ${
        blur ? "blur-sm" : ""
      }`}
    >
      <div className="flex items-center justify-start w-full h-10 ">
        <span className="pl-2 text-base">{pillIcon}</span>
        <div className="flex-grow text-xs font-bold text-center text-brownblack-700 ">
          {pillText}
        </div>
      </div>
    </div>
  );
}
