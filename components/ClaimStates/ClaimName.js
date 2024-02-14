import React from "react";
import { useContext, useState } from "react";
import { ClaimContext } from "../../contexts/ClaimContext";
import Button from "../Button";
import { useEffect } from "react";

export default function ClaimName({ brand, setClaimState }) {
  const { setCongratsPending, setFetchUserSubdomain } =
    useContext(ClaimContext);

  // input interactions
  const [nameInput, setNameInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [typingTimer, setTypingTimer] = useState();
  const [errorMsg, setErrorMsg] = useState("");

  // name availability
  const [nameAvailable, setNameAvailable] = useState(true);
  const [nameClaimable, setNameClaimable] = useState(false);
  const [availabilityPending, setAvailabilityPending] = useState(false);

  // useEffect to check name availability
  // TODO: ADD PENDING STATES FOR CHECKING AVAILABILITY
  useEffect(() => {
    function checkNameAvailability() {
      fetch(
        "/api/name-availability?" +
          new URLSearchParams({
            name: nameInput,
            domain: brand.domain,
          })
      ).then((res) => {
        res.json().then((data) => {
          if (res.status === 200) {
            setAvailabilityPending(false);
            setNameAvailable(data.nameAvailable);
            setNameClaimable(data.nameAvailable);
            setErrorMsg(data.errorMsg);
          } else {
            setAvailabilityPending(false);
            setNameAvailable(data.nameAvailable);
            setErrorMsg(data.error);
          }
        });
      });
    }
    if (nameInput.length > 0) {
      setAvailabilityPending(true);
      clearTimeout(typingTimer);
      setTypingTimer(
        setTimeout(() => {
          checkNameAvailability();
        }, 400)
      );
    } else {
      setNameClaimable(false);
    }
  }, [nameInput, brand.domain]);

  function clickClaim() {
    if (nameClaimable) {
      fetch("/api/claim-name", {
        method: "POST",
        body: JSON.stringify({
          domain: brand.domain,
          name: nameInput,
          avatar: brand.default_avatar,
        }),
      })
        .then((res) => {
          res.json().then((json) => {
            setFetchUserSubdomain((prev) => prev + 1);
            if (res.status === 200) {
              setCongratsPending(true);
              setClaimState("edit_profile");
            } else {
              console.log(json);
              setClaimState("check_eligibility");
            }
          });
        })
        .catch((err) => {
          console.log(err);
          setClaimState("check_eligibility");
        });
    }
  }

  return (
    <>
      <div className="flex font-bold text-md text-brownblack-700">
        Choose a {brand.name} name!
      </div>
      {/* name input */}
      <div className="w-full mt-10 ">
        <div
          className={`flex justify-center w-fit mx-auto rounded-xl ${
            isFocused ? "ring ring-orange-500/[0.5]" : ""
          }`}
        >
          <input
            type="text"
            id="name-input"
            placeholder="name"
            className="flex max-w-[400px] w-40 sm:w-auto px-4 py-4 font-bold text-center bg-white rounded-l-xl appearance-none md:text-base text-sm outline-none text-brownblack-700"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setNameInput(e.target.value)}
            value={nameInput}
            spellCheck="false"
          />
          <div className="px-4 py-4 text-sm font-bold bg-white border-l-2 border-solid md:text-base rounded-r-xl text-brownblack-500 border-neutral-200">
            .{brand.domain}
          </div>
        </div>
        <div className="h-6 text-xs font-bold text-red-400">
          {!nameAvailable && errorMsg}
        </div>
      </div>
      {/* claim button */}
      <Button
        buttonText="Claim"
        onClick={() => clickClaim()}
        className="mt-5"
        color="orange"
        pending={availabilityPending}
        disabled={!nameClaimable || availabilityPending}
      />
    </>
  );
}
