import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain ID
  if (!req.query.domain_id) {
    return res.status(400).json({ error: "Domain ID is required" });
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
  `;

  const adminQuery = await sql`
  SELECT * FROM admin
  JOIN domain ON admin.domain_id = domain.id
  WHERE admin.address = ${token.sub}
  AND domain.id = ${req.query.domain_id};`;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let apiKey = "No api key found";
  const apiQuery = await sql`
  SELECT key FROM api_key 
  WHERE domain_id = ${req.query.domain_id}
  LIMIT 1`;

  if (apiQuery.length > 0) {
    apiKey = apiQuery[0].key;
  }

  // Get domain name for response
  const domainQuery = await sql`
  SELECT name FROM domain 
  WHERE id = ${req.query.domain_id}
  LIMIT 1`;

  const domainName = domainQuery.length > 0 ? domainQuery[0].name : "";

  return res.status(200).json({ api_key: apiKey, domain: domainName });
}
