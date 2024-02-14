import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
`;
  if (superAdminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let adminData = JSON.parse(req.body).brandData;

  if (!adminData.admins || !adminData.domain_id) {
    return res.status(400).json({ error: "something went wrong" });
  }

  let insertPayload = [];
  for (let i = 0; i < adminData.admins.length; i++) {
    let admin = adminData.admins[i];
    insertPayload.push({
      address: admin,
      domain_id: adminData.domain_id,
    });
  }

  await sql`
  delete from admin where domain_id = ${adminData.domain_id}
  `;
  await sql`
  insert into admin ${sql(insertPayload, "address", "domain_id")}
  `;
  return res.status(200).json({ success: true });
}
