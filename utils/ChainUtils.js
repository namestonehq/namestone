/**
 * Chain configuration for supported blockchains
 */

export const chains = [
  {
    name: "Bitcoin",
    coin_type: 0,
    logo: "/images/logo-bitcoin.svg",
    placeholder: "bc1q...aw4n",
  },
  {
    name: "Solana",
    coin_type: 501,
    logo: "/images/logo-solana.svg",
    placeholder: "Ge83...S2bh",
  },
  {
    name: "Base",
    coin_type: 2147492101,
    logo: "/images/logo-base.svg",
    placeholder: "0x5346...D42CF",
  },
  {
    name: "Optimism",
    coin_type: 2147483658,
    logo: "/images/logo-op.svg",
    placeholder: "0x5346...D42CF",
  },
  {
    name: "Scroll",
    coin_type: 2148018000,
    logo: "/images/logo-scroll.svg",
    placeholder: "0x5346...D42CF",
  },
  {
    name: "Arbitrum",
    coin_type: 2147525809,
    logo: "/images/logo-arb.svg",
    placeholder: "0x5346...D42CF",
  },
];

/**
 * Returns the chain name for a given coin type
 * @param {number} coinType - The coin type to look up
 * @returns {string|null} - The chain name or null if not found
 */
export const getCoinName = (coinType) => {
  const chain = chains.find((chain) => String(chain.coin_type) === coinType);

  return chain ? chain.name : null;
};
