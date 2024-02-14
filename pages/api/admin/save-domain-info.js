import sql from "../../../lib/db";
import { getToken } from "next-auth/jwt";
import { encodeContenthash } from "../../../utils/ServerUtils";

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

  let domainData = JSON.parse(req.body).brandData;

  if (!domainData?.id || !domainData?.address || !domainData?.textRecords) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (domainData.contenthash === "") {
    domainData.contenthash = null;
  }
  // encode contenthash from link to contenthash
  if (domainData.contenthash) {
    try {
      domainData.contenthash = encodeContenthash(domainData.contenthash);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid contenthash" });
    }
  }

  await sql`
  update domain set ${sql(domainData, "address", "contenthash")} where id = ${
    domainData.id
  }`;

  let textRecords = [];
  for (let i = 0; i < domainData.textRecords.length; i++) {
    let textRecord = domainData.textRecords[i];
    textRecords.push({
      key: textRecord[0],
      value: textRecord[1],
      domain_id: domainData.id,
    });
  }

  await sql`
  delete from domain_text_record where domain_id = ${domainData.id}
  `;
  if (textRecords.length > 0) {
    await sql`
    insert into domain_text_record ${sql(
      textRecords,
      "key",
      "value",
      "domain_id"
    )}
    `;
  }
  return res.status(200).json({ success: true });
}
