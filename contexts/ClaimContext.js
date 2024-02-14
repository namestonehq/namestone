import { createContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export const ClaimContext = createContext(null);

export default function ClaimContextWrapper({ children }) {
  const { status: authStatus } = useSession();

  const [contextBrand, setContextBrand] = useState(null);
  const [userSubdomain, setUserSubdomain] = useState(null);
  const [fetchUserSubdomain, setFetchUserSubdomain] = useState(0);

  // useEffect to fetch user subdomain when authenticated
  useEffect(() => {
    if (authStatus === "authenticated" && contextBrand) {
      fetch(
        "/api/user-subdomain?" +
          new URLSearchParams({
            domain: contextBrand.domain,
          })
      ).then((res) => {
        return res.json().then((data) => {
          if (res.status === 200) {
            setUserSubdomain(data);
          } else {
            console.log(data);
          }
        });
      });
    }
  }, [authStatus, contextBrand, fetchUserSubdomain]);

  // claimState: check_eligibility, name_claim, already_claimed, claim_success, changes_saved, edit_profile
  const [claimState, setClaimState] = useState("check_eligibility");
  // Used to track whether we have congratulated the user for claiming a name
  const [congratsPending, setCongratsPending] = useState(false);
  // Include all variables here
  const globalVariables = {
    setContextBrand,
    claimState,
    setClaimState,
    congratsPending,
    setCongratsPending,
    userSubdomain,
    fetchUserSubdomain,
    setFetchUserSubdomain,
  };

  return (
    <ClaimContext.Provider value={globalVariables}>
      {children}
    </ClaimContext.Provider>
  );
}
