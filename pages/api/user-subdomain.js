import { getToken } from "next-auth/jwt";
import sql from "../../lib/db";

// Add the list of ethereum addresses
export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  const userAddress = token.sub;
  if (!req.query.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  const domain = req.query.domain;
  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  // Get subdomain from db
  const subdomainEntry = await sql`
  select subdomain.id as id, subdomain.name as name, subdomain.address as address, domain.name as domain
   from subdomain join domain on subdomain.domain_id = domain.id
   where subdomain.address = ${userAddress}
  and domain_id = ${domainQuery[0].id} limit 1`;

  if (subdomainEntry.length === 0) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  // get text records from db
  const textRecords = await sql`
  select * from subdomain_text_record where subdomain_id = ${subdomainEntry[0].id}`;
  let textRecordDict = {};
  textRecords.map((record) => {
    textRecordDict[record.key] = record.value;
  });
  let subDomainPayload = subdomainEntry[0];
  subDomainPayload.textRecords = textRecordDict;

  return res.status(200).json(subDomainPayload);
}
