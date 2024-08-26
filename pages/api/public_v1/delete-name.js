import sql from "../../../lib/db";
import { checkApiKey } from "../../../utils/ServerUtils";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;

  // Check required parameters
  const body = req.body;
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.name) {
    return res.status(400).json({ error: "Missing name" });
  }

  // Check API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    body.domain
  );
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  const subdomainQuery = await sql`
  select subdomain.id 
  from subdomain 
  where name = ${body.name} and domain_id in 
  (select id from domain where name = ${body.domain} limit 1)`;

  if (subdomainQuery.length === 0) {
    return res.status(400).json({ error: "Name does not exist" });
  }

  await sql`delete from subdomain_text_record
  where subdomain_id = ${subdomainQuery[0].id}`;

  await sql`delete from subdomain 
  where id = ${subdomainQuery[0].id}`;

  // log user engagement
  const jsonPayload = JSON.stringify({ name: body.name, domain: body.domain });
  await sql`
  insert into user_engagement (address, name, details)
  values ('api_key','revoke_name', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
