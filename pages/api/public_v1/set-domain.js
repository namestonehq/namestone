import sql from "../../../lib/db";
import { checkApiKey, encodeContenthash } from "../../../utils/ServerUtils";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;
  let data = req.body;
  let apiKey = headers.authorization || req.query.api_key;

  // get first domain from api key
  const originalDomain =
    await sql`select * from domain join api_key on domain.id = api_key.domain_id where api_key.key = ${apiKey} order by domain.created_at asc limit 1;`;
  if (originalDomain.length === 0) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const allowedApi = await checkApiKey(apiKey, originalDomain[0].name);
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  if (!data.domain) {
    return res.status(400).json({ error: "something went wrong" });
  }
  // Get content hash and encode it
  let contenthash = data.contenthash || null;
  let rawContenthash = contenthash;
  if (contenthash === "") {
    contenthash = null;
  }
  // encode contenthash from link to contenthash
  if (contenthash) {
    try {
      contenthash = encodeContenthash(contenthash);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid contenthash" });
    }
  }

  let domainData = {
    name: data.domain.toLowerCase(),
    address: data.address || null,
    contenthash: contenthash || null,
    contenthash_raw: rawContenthash || null,
  };

  // check if domain exists
  let domainQuery = await sql`
  select * from domain where name = ${data.domain.toLowerCase()} limit 1;`;

  if (domainQuery.length > 0) {
    //// if Domain exists we update
    // check that domain is owned by user
    const apiQuery = await sql`
    select * from api_key where domain_id = ${domainQuery[0].id} and key = ${apiKey} limit 1;`;
    if (apiQuery.length === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    //update domain data
    domainQuery = await sql`
    update domain set ${sql(
      domainData,
      "address",
      "contenthash",
      "contenthash_raw"
    )}
    where name = ${data.domain.toLowerCase()}
    returning id;`;
  } else {
    //// iF domain doesn't exist we insert
    // insert domain data
    domainQuery = await sql`
    insert into domain ${sql(
      domainData,
      "name",
      "address",
      "contenthash",
      "contenthash_raw"
    )}
    returning id;`;
    let insertBrand = {
      name: data.domain.toLowerCase(),
      url_slug: data.domain.toLowerCase(),
      domain_id: domainQuery[0].id,
    };
    // create brand
    await sql`
    insert into brand ${sql(insertBrand, "name", "url_slug", "domain_id")}
    `;

    // insert api key
    let insertApiKey = {
      key: apiKey,
      domain_id: domainQuery[0].id,
    };
    await sql`
    insert into api_key ${sql(insertApiKey, "key", "domain_id")}
    `;

    // get admins from original domain
    const admins = await sql`
    select * from admin where domain_id = ${originalDomain[0].id};`;
    // insert admins into new domain
    for (const admin of admins) {
      await sql`
      insert into admin (address, domain_id)
      values (${admin.address}, ${domainQuery[0].id})`;
    }
  }

  // Delete existing text records
  await sql`delete from domain_text_record
  where domain_id = ${domainQuery[0].id}`;
  // Insert text records
  if (data.text_records) {
    for (const record in data.text_records) {
      await sql`
      insert into domain_text_record (
        domain_id, key, value
      ) values (
        ${domainQuery[0].id}, ${record}, ${data.text_records[record]}
      )`;
    }
  }

  // Delete existing coin types
  await sql`delete from domain_coin_type
  where domain_id = ${domainQuery[0].id}`;

  // Insert text coin
  if (body.coin_types) {
    for (const coin_type in body.coin_types) {
      await sql`
      insert into domain_coin_type (
        domain_id, coin_type, address
      ) values (
         ${domainQuery[0].id}, ${coin_type}, ${body.coin_types[coin_type]}
      )`;
    }
  }

  // log user engagement
  const jsonPayload = JSON.stringify({
    body: data,
    api_key: apiKey,
  });
  await sql`
  insert into user_engagement (address, name, details)
  values (${data.address || null},'set_domain', ${jsonPayload})`;

  return res.status(200).json({ success: true });
}

export default cors(handler);
