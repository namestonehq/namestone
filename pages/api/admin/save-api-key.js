import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let adminData = JSON.parse(req.body).brandData;

  if (!adminData.domain_id || !adminData.api_key) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if user is authorized (either super admin or domain admin)
  const superAdminQuery = await sql`
    SELECT * FROM super_admin WHERE address = ${token.sub};
  `;

  const adminQuery = await sql`
    SELECT * FROM admin
    JOIN domain ON admin.domain_id = domain.id
    WHERE admin.address = ${token.sub}
    AND domain.id = ${adminData.domain_id};
  `;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Check if API key already exists for this domain
  const existingKeyQuery = await sql`
    SELECT * FROM api_key WHERE domain_id = ${adminData.domain_id};
  `;

  if (existingKeyQuery.length > 0) {
    // Update existing API key
    await sql`
      UPDATE api_key 
      SET key = ${adminData.api_key}
      WHERE domain_id = ${adminData.domain_id};
    `;
  } else {
    // Insert new API key
    await sql`
      INSERT INTO api_key (domain_id, key)
      VALUES (${adminData.domain_id}, ${adminData.api_key});
    `;
  }

  return res.status(200).json({ success: true });
}
