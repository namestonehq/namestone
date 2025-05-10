// Shorten wallet address
// 0xcCe0AAc6dBe4971ECf5b3dbd13EF93Cb50b379bf -> 0xcCe0...79bf
export const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

// Font fallback for proper emoji and special character rendering
export const ensFontFallback =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";

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

  const correctNetwork = network === "Mainnet" ? mainnet : sepolia;

  console.log(selectedDomain);
  // Call switchNetwork and wait a moment for it to take effect
  await switchChain({ chainId: correctNetwork.id });

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
          selectedDomain?.ownershipLevel === "nameWrapper"
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

/**
 * Converts a number to a human-readable format with k/M suffixes
 * @param {number} count - The number to format
 * @returns {string} - Formatted string (e.g., 1000 -> 1k, 1500 -> 1.5k)
 */
export const formatNameCount = (count) => {
  if (!count && count !== 0) return '';
  
  // Convert to number if it's a string
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  
  // Handle thousands
  if (num >= 1000 && num < 1000000) {
    const formatted = (num / 1000).toFixed(1);
    // Remove decimal if it's .0
    return formatted.endsWith('.0') 
      ? `${formatted.slice(0, -2)}k` 
      : `${formatted}k`;
  }
  
  // Handle millions
  if (num >= 1000000) {
    const formatted = (num / 1000000).toFixed(1);
    // Remove decimal if it's .0
    return formatted.endsWith('.0') 
      ? `${formatted.slice(0, -2)}M` 
      : `${formatted}M`;
  }
  
  // Return the number as is for values less than 1000
  return num.toString();
};
