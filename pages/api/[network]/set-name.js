import sql from "../../../lib/db";
import {
  checkApiKey,
  encodeContenthash,
  getNetwork,
} from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }
  const { headers } = req;

  // Check required parameters
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.address) {
    return res.status(400).json({ error: "Missing address" });
  }
  if (!body.name) {
    return res.status(400).json({ error: "Missing name" });
  }

  // Check  API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    body.domain
  );
  console.log(
    "allowedApi",
    allowedApi,
    headers.authorization,
    req.query.api_key,
    body.domain,
    network
  );
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  let domain;
  let name;
  try {
    domain = normalize(body.domain);
    name = normalize(body.name);
  } catch (e) {
    return res.status(400).json({ error: "Invalid ens name" });
  }
  let subdomainId;
  // Check if subdomain exists
  const subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${name} and subdomain.domain_id in
  (select id from domain where name = ${domain} and network=${network} limit 1)`;

  // Get content hash and encode it
  let contenthash = body.contenthash || null;
  if (contenthash === "") {
    contenthash = null;
  }
  let contenthashRaw = contenthash;
  // encode contenthash from link to contenthash
  if (contenthash) {
    try {
      contenthash = encodeContenthash(contenthash);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid contenthash" });
    }
  }

  if (subdomainQuery.length > 0) {
    // Update subdomain
    await sql`
    update subdomain set address = ${body.address},
    contenthash = ${contenthash},
    contenthash_raw = ${contenthashRaw}
    where id = ${subdomainQuery[0].id}`;

    subdomainId = subdomainQuery[0].id;
  } else {
    // Insert subdomain
    const domainQuery = await sql`
    select id, name_limit from domain where name = ${domain} and network = ${network} limit 1`;

    if (domainQuery.length === 0) {
      return res.status(400).json({ error: "Domain does not exist" });
    }
    // check limit
    if (domainQuery[0].name_limit > 0) {
      const subdomainCount = await sql`
      select count(*) from subdomain where domain_id = ${domainQuery[0].id}`;
      if (subdomainCount[0].count >= domainQuery[0].name_limit) {
        return res.status(400).json({
          error:
            "Api name limit reached. Please contact alex@namestone.com to increase your limit",
        });
      }
    }

    const subdomainQuery = await sql`
    insert into subdomain (
      name, address, domain_id, contenthash, contenthash_raw
    ) values (
      ${name}, ${body.address}, ${domainQuery[0].id}, ${contenthash}, ${contenthashRaw}
    )
    returning id;`;

    subdomainId = subdomainQuery[0].id;
  }

  // Delete existing text records
  await sql`delete from subdomain_text_record
  where subdomain_id = ${subdomainId}`;

  // Insert text records
  if (body.text_records) {
    for (const record in body.text_records) {
      await sql`
      insert into subdomain_text_record (
        subdomain_id, key, value
      ) values (
        ${subdomainId}, ${record}, ${body.text_records[record]}
      )`;
    }
  }

  // Delete existing coin types
  await sql`delete from subdomain_coin_type
  where subdomain_id = ${subdomainId}`;

  // Insert text coin
  if (body.coin_types) {
    for (const coin_type in body.coin_types) {
      await sql`
      insert into subdomain_coin_type (
        subdomain_id, coin_type, address
      ) values (
        ${subdomainId}, ${coin_type}, ${body.coin_types[coin_type]}
      )`;
    }
  }

  // log user engagement
  const jsonPayload = JSON.stringify({
    body: body,
    api_key: headers.authorization,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${body.address},'set_name', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
