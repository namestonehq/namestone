import { getToken } from "next-auth/jwt";
import sql from "../../lib/db";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain
  const body = JSON.parse(req.body);
  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  const domain = body.domain;

  // Get text records from request

  if (!body.textRecords) {
    return res.status(400).json({ error: "Textrecords are required" });
  }
  const textRecords = body.textRecords;

  // Get subdomain from db
  const userAddress = token.sub;
  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  const subdomainEntry = await sql`
  select * from subdomain where address = ${userAddress}
  and domain_id = ${domainQuery[0].id} limit 1`;

  if (subdomainEntry.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Insert text records into db
  let textRecordLookup = [];
  for (let [key, value] of Object.entries(textRecords)) {
    // add https:// to url if not present
    if (
      key === "url" &&
      !value.startsWith("https://") &&
      !value.startsWith("http://") &&
      value !== ""
    ) {
      value = "https://" + value;
    }
    // Remove twitter url from user handle
    if (key === "com.twitter" && value !== "") {
      value = value.replace("https://twitter.com/", "");
    }
    // remove @ if value starts with @
    if (value.startsWith("@")) {
      value = value.slice(1);
    }

    textRecordLookup.push({
      subdomain_id: subdomainEntry[0].id,
      key: key,
      value: value || "",
    });
  }

  // delete existing text records
  await sql`
  delete from subdomain_text_record where subdomain_id = ${subdomainEntry[0].id}`;

  await sql`
  insert into subdomain_text_record ${sql(
    textRecordLookup,
    "subdomain_id",
    "key",
    "value"
  )}`;

  return res.status(200).json({ success: true });
}
