import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain && Name
  if (!req.query.domain_id) {
    return res.status(400).json({ error: "Domain is required" });
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
`;
  const adminQuery = await sql`
  SELECT * FROM admin 
  join domain on admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  and domain.id = ${req.query.domain_id}`;
  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const subdomainQuery = await sql`
  select subdomain.id, subdomain.name, subdomain.address, domain.name as domain  
  from subdomain join domain 
  on subdomain.domain_id = domain.id 
  where domain.id = ${req.query.domain_id}
  order by subdomain.name`;

  return res.status(200).json(subdomainQuery);
}
