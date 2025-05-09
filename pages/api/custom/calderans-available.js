import sql from "../../../lib/db";
import Cors from "micro-cors";
import { getNetwork } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  // Check required parameters
  let name = req.query.name;

  if (!name) {
    return res.status(400).json({
      available: false,
      message: "Name parameter is required",
    });
  }

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
