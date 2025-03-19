import sql from "../../../lib/db";
import { normalize } from "viem/ens";
import { getAdminTokenById } from "../../../utils/ServerUtils";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";

export default async function handler(req, res) {
  const body = JSON.parse(req.body);
  const adminToken = await getAdminTokenById(req, body.domain_id);
  if (!adminToken) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  if (!body.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (typeof body.id !== "number") {
    return res.status(400).json({ error: "Id is required" });
  }
  if (typeof body.domain_id !== "number" || body.domain_id <= 0) {
    return res
      .status(400)
      .json({ error: "domain_id is required and must be a positive number" });
  }
  // domain is still needed for normalization
  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  let domain;
  let name;
  try {
    domain = normalize(body.domain);
    name = normalize(body.name);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: "Invalid ens name" });
  }

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

  let subdomainQuery;
  let subdomainId = body.id;
  // Check if subdomain exists already
  subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${name} and subdomain.domain_id = ${body.domain_id}`;

  const address = body.address || "";

  // If subdomain exists and is different than current, warn user
  if (
    subdomainQuery.length > 1 ||
    (subdomainQuery.length == 1 && subdomainQuery[0].id != subdomainId)
  ) {
    return res.status(400).json({
      error: `Name claimed by another address`,
    });
  }
  // update subdomain
  if (subdomainId == 0) {
    // Insert subdomain - now using domain_id directly
    subdomainQuery = await sql`
    insert into subdomain (
      name, address, domain_id, contenthash, contenthash_raw
    ) values (
      ${name}, ${address}, ${body.domain_id}, ${contenthash}, ${contenthashRaw}
    )
    returning id;`;
    subdomainId = subdomainQuery[0].id;
  } else {
    await sql`
  update subdomain
  set name = ${name},
  address = ${address},
  contenthash = ${contenthash},
  contenthash_raw = ${contenthashRaw}
  where id = ${subdomainId}`;
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
    name: name,
    address: body.address,
    domain: domain,
    domain_id: body.domain_id,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${adminToken.sub},'admin_set_name', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}
