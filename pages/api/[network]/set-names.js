import sql from "../../../lib/db";
import {
  checkApiKey,
  getNetwork,
  getClientIp,
} from "../../../utils/ServerUtils";
import { encodeContenthash } from "../../../utils/ContentHashUtils.js";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const network = getNetwork(req);
  if (!network) {
    return res.status(400).json({ error: "Invalid network" });
  }
  const { headers } = req;

  // Check required parameters
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  if (!body.domain) {
    return res.status(400).json({ error: "Missing domain" });
  }
  if (!body.names || !Array.isArray(body.names) || body.names.length === 0) {
    return res
      .status(400)
      .json({ error: "Missing names array or empty array" });
  }

  // Check API key
  const allowedApi = await checkApiKey(
    headers.authorization || req.query.api_key,
    body.domain
  );
  if (!allowedApi) {
    return res
      .status(401)
      .json({ error: "You are not authorized to use this endpoint" });
  }

  let domain;
  try {
    domain = normalize(body.domain);
  } catch (e) {
    return res.status(400).json({ error: "Invalid domain ens name" });
  }

  // Validate all names first
  const normalizedNames = [];
  for (let i = 0; i < body.names.length; i++) {
    const nameObj = body.names[i];
    if (!nameObj.name) {
      return res.status(400).json({
        error: `Missing name in names array at index ${i}`,
      });
    }
    try {
      const normalizedName = normalize(nameObj.name);
      normalizedNames.push({
        ...nameObj,
        name: normalizedName,
        originalIndex: i,
      });
    } catch (e) {
      return res.status(400).json({
        error: `Invalid ens name at index ${i}: ${nameObj.name}`,
      });
    }
  }

  if (normalizedNames.length > 50) {
    return res.status(400).json({
      error: `Please set 50 or less names at once.`,
    });
  }

  // Get domain info and check limits
  const domainQuery = await sql`
    select id, name_limit from domain where name = ${domain} and network = ${network} limit 1`;

  if (domainQuery.length === 0) {
    return res.status(400).json({ error: "Domain does not exist" });
  }

  const domainId = domainQuery[0].id;
  const nameLimit = domainQuery[0].name_limit;

  // Check name limit if applicable
  if (nameLimit > 0) {
    const subdomainCount = await sql`
      select count(*) from subdomain where domain_id = ${domainId}`;

    const currentCount = parseInt(subdomainCount[0].count);
    const newNamesCount = normalizedNames.length;

    if (currentCount + newNamesCount > nameLimit) {
      return res.status(400).json({
        error: `Api name limit would be exceeded. Current: ${currentCount}, Adding: ${newNamesCount}, Limit: ${nameLimit}. Please contact alex@namestone.com to increase your limit`,
      });
    }
  }

  // Process each name in a transaction
  const results = [];
  const errors = [];

  try {
    await sql.begin(async (sql) => {
      for (const nameData of normalizedNames) {
        try {
          const result = await processName(
            sql,
            nameData,
            domainId,
            body.domain
          );
          results.push({
            index: nameData.originalIndex,
            name: nameData.name,
            success: true,
            subdomainId: result.subdomainId,
          });
        } catch (error) {
          errors.push({
            index: nameData.originalIndex,
            name: nameData.name,
            error: error.message,
          });
        }
      }

      // If any errors occurred, rollback the transaction
      if (errors.length > 0) {
        throw new Error("Batch operation failed");
      }
    });

    // Log user engagement for successful batch
    const clientIp = getClientIp(req);
    const jsonPayload = JSON.stringify({
      body: body,
      ip_address: clientIp,
      batch_size: normalizedNames.length,
      results: results,
    });

    await sql`
      insert into user_engagement (address, name, details)
      values ('batch_operation', 'set_names', ${jsonPayload})`;

    return res.status(200).json({
      success: true,
      processed: results.length,
      results: results,
    });
  } catch (transactionError) {
    return res.status(400).json({
      error: "Batch operation failed",
      processed: 0,
      errors: errors,
      total: normalizedNames.length,
    });
  }
}

async function processName(sql, nameData, domainId, originalDomain) {
  const {
    name,
    address = "",
    contenthash,
    text_records,
    coin_types,
  } = nameData;

  // Process contenthash
  let processedContenthash = contenthash || null;
  if (processedContenthash === "") {
    processedContenthash = null;
  }
  let contenthashRaw = processedContenthash;

  if (processedContenthash) {
    try {
      processedContenthash = encodeContenthash(processedContenthash);
    } catch (e) {
      throw new Error(`Invalid contenthash for name ${name}`);
    }
  }

  // Check if subdomain exists
  const subdomainQuery = await sql`
    select id, address
    from subdomain
    where name = ${name} and domain_id = ${domainId}`;

  let subdomainId;

  if (subdomainQuery.length > 0) {
    // Update existing subdomain
    await sql`
      update subdomain set 
        address = ${address},
        contenthash = ${processedContenthash},
        contenthash_raw = ${contenthashRaw}
      where id = ${subdomainQuery[0].id}`;

    subdomainId = subdomainQuery[0].id;
  } else {
    // Insert new subdomain
    const insertResult = await sql`
      insert into subdomain (
        name, address, domain_id, contenthash, contenthash_raw
      ) values (
        ${name}, ${address}, ${domainId}, ${processedContenthash}, ${contenthashRaw}
      )
      returning id;`;

    subdomainId = insertResult[0].id;
  }

  // Delete existing text records
  await sql`delete from subdomain_text_record where subdomain_id = ${subdomainId}`;

  // Insert text records
  if (text_records) {
    for (const record in text_records) {
      await sql`
        insert into subdomain_text_record (
          subdomain_id, key, value
        ) values (
          ${subdomainId}, ${record}, ${text_records[record]}
        )`;
    }
  }

  // Delete existing coin types
  await sql`delete from subdomain_coin_type where subdomain_id = ${subdomainId}`;

  // Insert coin types
  if (coin_types) {
    for (const coin_type in coin_types) {
      await sql`
        insert into subdomain_coin_type (
          subdomain_id, coin_type, address
        ) values (
          ${subdomainId}, ${coin_type}, ${coin_types[coin_type]}
        )`;
    }
  }

  return { subdomainId };
}

export default cors(handler);
