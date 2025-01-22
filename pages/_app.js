//ToDo: split into landing page and app page

import "../styles/globals.css";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { arbitrum, mainnet, optimism, polygon, sepolia } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { SessionProvider } from "next-auth/react";
import { RainbowKitSiweNextAuthProvider } from "@rainbow-me/rainbowkit-siwe-next-auth";
import ClaimContextWrapper from "../contexts/ClaimContext";
import { signOut } from "next-auth/react";
import { useAccount } from "wagmi";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { Toaster } from "react-hot-toast";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, sepolia],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    publicProvider(),
  ]
);
const { connectors } = getDefaultWallets({
  appName: "NameStone",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true, // must be false to avoid hydration issues
  connectors,
  publicClient,
  webSocketPublicClient,
});

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ["latin"] });

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <SessionProvider refetchInterval={0} session={pageProps.session}>
        <RainbowKitSiweNextAuthProvider>
          <RainbowKitProvider chains={chains}>
            <Toaster
              position="top-right"
              toastOptions={{
                success: {
                  icon: null,
                  style: {
                    fontFamily: "Arial",
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "#fff",
                    background: "rgb(34 197 94)",
                  },
                },
                error: {
                  icon: null,
                  style: {
                    fontFamily: "Arial",
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "#fff",
                    background: "rgb(220 38 38)",
                  },
                },
                custom: {
                  style: {
                    fontFamily: "Arial",
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "#000",
                    background: "#fff",
                  },
                },
              }}
            />
            <AuthHandler>
              <main className={inter.className}>
                <ClaimContextWrapper>
                  <Component {...pageProps} />
                </ClaimContextWrapper>
              </main>
            </AuthHandler>
          </RainbowKitProvider>
        </RainbowKitSiweNextAuthProvider>
      </SessionProvider>
    </WagmiConfig>
  );
}

export default MyApp;

function AuthHandler(props) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: session, status: authStatus } = useSession();
  // use Effect to handle authlogic
  useEffect(() => {
    if (authStatus === "authenticated") {
      if (isConnected && session?.address !== connectedAddress) {
        console.log("signOut");
        signOut();
      }
      if (!isConnected) {
        console.log("signOut");
        signOut();
      }
    }
  }, [isConnected, authStatus, connectedAddress, session]);

  return <>{props.children}</>;
}
