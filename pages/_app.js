//ToDo: split into landing page and app page

import "../styles/globals.css";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
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
import Head from "next/head";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "NameStone",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [mainnet, polygon, optimism, arbitrum, sepolia],
  providers: [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    publicProvider(),
  ],
});

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ["latin"] });

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider refetchInterval={0} session={pageProps.session}>
          <RainbowKitSiweNextAuthProvider>
            <RainbowKitProvider>
              <Head>
                <title>Create ENS Subdomains via API | NameStone</title>
                <meta
                  property="og:title"
                  content="Create ENS Subdomains via API | NameStone"
                />
                <meta
                  name="description"
                  content="Create and issue free ENS subdomains via a REST API. Trusted by web3 leaders. Supported by ENS DAO."
                />
                <meta
                  property="og:description"
                  content="Create and issue free ENS subdomains via a REST API. Trusted by web3 leaders. Supported by ENS DAO."
                />
                <meta property="og:image" content="/opengraph-image.jpg" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="icon" href="/favicon.ico" />
              </Head>
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
      </QueryClientProvider>
    </WagmiProvider>
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
