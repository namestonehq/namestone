// Shorten wallet address
// 0xcCe0AAc6dBe4971ECf5b3dbd13EF93Cb50b379bf -> 0xcCe0...79bf
export const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

// Update resolver for a domain
export const updateResolver = async ({
  walletClient,
  selectedDomain,
  network,
  address,
  setResolverButtonText,
  setChangeResolver,
  switchChain,
}) => {
  const HYBRID_RESOLVER = "0xA87361C4E58B619c390f469B9E6F27d759715125";
  const SEPOOLIA_RESOLVER = "0x467893bFE201F8EfEa09BBD53fB69282e6001595";
  const NAMEWRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
  const NAMEWRAPPER_SEPOLIA = "0x0635513f179D50A207757E05759CbD106d7dFcE8";

  const providerUrl =
    "https://eth-mainnet.g.alchemy.com/v2/" +
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const sepoliaProviderUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

  if (!walletClient) {
    return;
  }

  const { createWalletClient, custom, createPublicClient, http } = await import(
    "viem"
  );
  const { mainnet, sepolia } = await import("viem/chains");
  const { addEnsContracts } = await import("@ensdomains/ensjs");
  const { setResolver } = await import("@ensdomains/ensjs/wallet");

  const correctResolver =
    network === "Mainnet" ? HYBRID_RESOLVER : SEPOOLIA_RESOLVER;
  const correctNameWrapper =
    network === "Mainnet" ? NAMEWRAPPER : NAMEWRAPPER_SEPOLIA;
  const correctNetwork = network === "Mainnet" ? mainnet : sepolia;

  console.log("correctResolver", correctResolver);
  console.log("correctNameWrapper", correctNameWrapper);
  console.log("correctNetwork", correctNetwork);
  console.log("selectedDomain", selectedDomain);
  console.log("address", address);
  console.log("network", network);
  console.log("walletClient", walletClient);
  console.log("setResolverButtonText", setResolverButtonText);
  console.log("setChangeResolver", setChangeResolver);
  console.log("switchChain", switchChain);
  // Call switchNetwork and wait a moment for it to take effect
  switchChain(correctNetwork.id);

  // Wait for 1 second to allow the network switch to propagate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (selectedDomain?.resolver !== correctResolver) {
    const wallet = createWalletClient({
      chain: addEnsContracts(correctNetwork),
      transport: custom(walletClient.transport),
    });

    try {
      setResolverButtonText("Waiting for approval...");
      const hash = await setResolver(wallet, {
        name: selectedDomain?.name,
        contract:
          selectedDomain?.contractOwner === correctNameWrapper
            ? "nameWrapper"
            : "registry",
        resolverAddress: correctResolver,
        account: address,
      });

      setResolverButtonText("Pending");

      try {
        const client = createPublicClient({
          transport: http(
            network === "Mainnet" ? providerUrl : sepoliaProviderUrl || ""
          ),
        });

        const transaction = await client.waitForTransactionReceipt({
          hash,
        });

        setResolverButtonText("Success");
        if (setChangeResolver) {
          setChangeResolver((changeResolver) => changeResolver + 1);
        }
      } catch (e) {
        console.log(e);
        setResolverButtonText("Failed to update");
        setTimeout(() => {
          setResolverButtonText("Update");
        }, 1500);
      }
    } catch (e) {
      console.log(e);
      setResolverButtonText("Failed");
      setTimeout(() => {
        setResolverButtonText("Update");
      }, 1500);
    }
  }
};
