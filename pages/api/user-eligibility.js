import { getToken } from "next-auth/jwt";
import { getEligibility } from "../../utils/ServerUtils";
import sql from "../../lib/db";

// Add the list of ethereum addresses
export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  if (!req.query.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  const domain = req.query.domain;
  const payload = await getEligibility(token, domain);

  // log user engagement
  const userAddress = token.sub;
  const jsonPayload = JSON.stringify({ ...{ domain: domain }, ...payload });
  await sql`insert into user_engagement (
    address, name, details
  ) values (
    ${userAddress}, 'check_eligibility', ${jsonPayload}
  )`;

  return res.status(200).json(payload);
}
