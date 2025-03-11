import sql from "../../../lib/db";
import {
  getAdminTokenById,
  encodeContenthash,
} from "../../../utils/ServerUtils";

export default async function handler(req, res) {
  const body = JSON.parse(req.body);
  const adminToken = await getAdminTokenById(req, body.domain_id);

  if (!adminToken) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  if (!body.domain_id) {
    return res.status(400).json({ error: "Id is required" });
  }

  let domainId = body.domain_id;

  // make sure domain exists
  const domainQuery = await sql`
  select id from domain where id = ${domainId}`;
  if (domainQuery.length == 0) {
    return res.status(400).json({ error: "Domain does not exist" });
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
  await sql`
    update domain
    set address = ${body.address || null},
    contenthash = ${contenthash}
    where id = ${domainId}`;

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
    domain_id: domainId,
    address: body.address,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${adminToken.sub},'admin_set_domain', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}
