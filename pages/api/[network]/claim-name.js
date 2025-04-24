import sql from "../../../lib/db";
import { checkApiKey, getNetwork, getClientIp } from "../../../utils/ServerUtils";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;
  // Claim name deprecated so only mainnet
  const network = getNetwork(req);
  if (network !== "mainnet") {
    return res.status(400).json({ error: "Invalid network" });
  }

  // Check required parameters
  const body = req.body;
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.address) {
    return res.status(400).json({ error: "Missing address" });
  }
  if (!body.name) {
    return res.status(400).json({ error: "Missing name" });
  }

  let domain;
  let name;
  try {
    domain = normalize(body.domain);
    name = normalize(body.name);
  } catch (e) {
    return res.status(400).json({ error: "Invalid ens name" });
  }

  // Check API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    domain
  );
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  let subdomainId;
  // Check if subdomain exists
  const subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${name} and subdomain.domain_id in
  (select id from domain where name = ${domain}  and network='mainnet' limit 1)`;

  // single_claim check
  if (req.query.single_claim === "1") {
    // check to see if this address has already claimed a subdomain at this domain
    const claimedSubdomainQuery = await sql`
    select subdomain.id, subdomain.address
    from subdomain
    where subdomain.address = ${body.address} and subdomain.domain_id in
    (select id from domain where name = ${domain} and network='mainnet'  limit 1)`;
    // if so, return error
    if (claimedSubdomainQuery.length > 0) {
      return res
        .status(400)
        .json({ error: "Address has already claimed subdomain" });
    }
  }

  if (subdomainQuery.length > 0) {
    return res.status(400).json({ error: "Name already claimed" });
  } else {
    // Insert subdomain
    const domainQuery = await sql`
    select id, name_limit from domain where name = ${body.domain} and network='mainnet' limit 1`;

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

    let contenthash = body.contenthash || null;
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

    const subdomainQuery = await sql`
    insert into subdomain (
      name, address, domain_id, contenthash
    ) values (
      ${name}, ${body.address}, ${domainQuery[0].id}, ${contenthash}
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
  const clientIp = getClientIp(req);
  const jsonPayload = JSON.stringify({
    body: body,
    api_key: headers.authorization,
    ip_address: clientIp
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${body.address},'set_name', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
