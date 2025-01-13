import React, { useEffect, useState } from "react";
import Image from "next/image";

import ensIcon from "../../public/images/logo-ens.png";
import rainbowIcon from "../../public/images/logo-rainbow.png";
import twitterIcon from "../../public/images/logo-twitter.png";
import { useContext } from "react";
import { ClaimContext } from "../../contexts/ClaimContext";
import confetti from "canvas-confetti";
import { defaultAvatar } from "../../utils/data/Variables";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";

export default function ProfileLinks({ brand, claimState, setClaimState }) {
  const router = useRouter();
  const { congratsPending, setCongratsPending, userSubdomain } =
    useContext(ClaimContext);
  const [twitterShareLink, setTwitterShareLink] = useState(
    `https://twitter.com/intent/tweet?text=I just claimed ${userSubdomain?.name}.${userSubdomain?.domain} on namestone.com/${brand.url_slug}`
  );

  function goToCommunityPage() {
    router.push(`/${brand.url_slug}/page`);
  }

  useEffect(() => {
    function claimConfetti() {
      var duration = 5 * 1000;
      var end = Date.now() + duration;

      (function frame() {
        // launch a few confetti from the left edge
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        // and launch a few from the right edge
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        // keep going until we are out of time
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
      confetti({ particleCount: 150 });
    }
    if (congratsPending) {
      setCongratsPending(false);
      claimConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [congratsPending]);

  const textDict = {
    claim_success: ["Congratulations!", "You claimed a new username"],
    already_claimed: ["Welcome Back!", "Explore your options"],
    changes_saved: ["Changes saved", "Explore your options"],
  };

  useEffect(() => {
    if (userSubdomain?.domain === "80fierce.eth") {
      setTwitterShareLink(
        `https://twitter.com/intent/tweet?text=I just claimed ${userSubdomain?.name}.${userSubdomain?.domain} %40azurbala %2380fierce`
      );
    }
  }, [userSubdomain]);
  return (
    <>
      <div className="flex items-start mt-8 font-bold text-md text-brownblack-700">
        {textDict[claimState][0]}
      </div>
      {/* subtext commented out */}
      {/* <div className="flex items-start mt-3 text-base font-bold text-brownblack-500">
        {textDict[claimState][1]}
      </div> */}

      <div className="flex items-center mt-8 justify-center overflow-hidden rounded-full ring-4 ring-orange-500/[0.5] w-28 h-28">
        <Image
          src={userSubdomain?.textRecords?.avatar ?? defaultAvatar}
          width={112}
          height={112}
          alt="Your Image"
        />
      </div>
      <div className="flex items-start mt-4 mb-3 text-base font-bold text-brownblack-700">
        {userSubdomain?.name}.{userSubdomain?.domain}
      </div>
      <WhiteButton
        buttonText="Share to Twitter"
        iconImage={twitterIcon}
        href={twitterShareLink}
      />
      <WhiteButton
        buttonText="View on Rainbow"
        iconImage={rainbowIcon}
        href={`https://rainbow.me/${userSubdomain?.name}.${userSubdomain?.domain}`}
      />
      <WhiteButton
        buttonText="View ENS Profile"
        iconImage={ensIcon}
        href={`https://app.ens.domains/${userSubdomain?.name}.${userSubdomain?.domain}`}
      />
      <WhiteButton
        buttonText="Edit Profile"
        iconName="clarity:edit-solid"
        onClick={() => setClaimState("edit_profile")}
      />
      <WhiteButton
        buttonText="Community Page"
        iconName="eva:external-link-outline"
        onClick={() => goToCommunityPage()}
      />
    </>
  );
}

function WhiteButton({ buttonText, iconImage, iconName, onClick, href }) {
  const buttonContent = (
    <>
      {iconImage && <Image className="w-5 h-5" src={iconImage} alt="icon" />}
      {iconName && <Icon className="w-5 h-5" icon={iconName} alt="icon" />}
      <span className="ml-4 text-sm font-bold">{buttonText}</span>
    </>
  );

  const buttonClass =
    "flex items-center justify-start pl-4 h-12 mt-4 text-center transition-colors duration-300 ease-in-out bg-white rounded-lg w-[252px] hover:bg-orange-300 active:bg-orange-400";

  return href ? (
    <a href={href} target="_blank" className={buttonClass}>
      {buttonContent}
    </a>
  ) : (
    <button onClick={onClick} className={buttonClass}>
      {buttonContent}
    </button>
  );
}
