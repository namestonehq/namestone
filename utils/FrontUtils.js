// Shorten wallet address
// 0xcCe0AAc6dBe4971ECf5b3dbd13EF93Cb50b379bf -> 0xcCe0...79bf
export const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};
