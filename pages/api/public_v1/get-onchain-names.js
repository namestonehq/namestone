import sql from "../../../lib/db";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  // Check required parameters
  const domain = req.query.domain;
  const addresses = req.query.addresses?.split(","); // Assuming addresses are comma-separated

  if (!domain) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let subDomainNames;
  if (addresses && addresses.length > 0) {
    subDomainNames = await sql`
      SELECT name, address, owner,  "tokenId", "textRecords" as "textRecordsPayload", "registeredAt" FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} AND "address" = ANY (${addresses}) order by "registeredAt" desc
    `;
  } else {
    subDomainNames = await sql`
      SELECT name, address, owner, "tokenId", "textRecords" as "textRecordsPayload", "registeredAt" FROM ponder."NftSubdomain" WHERE "domainName" = ${domain} order by "registeredAt" desc
    `;
  }

  if (subDomainNames.length === 0) {
    return res.status(200).json([]);
  }

  const result = [];
  for (const {
    name,
    address,
    owner,
    tokenId,
    textRecordsPayload,
    registeredAt,
  } of subDomainNames) {
    const textRecords = JSON.parse(textRecordsPayload);
    result.push({ name, address, owner, tokenId, textRecords });
  }

  return res.status(200).json(result);
}

export default cors(handler);
