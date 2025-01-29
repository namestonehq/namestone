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
  and domain.name = ${req.query.domain};`;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let apiKey = "No api key found";
  const apiQuery = await sql`
  select key from api_key join domain 
  on api_key.domain_id = domain.id
  where domain.name = ${req.query.domain}
  limit 1`;
  if (apiQuery.length > 0) {
    apiKey = apiQuery[0].key;
  }

  return res.status(200).json({ api_key: apiKey, domain: req.query.domain });
}
