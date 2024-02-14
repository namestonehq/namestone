import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import NameStoneLogo from "../../components/NameStoneLogo";
import CustomConnectButton from "../../components/CustomConnectButton";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useContext } from "react";
import { ClaimContext } from "../../contexts/ClaimContext";
import CheckEligibility from "../../components/ClaimStates/CheckEligibility";
import ClaimName from "../../components/ClaimStates/ClaimName";
import ProfileLinks from "../../components/ClaimStates/ProfileLinks";
import EditProfile from "../../components/ClaimStates/EditProfile";
import { useSession } from "next-auth/react";
import sql from "../../lib/db";

export async function getServerSideProps({ resolvedUrl }) {
  let domainName;
  let brand;
  const domainSlug = resolvedUrl.replace("/", "");
  const brandQuery = await sql`
    SELECT 
    brand.name, brand.url_slug, domain.name as domain, brand.default_avatar, brand.banner_image, brand.footer_image
    FROM brand join domain on brand.domain_id = domain.id
    where (brand.claim_slug = ${domainSlug}) or 
    (LOWER(brand.url_slug) = ${domainSlug.toLowerCase()} and (brand.claim_slug is null or brand.claim_slug = '')) 
  `;
  console.log(brandQuery);
  if (brandQuery.length > 0) {
    brand = brandQuery[0];
    domainName = brand.domain;
  } else {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
    };
  }
  const eligibilityQuery = await sql`
  select eligibility_item.display, eligibility_item.requirement from eligibility_item 
  join domain on domain.id=eligibility_item.domain_id 
  where domain.name = ${domainName}`;
  let eligibilityItems = eligibilityQuery;
  if (eligibilityItems.length === 0) {
    eligibilityItems = [
      { display: "Super Secret Link 🤫", requirement: "open" },
    ];
  }
  const namesClaimedQuery = await sql`
  select count(*) from subdomain where domain_id = (select id from domain where name = ${domainName})`;
  const namesClaimedCount = namesClaimedQuery[0].count;
  return {
    props: {
      brand: brand,
      eligibilityItems: eligibilityItems,
      namesClaimedCount: namesClaimedCount,
    },
  };
}

export default function ClaimPage({
  brand,
  eligibilityItems,
  namesClaimedCount,
}) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: session, status: authStatus } = useSession();
  const { setContextBrand, claimState, setClaimState } =
    useContext(ClaimContext);

  // const to keep track of footer
  const showFooter = ["check_eligibility", "claim_name"].includes(claimState);

  // useEffect to  check_eligibility state if not connected or authed
  useEffect(() => {
    if (
      authStatus === "unauthenticated" &&
      claimState !== "check_eligibility"
    ) {
      console.log(authStatus);
      setClaimState("check_eligibility");
    }
    // setClaimState is not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, authStatus, claimState, connectedAddress, session]);

  // UseEffect to set initial contenxt brand
  useEffect(() => {
    setContextBrand(brand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  // Transition between claim states
  const defaultTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 1.25,
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen overflow-hidden text-center bg-gradient-to-b from-orange-200 to-red-200">
      <AnimatePresence mode="wait">
        <motion.div
          className="flex flex-col items-center justify-center w-full min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={defaultTransition}
        >
          {/* Nav bar */}
          <div className="flex items-center justify-between w-full px-4 py-4 md:px-20">
            <NameStoneLogo />
            <CustomConnectButton />
          </div>
          {/* Main content */}
          <motion.div
            className={`flex px-8 flex-col items-center md:min-w-[332px] justify-center flex-grow w-full  pb-[10rem]`}
            key={claimState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={defaultTransition}
          >
            {/* Check Eligibility */}
            {claimState === "check_eligibility" && (
              <CheckEligibility
                brand={brand}
                setClaimState={setClaimState}
                eligibilityItems={eligibilityItems}
                namesClaimedCount={namesClaimedCount}
              />
            )}

            {claimState === "claim_name" && (
              <ClaimName brand={brand} setClaimState={setClaimState} />
            )}

            {["claim_success", "already_claimed", "changes_saved"].includes(
              claimState
            ) && (
              <ProfileLinks
                brand={brand}
                claimState={claimState}
                setClaimState={setClaimState}
              />
            )}

            {claimState === "edit_profile" && (
              <EditProfile brand={brand} setClaimState={setClaimState} />
            )}
          </motion.div>
          {/* Footer */}
        </motion.div>
      </AnimatePresence>
      {showFooter && (
        <motion.div
          className="flex flex-col items-center justify-center w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={defaultTransition}
        >
          <div className="fixed max-w-[564px] bottom-4  mx-2 overflow-hidden shadow-md rounded-xl ">
            <Image
              className=""
              width={564}
              height={100}
              src={brand?.footer_image}
              alt={"hosted by " + brand?.name}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
