import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";
import { v4 as uuidv4 } from "uuid";

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

  let data = JSON.parse(req.body);

  if (!data.domain_id) {
    return res.status(400).json({ error: "something went wrong" });
  }

  // check if there are subdomains on domain
  let subdomains = await sql`
  select * from subdomain where domain_id= ${data.domain_id};`;
  if (subdomains.length > 0) {
    return res
      .status(400)
      .json({ error: "There are subdomains on this domain" });
  }
  // delete admin on domain_id
  await sql` delete from admin where domain_id = ${data.domain_id};`;
  // delete api key on domain_id
  await sql` delete from api_key where domain_id = ${data.domain_id};`;
  // delete brand on domain_id
  await sql` delete from brand where domain_id = ${data.domain_id};`;
  // delete domain text records
  await sql` delete from domain_text_record where domain_id = ${data.domain_id};`;
  // delete domain
  await sql` delete from domain where id = ${data.domain_id};`;

  return res.status(200).json({ success: true });
}
