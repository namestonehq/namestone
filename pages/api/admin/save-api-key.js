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

  let domainData = JSON.parse(req.body).brandData;

  if (!domainData?.domain || !domainData?.api_key) {
    return res.status(400).json({ error: "All fields are required" });
  }
  // get domain id
  const domainQuery = await sql`
  select id from domain where name = ${domainData.domain}
  `;
  const domainId = domainQuery[0].id;

  const keyDict = { key: domainData.api_key, domain_id: domainId };
  const apiKeyId = await sql`
  update api_key set ${sql(
    keyDict,
    "key"
  )} where domain_id = ${domainId} returning id`;

  // if apiKey doesn't exist, create it
  if (apiKeyId.length === 0) {
    await sql`
    insert into api_key ${sql(keyDict, "key", "domain_id")}
    `;
  }
  return res.status(200).json({ success: true });
}
