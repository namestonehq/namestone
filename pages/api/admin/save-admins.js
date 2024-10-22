import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";
import { ethers } from "ethers";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let adminData = JSON.parse(req.body).brandData;

  console.log(adminData);
  if (!adminData.admins || !adminData.domain_id) {
    return res.status(400).json({ error: "something went wrong" });
  }

  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};
`;
  const adminQuery = await sql`
  SELECT * FROM admin
  join domain on admin.domain_id = ${adminData.domain_id}
  WHERE admin.address = ${token.sub};`;

  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let insertPayload = [];
  for (let i = 0; i < adminData.admins.length; i++) {
    let admin = adminData.admins[i];
    try {
      admin = ethers.utils.getAddress(admin);
    } catch (error) {
      console.log("error", error);
      return res.status(400).json({ error: "Invalid admin address" });
    }
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
