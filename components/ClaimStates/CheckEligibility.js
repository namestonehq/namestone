import React from "react";
import { useContext, useState, useEffect, useRef } from "react";
import { ClaimContext } from "../../contexts/ClaimContext";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import EligibilityItem from "../EligibilityItem";
import Button from "../Button";
import CustomConnectButton from "../CustomConnectButton";
import BonusReward from "../../components/BonusRewards";

export default function CheckEligibility({
  brand,
  setClaimState,
  eligibilityItems,
  namesClaimedCount,
}) {
  const { status: authStatus } = useSession();
  const { isConnected } = useAccount();
  // fullyConnected means authenticated and connected
  const fullyConnected = isConnected && authStatus === "authenticated";

  // eligibility reasons are stored in an array
  const [reasons, setReasons] = useState([]);

  // UseEffect to check eligibility after authentication
  useEffect(() => {
    if (fullyConnected) {
      fetch(
        "/api/user-eligibility?" +
          new URLSearchParams({
            domain: brand.domain,
          })
      ).then((res) => {
        if (res.status === 200) {
          res.json().then((data) => {
            console.log("Eligibility data", data);
            setReasons(data.reasons);
            if (data.hasClaimed) {
              setClaimState("already_claimed");
            }
          });
        } else {
          console.log("Error checking eligibility");
        }
      });
    }
    // setClaimState is not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullyConnected]);

  return (
    <>
      <Counter number={namesClaimedCount} />
      <div className="flex mb-3 font-bold text-md text-brownblack-700">
        {" "}
        Claim a {brand.domain} name
      </div>
      <div className="flex mb-3 text-sm font-bold text-brownblack-500">
        {fullyConnected === false
          ? "Meet any of the following to claim"
          : reasons.length > 0
          ? "🥳 Requirements met!"
          : "The requirements are not met"}
      </div>
      {eligibilityItems.map((eligibilityItem, i) => {
        return (
          <EligibilityItem
            key={i}
            eligibilityItemText={eligibilityItem.display}
            status={
              !fullyConnected
                ? ""
                : reasons.includes(eligibilityItem.requirement)
                ? "success"
                : reasons.length === 0
                ? "fail"
                : ""
            }
          />
        );
      })}
      <div className="w-full mt-10">
        {!fullyConnected ? (
          <CustomConnectButton />
        ) : (
          <Button
            onClick={() => {
              setClaimState("claim_name");
            }}
            className=""
            buttonText="Continue"
            disabled={reasons.length === 0}
            color="orange"
          />
        )}
        {false && <BonusReward blur={!fullyConnected} />}
      </div>
    </>
  );
}

function Counter({ number }) {
  const digits = number.toString().split("");
  const counterDigits = Math.max(3 - digits.length, 0);

  return (
    <>
      <div className="flex gap-1 mb-2">
        {Array(counterDigits)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-10 h-10 text-base font-bold bg-white rounded-lg text-brownblack-700"
            >
              0
            </div>
          ))}
        {digits.map((digit, index) => (
          <div
            key={index}
            className="flex items-center justify-center w-10 h-10 text-base font-bold bg-white rounded-lg text-brownblack-700"
          >
            {digit}
          </div>
        ))}
      </div>
      <div className="mb-10 text-xs font-bold text-brownblack-500">
        Names claimed!
      </div>
    </>
  );
}
