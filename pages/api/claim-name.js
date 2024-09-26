import { getToken } from "next-auth/jwt";
import sql from "../../lib/db";
import { getAvailability, getEligibility } from "../../utils/ServerUtils";
import { normalize } from "viem/ens";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain && Name
  const body = JSON.parse(req.body);
  if (!body.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  if (!body.name) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  let domain;
  let name;
  try {
    domain = normalize(body.domain);
    name = normalize(body.name);
  } catch (e) {
    return res.status(400).json({ error: "Invalid ens name" });
  }

  // Check user eligibility
  const payload = await getEligibility(token, domain);
  if (payload.reasons.length === 0 || payload.hasClaimed) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }
  // Check name availability
  const { nameAvailable, errorMsg } = await getAvailability(domain, name);
  if (!nameAvailable) {
    return res.status(400).json({ error: errorMsg });
  }

  const userAddress = token.sub;
  const domainQuery = await sql`
  select id from domain where name = ${domain} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  // Insert name into db
  const subdomainQuery = await sql`
  insert into subdomain (
    name, address, domain_id
  ) values (
    ${name}, ${userAddress}, ${domainQuery[0].id}
  )
  returning id;`;
  // insert avatar into db
  let avatar = body.avatar;
  // Wassie only code
  // TODO: Standardize avatar code
  if (domain === "wassies.eth") {
    avatar =
      "https://i.seadn.io/gae/ju6vDR0sbEvqT0bAb4QPEzYMzpReEllDZ5MlICtxqJu76G5UrZ0cT-w6X3Mzf9e8KXZXJGNIyXGDRAoL-qlaApiJsj27ZdbOY5VvCA?auto=format&dpr=1&w=512";
  }

  if (avatar) {
    await sql`
    insert into subdomain_text_record (
      subdomain_id, key, value
    ) values (
      ${subdomainQuery[0].id}, 'avatar', ${avatar}
    )`;
  }

  // log user engagement
  const jsonPayload = JSON.stringify({ name: name, domain: domain });
  await sql`insert into user_engagement (
    address, name, details
  ) values (
    ${userAddress}, 'claim_name', ${jsonPayload}
  )`;

  return res.status(200).json({ success: true });
}

// Custom sorting function
function couchSort(a, b) {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();

  // Check if "couch" is present in the name
  const hasCouchA = nameA.includes("couch");
  const hasCouchB = nameB.includes("couch");

  if (hasCouchA && !hasCouchB) {
    return -1; // a comes before b
  } else if (!hasCouchA && hasCouchB) {
    return 1; // a comes after b
  } else {
    return 0; // no change in order
  }
}
