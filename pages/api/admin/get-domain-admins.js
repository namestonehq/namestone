import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }
  // Get Domain && Name
  if (!req.query.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
`;
  const adminQuery = await sql`
  SELECT * FROM admin
  join domain on admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  and domain.name = ${req.query.domain};`;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const domainQuery = await sql`
  select domain.id
  from domain
  where domain.name = ${req.query.domain}`;

  const domain_id = domainQuery[0].id;

  const domainAdminQuery = await sql`
  select admin.address
  from admin join domain
  on admin.domain_id = domain.id
  where domain.name = ${req.query.domain}`;

  const adminList = domainAdminQuery.map((admin) => {
    return admin.address;
  });

  return res.status(200).json({ domain_id: domain_id, admins: adminList });
}
