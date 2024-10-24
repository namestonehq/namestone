import sql from "../../../lib/db";
import Cors from "micro-cors";
import { ethers } from "ethers";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

const handler = async (req, res) => {
  const { method } = req;
  let address = req.query.address;

  let domain = req.query.domain || "namestone.xyz";
  let uri =
    req.query.uri || "https://namestone.xyz/api/public_v1/get-siwe-message";

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
  if (!address) {
    return res.status(400).json({ error: "Missing address" });
  }
  // check if address is valid
  try {
    address = ethers.utils.getAddress(address);
  } catch (error) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }
  let message;
  try {
    message = generateSiweMessage(address, domain, uri);
  } catch (error) {
    return res.status(500).json({ error: error });
  }

  // Save siwe to sql
  await sql`
    INSERT INTO siwe (address, message) VALUES (${address}, ${message})
    ON CONFLICT (address) DO UPDATE SET message = ${message};
  `;

  // Set the Content-Type header to text/plain
  res.setHeader("Content-Type", "text/plain");

  // Return the message as plain text
  return res.status(200).send(message);
};

export default cors(handler);

function generateSiweMessage(address, domain, uri) {
  const nonce = generateSiweNonce();
  const message = createSiweMessage({
    domain: domain,
    address,
    statement: "Sign this message to access protected endpoints.",
    uri: uri,
    version: "1",
    chainId: 1,
    nonce: nonce,
  });
  return message;
}
