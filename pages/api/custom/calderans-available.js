import sql from "../../../lib/db";
import Cors from "micro-cors";
import { getNetwork } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }

  // Check required parameters
  let name = req.query.name;
  name = name.toLowerCase();

  let subdomainAvailable = await sql`
    SELECT 1 FROM subdomain
    WHERE domain_id = 290
    AND name = ${name}
    LIMIT 1`;

  if (subdomainAvailable.length > 0) {
    return res.status(200).json({
      available: false,
      message: "Subdomain is already taken",
    });
  }
  return res.status(200).json({
    available: true,
    message: "Subdomain is available",
  });
}

export default cors(handler);
