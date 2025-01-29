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

  // Check authorization
  const superAdminQuery = await sql`
    SELECT * FROM super_admin WHERE address = ${token.sub};
  `;
  const adminQuery = await sql`
    SELECT * FROM admin
    WHERE admin.address = ${token.sub}
    AND admin.domain_id = ${req.query.domain_id};
  `;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get domain admins
  const domainAdminQuery = await sql`
    SELECT admin.address
    FROM admin 
    WHERE admin.domain_id = ${req.query.domain_id}
  `;

  const adminList = domainAdminQuery.map((admin) => admin.address);

  // Get API key
  let apiKey = "No api key found";
  const apiQuery = await sql`
    SELECT key 
    FROM api_key
    WHERE domain_id = ${req.query.domain_id}
    LIMIT 1
  `;

  if (apiQuery.length > 0) {
    apiKey = apiQuery[0].key;
  }

  // Get share_with_data_providers setting from brand table
  const brandQuery = await sql`
    SELECT share_with_data_providers
    FROM brand
    WHERE domain_id = ${req.query.domain_id}
    LIMIT 1
  `;

  let shareWithDataproviders = false;
  if (brandQuery.length > 0) {
    shareWithDataproviders = brandQuery[0].share_with_data_providers;
  }

  return res.status(200).json({
    admins: adminList,
    api_key: apiKey,
    public_domain: shareWithDataproviders,
  });
}
