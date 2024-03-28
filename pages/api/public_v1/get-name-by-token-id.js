import sql from "../../../lib/db";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  // Check required parameters
  const domain = req.query.domain;

  const tokenId = req.query.token_id;

  if (!domain || !tokenId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }
  const subDomainName = await sql`
    SELECT name FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} AND "tokenId" = ${tokenId}
  `;

  if (subDomainName.length === 0) {
    return res.status(404).json({ message: "Subdomain not found" });
  }

  return res.status(200).json(subDomainName);
}

export default cors(handler);
