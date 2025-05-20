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
  
  const { headers } = req;

  // Check required parameters
  const adminAddress = req.query["admin-address"];
  if (!adminAddress) {
    return res.status(400).json({ error: "Missing required admin-address parameter" });
  }

  // get offset and limit
  let limit = req.query.limit;
  // Check that limit is a number and >= 0
  if (limit && (isNaN(Number(limit)) || Number(limit) < 0)) {
    return res.status(400).json({ error: "Invalid limit parameter" });
  }
  if (!limit) {
    limit = 50;
  }
  limit = Math.min(limit, 1000);
  
  let offset = req.query.offset;
  // Check that offset is a number and >= 0
  if (offset && (isNaN(Number(offset)) || Number(offset) < 0)) {
    return res.status(400).json({ error: "Invalid offset parameter" });
  }
  if (!offset) {
    offset = 0;
  }

  const includeTextRecords = req.query.text_records;

  // Get domains where the provided address is an admin
  const domainQuery = await sql`
    SELECT domain.id, domain.name, domain.address, domain.contenthash_raw as contenthash
    FROM domain
    JOIN admin ON admin.domain_id = domain.id
    WHERE LOWER(admin.address) = LOWER(${adminAddress})
    AND domain.network = ${network}
    ORDER BY domain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;

  if (domainQuery.length === 0) {
    return res.status(200).json([]);
  }

  const domainPayloads = [];

  if (includeTextRecords === "0") {
    domainQuery.forEach((entry) => {
      const { id, ...domainInfo } = entry;
      domainPayloads.push({
        ...domainInfo,
        domain: entry.name,
      });
    });
  } else {
    for (const entry of domainQuery) {
      // Get text records from db
      const textRecords = await sql`
      SELECT * FROM domain_text_record WHERE domain_id = ${entry.id}`;

      const textRecordDict = {};
      textRecords.forEach((record) => {
        textRecordDict[record.key] = record.value;
      });
      
      // get coin types from db
      const coinTypes = await sql`
      SELECT * FROM domain_coin_type WHERE domain_id = ${entry.id}`;

      const coinTypeDict = {};
      coinTypes.forEach((coin) => {
        coinTypeDict[coin.coin_type] = coin.address;
      });

      const domainPayload = {
        address: entry.address,
        domain: entry.name,
        text_records: textRecordDict,
        coin_types: coinTypeDict,
        contenthash: entry.contenthash,
      };
      domainPayloads.push(domainPayload);
    }
  }

  return res.status(200).json(domainPayloads);
}

export default cors(handler);