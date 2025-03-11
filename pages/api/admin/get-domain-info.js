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
  if (!req.query.domain_id) {
    return res.status(400).json({ error: "Domain is required" });
  }

  const domainQuery = await sql`
  select domain.id, domain.name, domain.address, domain.contenthash
  from domain
  where domain.id = ${req.query.domain_id}`;

  // get text records from db
  const textRecordQuery = await sql`
  select * from domain_text_record where domain_id = ${domainQuery[0].id} order by id `;

  let textRecords = {};
  textRecordQuery.map((record) => {
    textRecords[record.key] = record.value;
  });

  // get coin types from db
  const coinTypesQuery = await sql`
      SELECT * FROM domain_coin_type WHERE domain_id = ${domainQuery[0].id} order by id `;

  const coinTypes = {};
  coinTypesQuery.forEach((coin) => {
    coinTypes[coin.coin_type] = coin.address;
  });

  const domainPayload = {
    id: domainQuery[0].id,
    address: domainQuery[0].address || "",
    domain: domainQuery[0].name,
    text_records: textRecords,
    coin_types: coinTypes,
    contenthash: domainQuery[0].contenthash || "",
  };
  return res.status(200).json(domainPayload);
}
