import sql from "../../../lib/db";
import {
  checkApiKey,
  getAdminToken,
  getNetwork,
} from "../../../utils/ServerUtils";
import Cors from "micro-cors";

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
  const domain = req.query.domain;
  if (!domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  const searchString = req.query.name;
  if (!searchString) {
    return res.status(400).json({ error: "Missing name" });
  }
  const includeTextRecords = req.query.text_records;
  const exactMatch = req.query.exact_match;
  // Check API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    domain
  );
  const adminToken = await getAdminToken(req, domain);
  if (!allowedApi && !adminToken) {
    return res.status(401).json({
      error: "key error - You are not authorized to use this endpoint",
    });
  }

  // get offset and limit
  let limit = req.query.limit;
  if (limit && (isNaN(Number(limit)) || Number(limit) < 0)) {
    return res.status(400).json({ error: "Invalid limit parameter" });
  }
  if (!limit) {
    limit = 50;
  }
  limit = Math.min(limit, 1000);
  let offset = req.query.offset;
  if (offset && (isNaN(Number(offset)) || Number(offset) < 0)) {
    return res.status(400).json({ error: "Invalid offset parameter" });
  }
  if (!offset) {
    offset = 0;
  }

  const domainQuery = await sql`
  select id from domain where name = ${domain} and network=${network} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  // Get subdomains from db
  let subdomainEntries;
  if (exactMatch === "1") {
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at, subdomain.contenthash_raw as contenthash
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    WHERE domain_id = ${domainQuery[0].id}
    AND Lower(subdomain.name) LIKE ${searchString.toLowerCase()} 
    order by subdomain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;
  } else {
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at, subdomain.contenthash_raw as contenthash
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    WHERE domain_id = ${domainQuery[0].id}
    AND Lower(subdomain.name) LIKE ${searchString.toLowerCase() + "%"} 
    order by subdomain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;
  }

  const subDomainPayloads = [];

  if (includeTextRecords === "0") {
    subdomainEntries.forEach((entry) => {
      delete entry.id;
      subDomainPayloads.push(entry);
    });
  } else {
    for (const entry of subdomainEntries) {
      // Get text records from db
      const textRecords = await sql`
      SELECT * FROM subdomain_text_record WHERE subdomain_id = ${entry.id}`;

      const textRecordDict = {};
      textRecords.forEach((record) => {
        textRecordDict[record.key] = record.value;
      });
      // get coin types from db
      const coinTypes = await sql`
      SELECT * FROM subdomain_coin_type WHERE subdomain_id = ${entry.id}`;

      const coinTypeDict = {};
      coinTypes.forEach((coin) => {
        coinTypeDict[coin.coin_type] = coin.address;
      });

      delete entry.id;
      const subDomainPayload = {
        ...entry,
        text_records: textRecordDict,
        coin_types: coinTypeDict,
      };
      subDomainPayloads.push(subDomainPayload);
    }
  }

  return res.status(200).json(subDomainPayloads);
}

export default cors(handler);
