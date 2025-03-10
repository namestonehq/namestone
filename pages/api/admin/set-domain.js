import sql from "../../../lib/db";
import { normalize } from "viem/ens";
import { getAdminToken, encodeContenthash } from "../../../utils/ServerUtils";

export default async function handler(req, res) {
  const body = JSON.parse(req.body);
  const adminToken = await getAdminToken(req, body.domain);
  if (!adminToken) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  if (typeof body.id !== "number") {
    return res.status(400).json({ error: "Id is required" });
  }
  if (!body.network) {
    return res.status(400).json({ error: "Network is required" });
  }

  let domain;
  try {
    domain = normalize(body.domain);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ error: "Invalid ens name" });
  }

  let domainQuery;
  let domainId = body.id;

  // Check if domain exists already
  domainQuery = await sql`
  select domain.id, domain.address
  from domain
  where domain.name = ${domain} and domain.network = ${body.network}`;

  // If domain exists and is different than current, warn user
  if (domainQuery.length == 1 && domainQuery[0].id != domainId) {
    return res.status(400).json({
      error: `Domain already exists with a different ID`,
    });
  }

  // Process contenthash if provided
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

  // update domain
  if (domainId == 0) {
    // Insert domain
    domainQuery = await sql`
    insert into domain (
      name, address, network, contenthash
    ) values (
      ${domain}, ${body.address || null}, ${body.network}, ${contenthash}
    )
    returning id;`;
    domainId = domainQuery[0].id;
  } else {
    await sql`
    update domain
    set name = ${domain},
    address = ${body.address || null},
    contenthash = ${contenthash}
    where id = ${domainId}`;
  }

  // Delete existing text records
  await sql`delete from domain_text_record
  where domain_id = ${domainId}`;

  // Insert text records
  if (body.text_records) {
    for (const record in body.text_records) {
      await sql`
      insert into domain_text_record (
        domain_id, key, value
      ) values (
        ${domainId}, ${record}, ${body.text_records[record]}
      )`;
    }
  }

  // Delete existing coin types
  await sql`delete from domain_coin_type
  where domain_id = ${domainId}`;

  // Insert coin types
  if (body.coin_types) {
    for (const coin_type in body.coin_types) {
      await sql`
      insert into domain_coin_type (
        domain_id, coin_type, address
      ) values (
        ${domainId}, ${coin_type}, ${body.coin_types[coin_type]}
      )`;
    }
  }

  // log user engagement
  const jsonPayload = JSON.stringify({
    name: domain,
    address: body.address,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${adminToken.sub},'admin_set_domain', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}
