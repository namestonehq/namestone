import { getToken } from "next-auth/jwt";
import sql from "../../../lib/db";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const body = JSON.parse(req.body);
  if (!body.subdomain) {
    return res.status(400).json({ error: "Subdomain is required" });
  }
  const subdomain = body.subdomain;

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
`;
  const adminQuery = await sql`
  SELECT * FROM admin 
  join domain on admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  and domain.name = ${subdomain.domain};`;
  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const subdomainQuery = await sql`
  select subdomain.id 
  from subdomain 
  where name = ${subdomain.name} and domain_id in 
  (select id from domain where name = ${subdomain.domain} limit 1)`;

  if (subdomainQuery.length === 0) {
    return res.status(400).json({ error: "Subdomain does not exist" });
  }

  await sql`delete from subdomain_text_record
  where subdomain_id = ${subdomainQuery[0].id}`;

  await sql`delete from subdomain_coin_type
  where subdomain_id = ${subdomainQuery[0].id}`;

  await sql`delete from subdomain 
  where id = ${subdomainQuery[0].id}`;

  // log user engagement
  const jsonPayload = JSON.stringify(subdomain);
  await sql`
  insert into user_engagement (address, name, details)
  values (${token.sub},'revoke_subdomain', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}
