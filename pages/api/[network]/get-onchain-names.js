import sql from "../../../lib/db";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  const domain = req.query.domain;
  const addresses = req.query.addresses
    ?.split(",")
    .map((address) => address.toLowerCase()); // comma-separated
  const name = req.query.name;

  if (!domain) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let subDomainNames;

  if (name) {
    subDomainNames = await sql`
      SELECT
        name,
        address,
        owner,
        "token_id"      AS "tokenId",
        "text_records"  AS "textRecordsPayload",
        "coin_types"    AS "coinTypesPayload",
        "registered_at" AS "registeredAt",
        contenthash
      FROM ponder_prod."NftSubdomain"
      WHERE domain_name = ${domain}
        AND "name" = ${name}
      ORDER BY "registered_at" DESC
    `;
  } else {
    if (addresses && addresses.length > 0) {
      subDomainNames = await sql`
        SELECT
          name,
          address,
          owner,
          "token_id"      AS "tokenId",
          "text_records"  AS "textRecordsPayload",
          "coin_types"    AS "coinTypesPayload",
          "registered_at" AS "registeredAt",
          contenthash
        FROM ponder_prod."NftSubdomain"
        WHERE domain_name = ${domain}
          AND "address" = ANY (${addresses})
        ORDER BY "registered_at" DESC
      `;
    } else {
      subDomainNames = await sql`
        SELECT
          name,
          address,
          owner,
          "token_id"      AS "tokenId",
          "text_records"  AS "textRecordsPayload",
          "coin_types"    AS "coinTypesPayload",
          "registered_at" AS "registeredAt",
          contenthash
        FROM ponder_prod."NftSubdomain"
        WHERE domain_name = ${domain}
        ORDER BY "registered_at" DESC
      `;
    }
  }

  if (subDomainNames.length === 0) {
    return res.status(200).json([]);
  }

  const result = [];
  for (const {
    name,
    address,
    owner,
    tokenId,
    textRecordsPayload,
    coinTypesPayload,
    registeredAt,
    contenthash,
  } of subDomainNames) {
    const text_records = JSON.parse(textRecordsPayload);
    const coin_types = JSON.parse(coinTypesPayload);

    result.push({
      name,
      address,
      owner,
      tokenId,
      text_records,
      coin_types,
      registeredAt,
      contenthash,
    });
  }

  return res.status(200).json(result);
}

export default cors(handler);
