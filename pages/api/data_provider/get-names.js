import sql from "../../../lib/db";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  // get offset and limit
  let limit = req.query.limit;
  if (!limit) {
    limit = 1000;
  }
  limit = Math.min(limit, 1000);
  let offset = req.query.offset;
  if (!offset) {
    offset = 0;
  }

  const dataProviders = await sql`SELECT api_key FROM data_provider`;
  const dataProviderApiKeys = dataProviders.map((provider) => provider.api_key);

  const includeTextRecords = req.query.text_records;
  if (!dataProviderApiKeys.includes(req.query.api_key)) {
    return res.status(401).json({
      error: "key error - You are not authorized to use this endpoint",
    });
  }

  // Get subdomains from db
  let subdomainEntries;

  subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    JOIN brand ON brand.domain_id = domain.id
    WHERE brand.share_with_data_providers = true
    order by subdomain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;

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
