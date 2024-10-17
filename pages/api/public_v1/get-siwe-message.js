import { generateNonce, SiweMessage } from "siwe";
import sql from "../../../lib/db";
import Cors from "micro-cors";
import { generateSiweMessage } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

const handler = async (req, res) => {
  const { method } = req;
  const address = req.query.address;

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
  const message = generateSiweMessage(address);
  // Save siwe to sql
  await sql`
    INSERT INTO siwe (address, message) VALUES (${address}, ${message})
    ON CONFLICT (address) DO UPDATE SET message = ${message};
  `;

  // return message
  res.setHeader("Content-Type", "text/plain");
  res.send(message);
};

export default cors(handler);
