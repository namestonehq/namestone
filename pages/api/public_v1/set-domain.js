import sql from "../../../lib/db";
import { checkApiKey, encodeContenthash } from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { normalize } from "viem/ens";
import { getDomainOwner } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;
  let data = req.body;
  let apiKey = headers.authorization || req.query.api_key;

  if (!data.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }

  let domainName;
  try {
    domainName = normalize(data.domain);
  } catch (e) {
    return res.status(400).json({ error: "Invalid ens name" });
  }

  const allowedApi = await checkApiKey(apiKey, domainName);
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  // Get content hash and encode it
  let contenthash = data.contenthash || null;
  let rawContenthash = contenthash;
  if (contenthash === "") {
    contenthash = null;
  }
  // encode contenthash from link to contenthash
  if (contenthash) {
    try {
      contenthash = encodeContenthash(contenthash);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid contenthash" });
    }
  }

  let domainData = {
    name: domainName,
    address: data.address || null,
    contenthash: contenthash || null,
    contenthash_raw: rawContenthash || null,
  };

  // check if domain exists
  let domainQuery = await sql`
  select * from domain where name = ${domainName} limit 1;`;

  if (domainQuery.length == 0) {
    return res
      .status(400)
      .json({ error: "Domain does not exist. Please use /enable-domain." });
  }
  //// if Domain exists we update
  // check that domain is owned by user
  const apiQuery = await sql`
    select * from api_key where domain_id = ${domainQuery[0].id} and key = ${apiKey} limit 1;`;
  if (apiQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  //update domain data
  domainQuery = await sql`
    update domain set ${sql(
      domainData,
      "address",
      "contenthash",
      "contenthash_raw"
    )}
    where name = ${domainName}
    returning id;`;

  // Delete existing text records
  await sql`delete from domain_text_record
  where domain_id = ${domainQuery[0].id}`;
  // Insert text records
  if (data.text_records) {
    for (const record in data.text_records) {
      await sql`
      insert into domain_text_record (
        domain_id, key, value
      ) values (
        ${domainQuery[0].id}, ${record}, ${data.text_records[record]}
      )`;
    }
  }

  // Delete existing coin types
  await sql`delete from domain_coin_type
  where domain_id = ${domainQuery[0].id}`;

  // Insert text coin
  if (data.coin_types) {
    for (const coin_type in data.coin_types) {
      await sql`
      insert into domain_coin_type (
        domain_id, coin_type, address
      ) values (
         ${domainQuery[0].id}, ${coin_type}, ${data.coin_types[coin_type]}
      )`;
    }
  }

  // log user engagement
  const jsonPayload = JSON.stringify({
    body: data,
    api_key: apiKey,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${data.address || null},'set_domain', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
