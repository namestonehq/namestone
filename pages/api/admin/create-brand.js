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

  if (!data.domain || !data.url || !data.name) {
    return res.status(400).json({ error: "something went wrong" });
  }

  let insertDomain = { name: data.domain, network: data.network };
  const domainQuery = await sql`
  insert into domain ${sql(insertDomain, "name", "network")}
  returning id;`;
  let insertBrand = {
    name: data.name,
    url_slug: data.url,
    domain_id: domainQuery[0].id,
  };
  await sql`
  insert into brand ${sql(insertBrand, "name", "url_slug", "domain_id")}
  `;
  // create api key
  let insertApiKey = {
    key: uuidv4(),
    domain_id: domainQuery[0].id,
  };
  await sql`
  insert into api_key ${sql(insertApiKey, "key", "domain_id")}
  `;

  return res.status(200).json({ success: true });
}
