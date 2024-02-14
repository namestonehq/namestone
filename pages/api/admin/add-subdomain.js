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
  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  let subdomainQuery;
  let subdomainId;
  // Check if subdomain exists
  subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain
  where subdomain.name = ${body.name} and subdomain.domain_id in
  (select id from domain where name = ${body.domain} limit 1)`;

  if (subdomainQuery.length > 0) {
    // if it exists we warn user
    return res.status(400).json({
      error: `Name claimed by another address`,
    });
  } else {
    // Insert subdomain
    const domainQuery = await sql`
    select id from domain where name = ${body.domain} limit 1`;

    if (domainQuery.length === 0) {
      return res.status(400).json({ error: "Domain does not exist" });
    }
    subdomainQuery = await sql`
    insert into subdomain (
      name, address, domain_id
    ) values (
      ${body.name.toLowerCase()}, ${body.address}, ${domainQuery[0].id}
    )
    returning id;`;
    subdomainId = subdomainQuery[0].id;
  }
  // log user engagement
  const jsonPayload = JSON.stringify({
    name: body.name,
    address: body.address,
    domain: body.domain,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${token.sub},'admin_set_name', ${jsonPayload})`;

  // get subdomain info
  subdomainQuery = await sql`
  select subdomain.id, subdomain.name, subdomain.address, domain.name as domain
  from subdomain join domain
  on subdomain.domain_id = domain.id
  where subdomain.id = ${subdomainId}
  limit 1`;

  return res.status(200).json(subdomainQuery[0]);
}
