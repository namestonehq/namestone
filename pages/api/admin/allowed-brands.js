import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  let superAdmin = false;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  let brands;
  const superAdminQuery = await sql`
  SELECT * FROM super_admin WHERE address = ${token.sub};`;
  // if not super admin check admin
  if (superAdminQuery.length === 0) {
    const adminQuery = await sql`
    SELECT domain_id, address FROM admin WHERE address = ${token.sub};
  `;
    if (adminQuery.length === 0) {
      return res.status(401).json({ error: "Unauthorized. Please refresh." });
    } else {
      const domain_ids = adminQuery.map((admin) => {
        return admin.domain_id;
      });
      brands = await sql`
      SELECT 
      brand.domain_id, brand.name, brand.url_slug, domain.name as domain, brand.default_avatar
      FROM brand join domain on brand.domain_id = domain.id where domain.id = ANY(${domain_ids}) order by brand.id;
    `;
    }
  }
  // otherwise get all brands
  else {
    superAdmin = true;
    brands = await sql`
    SELECT 
    brand.domain_id, brand.name, brand.url_slug, domain.name as domain, brand.default_avatar
    FROM brand join domain on brand.domain_id = domain.id order by brand.id;
  `;
  }

  const brandDict = brands.reduce(function (result, brand) {
    let key = brand.url_slug;
    result[key] = brand;
    return result;
  }, {});
  // sort brandUrls by name
  const brandUrls = Object.keys(brandDict).sort();

  return res.status(200).json({
    superAdmin: superAdmin,
    brandUrls: brandUrls,
    brandDict: brandDict,
  });
}
