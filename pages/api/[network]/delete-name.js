import sql from "../../../lib/db";
import {
  checkApiKey,
  getAdminToken,
  getNetwork,
  getClientIp,
} from "../../../utils/ServerUtils";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;

  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }

  // Check required parameters
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.name) {
    return res.status(400).json({ error: "Missing name" });
  }

  // Check API key
  const adminToken = await getAdminToken(req, body.domain);
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    body.domain
  );
  if (!allowedApi && !adminToken) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  let domain = body.domain.toLowerCase();
  let name = body.name.toLowerCase();

  const subdomainQuery = await sql`
  select subdomain.id, subdomain.address
  from subdomain 
  where name = ${name} and domain_id in 
  (select id from domain where name = ${domain} and network=${network} limit 1)`;

  if (subdomainQuery.length === 0) {
    return res.status(400).json({ error: "Name does not exist" });
  }

  await sql`delete from subdomain_text_record
  where subdomain_id = ${subdomainQuery[0].id}`;

  await sql`delete from subdomain_coin_type
  where subdomain_id = ${subdomainQuery[0].id}`;

  await sql`delete from subdomain 
  where id = ${subdomainQuery[0].id}`;

  // log user engagement
  const clientIp = getClientIp(req);
  const jsonPayload = JSON.stringify({
    name: name,
    domain: domain,
    ip_address: clientIp,
    address: subdomainQuery[0].address,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values ('api_key','revoke_name', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
