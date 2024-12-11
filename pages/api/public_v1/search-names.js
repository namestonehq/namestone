import sql from "../../../lib/db";
import { checkApiKey, getAdminToken } from "../../../utils/ServerUtils";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
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
  if (!limit) {
    limit = 50;
  }
  limit = Math.min(limit, 1000);
  let offset = req.query.offset;
  if (!offset) {
    offset = 0;
  }

  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  // Get subdomains from db
  let subdomainEntries;
  if (exactMatch === "1") {
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    WHERE domain_id = ${domainQuery[0].id}
    AND Lower(subdomain.name) LIKE ${searchString.toLowerCase()} 
    order by subdomain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;
  } else {
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at
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

      delete entry.id;
      const subDomainPayload = {
        ...entry,
        text_records: textRecordDict,
      };
      subDomainPayloads.push(subDomainPayload);
    }
  }

  return res.status(200).json(subDomainPayloads);
}

export default cors(handler);
