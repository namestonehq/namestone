import sql from "../../../lib/db";
import Cors from "micro-cors";
import { generateSiweMessage } from "../../../utils/ServerUtils";
import { ethers } from "ethers";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

const handler = async (req, res) => {
  const { method } = req;
  let address = req.query.address;

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

  const message = generateSiweMessage(address);
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
