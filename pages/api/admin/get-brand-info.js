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
  // Get Domain && Name
  if (!req.query.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  const brandQuery = await sql`
  select brand.id, domain.name as domain, brand.name, brand.url_slug, brand.claim_slug, brand.description, brand.banner_image, brand.footer_image, brand.default_avatar, brand.default_description,
  brand.share_with_data_providers, brand.show_converse_link, brand.show_mailchain_link
  from brand join domain 
  on brand.domain_id = domain.id 
  where domain.name = ${req.query.domain}`;

  return res.status(200).json(brandQuery[0]);
}
