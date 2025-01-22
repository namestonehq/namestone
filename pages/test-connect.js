import React from "react";

import { useSession } from "next-auth/react";
import CustomConnectButton from "../components/CustomConnectButton";

export default function TestConnect() {
  const { data: session, status: authStatus } = useSession();

  return <CustomConnectButton />;
}
