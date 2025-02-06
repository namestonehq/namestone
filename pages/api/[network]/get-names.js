import sql from "../../../lib/db";
import Cors from "micro-cors";
import { getNetwork } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function checkApiKey(apiKey, domain) {
  if (!apiKey) {
    return false;
  }
  let apiQuery;
  if (!domain) {
    apiQuery = await sql`
    SELECT api_key.id, key FROM api_key 
    where api_key.key = ${apiKey}`;
  } else {
    apiQuery = await sql`
    SELECT api_key.id, key FROM api_key 
    join domain 
    on api_key.domain_id = domain.id
    where domain.name = ${domain}
    and api_key.key = ${apiKey}`;
  }
  if (apiQuery.count >= 1) {
    return true;
  }
  return false;
}

async function handler(req, res) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }
  const { headers } = req;

  // Check required parameters
  const domain = req.query.domain;

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


  const address = req.query.address;
  const includeTextRecords = req.query.text_records;
  const apiKey = headers.authorization || req.query.api_key;
  // Check API key

  const allowedApi = await checkApiKey(apiKey, domain);

  let domainIds = [];
  if (domain) {
    // Get domain from db
    let domainQuery;
    if (allowedApi) {
      domainQuery = await sql`
    select id from domain where name = ${domain} and network= ${network} limit 1`;
    } else {
      domainQuery = await sql`
    select domain.id from domain JOIN brand
     ON brand.domain_id = domain.id
    WHERE brand.share_with_data_providers = true 
    AND domain.name = ${domain}  and domain.network= ${network} limit 1`;
    }

    if (domainQuery.length === 0) {
      return res.status(400).json({ error: "Domain does not exist" });
    }
    domainIds = [domainQuery[0].id];
  } else {
    // Get all domains from db for api key
    let domainQuery;
    if (allowedApi) {
      // if apiKey get all apikey domains
      domainQuery = await sql`
    select domain.id from domain join api_key on api_key.domain_id = domain.id where api_key.key = ${apiKey} and domain.network = ${network}`;
    } else {
      // otherwise get all public domains
      domainQuery = await sql`
    select domain.id from domain JOIN brand
     ON brand.domain_id = domain.id
    WHERE brand.share_with_data_providers = true
   and domain.network = ${network}`;
    }

    if (domainQuery.length === 0) {
      return res.status(400).json({ error: "Domain does not exist" });
    }
    domainIds = domainQuery.map((domain) => domain.id);
  }
  // Get subdomains from db for non contract domains
  let subdomainEntries;
  if (address === undefined) {
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at, subdomain.contenthash_raw as contenthash
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    WHERE domain_id = ANY(${domainIds})
    order by subdomain.name ASC
    LIMIT ${limit} OFFSET ${offset}`;
  } else {
    // split address by comma
    let addresses = address.split(",");
    // lowercase all addresses
    addresses = addresses.map((address) => address.toLowerCase());
    subdomainEntries = await sql`
    SELECT subdomain.id AS id, subdomain.name AS name, subdomain.address AS address, domain.name AS domain, subdomain.created_at, subdomain.contenthash_raw as contenthash
    FROM subdomain
    JOIN domain ON subdomain.domain_id = domain.id
    WHERE LOWER(subdomain.address) = ANY(${addresses})
    AND domain_id = ANY(${domainIds})
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
