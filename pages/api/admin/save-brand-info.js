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

  let brandData = JSON.parse(req.body).brandData;
  if (!brandData?.id) {
    return res.status(400).json({ error: "All fields are required" });
  }
  await sql`
  update brand set ${sql(
    brandData,
    "name",
    "url_slug",
    "claim_slug",
    "description",
    "banner_image",
    "footer_image",
    "default_avatar",
    "default_description",
    "share_with_data_providers",
    "show_converse_link",
    "show_mailchain_link"
  )} where id = ${brandData.id}`;

  return res.status(200).json({ success: true });
}
