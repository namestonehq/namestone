import sql from "../../../lib/db";
import { getAdminTokenById } from "../../../utils/ServerUtils";

export default async function handler(req, res) {
  // check Domain
  if (!req.query.domain_id) {
    return res.status(400).json({ error: "Domain is required" });
  }

  // check Admin permissions
  const adminToken = await getAdminTokenById(req, req.query.domain_id);

  if (!adminToken) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  const domainQuery = await sql`
  select domain.id, domain.name, domain.address, domain.contenthash_raw as contenthash
  from domain
  where domain.id = ${req.query.domain_id}`;

  if (domainQuery.length == 0) {
    return res.status(401).json({ error: "Domain not found" });
  }

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
