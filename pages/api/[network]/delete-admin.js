import sql from "../../../lib/db";
import {
  checkApiKey,
  getNetwork,
  getClientIp,
} from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }
  const { headers } = req;

  // Check required parameters
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.admin_address) {
    return res.status(400).json({ error: "Missing admin_address" });
  }

  let domain;
  let admin_address = body.admin_address;
  try {
    domain = normalize(body.domain);
  } catch (e) {
    return res.status(400).json({ error: "Invalid ens domain" });
  }

  // Check API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    domain
  );
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  try {
    // Check if domain exists
    const domainQuery = await sql`
      select id from domain where name = ${domain} and network = ${network} limit 1`;

    if (domainQuery.length === 0) {
      return res.status(400).json({ error: "Domain does not exist" });
    }

    const domainId = domainQuery[0].id;

    // Delete admin from admin table
    const result = await sql`
      delete from admin where domain_id = ${domainId} and address = ${admin_address};
    `;

    if (result.count === 0) {
      return res.status(404).json({ error: "Admin not found for this domain" });
    }
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  // log user engagement
  const clientIp = getClientIp(req);
  const jsonPayload = JSON.stringify({
    body: body,
    ip_address: clientIp,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${admin_address},'delete_admin', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
