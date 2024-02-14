import { getToken } from "next-auth/jwt";
import sql from "../../../lib/db";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const body = JSON.parse(req.body);
  if (!body.name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!body.address) {
    return res.status(400).json({ error: "Address is required" });
  }
  if (!body.id) {
    return res.status(400).json({ error: "Id is required" });
  }
  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  let subdomainQuery;
  let subdomainId = body.id;
  // Check if subdomain exists already
  subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${body.name} and subdomain.domain_id in
  (select id from domain where name = ${body.domain} limit 1)`;
  // If subdomain exists and is different than current, warn user
  if (subdomainQuery.length == 1 && subdomainQuery[0].id != subdomainId) {
    return res.status(400).json({
      error: `Name claimed by another address`,
    });
  }
  // update subdomain
  await sql`
  update subdomain
  set name = ${body.name},
  address = ${body.address}
  where id = ${subdomainId}`;

  // log user engagement
  const jsonPayload = JSON.stringify({
    name: body.name,
    address: body.address,
    domain: body.domain,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${token.sub},'admin_edit_name', ${jsonPayload})`;

  // get subdomain info
  subdomainQuery = await sql`
  select subdomain.id, subdomain.name, subdomain.address, domain.name as domain
  from subdomain join domain
  on subdomain.domain_id = domain.id
  where subdomain.id = ${subdomainId}
  limit 1`;

  return res.status(200).json(subdomainQuery[0]);
}
