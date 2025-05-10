import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain && Name
  if (!req.query.domain_id) {
    return res.status(400).json({ error: "Domain is required" });
  }

  // Parse pagination parameters with defaults
  const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  const offset = parseInt(req.query.offset) || DEFAULT_OFFSET;

  // Validate pagination parameters
  if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
    return res.status(400).json({ error: "Invalid pagination parameters" });
  }

  const superAdminQuery = await sql`
    SELECT * 
    FROM super_admin 
    WHERE address = ${token.sub};
  `;
  const adminQuery = await sql`
    SELECT * 
    FROM admin 
    JOIN domain 
    ON admin.domain_id = domain.id
    WHERE admin.address = ${token.sub}
    AND domain.id = ${req.query.domain_id}`;
  if (superAdminQuery.length === 0 && adminQuery.length === 0) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get total count first
  const countQuery = await sql`
    SELECT COUNT(*) as total
    FROM subdomain 
    WHERE domain_id = ${req.query.domain_id}
  `;
  const total = parseInt(countQuery[0].total);

  // Get paginated subdomains
  const subdomainQuery = await sql`
    select subdomain.id, subdomain.name, subdomain.address, domain.name as domain
    from subdomain join domain 
    on subdomain.domain_id = domain.id 
    where domain.id = ${req.query.domain_id}
    order by subdomain.name
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return res.status(200).json({
    data: subdomainQuery,
    pagination: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit)
    }
  });
}
