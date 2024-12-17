import sql from "../../../lib/db";
import Cors from "micro-cors";
import { getNetwork } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function checkApiKey(apiKey, domain) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }

  console.log("Get domain", apiKey, domain);
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
    and domain.network = ${network}
    and api_key.key = ${apiKey}`;
  }
  console.log(apiQuery);
  if (apiQuery.count >= 1) {
    return true;
  }
  return false;
}

async function handler(req, res) {
  const { headers } = req;

  // Check required parameters
  const domain = req.query.domain;
  if (!domain) {
    return res.status(400).json({ message: "Missing required parameters" });
  }
  const apiKey = headers.authorization || req.query.api_key;
  // Check API key
  const allowedApi = await checkApiKey(apiKey, domain);
  if (!allowedApi) {
    return res.status(401).json({
      error: "key error - You are not authorized to use this endpoint",
    });
  }

  const domainQuery = await sql`
    select id, address, name, contenthash_raw from domain where name = ${domain} and network = ${network} limit 1`;
  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }
  const domainId = [domainQuery[0].id];
  const address = domainQuery[0].address;
  const domainName = domainQuery[0].name;
  const contenthashRaw = domainQuery[0].contenthash_raw;

  // Get text records from db
  const textRecords = await sql`
    SELECT * FROM domain_text_record WHERE domain_id = ${domainId}`;

  const textRecordDict = {};
  textRecords.forEach((record) => {
    textRecordDict[record.key] = record.value;
  });

  // get coin types from db
  const coinTypes = await sql`
      SELECT * FROM domain_coin_type WHERE domain_id = ${domainId}`;

  const coinTypeDict = {};
  coinTypes.forEach((coin) => {
    coinTypeDict[coin.coin_type] = coin.address;
  });

  const domainPayload = {
    address: address,
    domain: domainName,
    text_records: textRecordDict,
    coin_types: coinTypeDict,
    contenthash: contenthashRaw,
  };
  return res.status(200).json(domainPayload);
}

export default cors(handler);
