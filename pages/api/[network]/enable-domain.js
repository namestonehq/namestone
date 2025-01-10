import nodemailer from "nodemailer";
import sql from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { normalize } from "viem/ens";
import { checkResolver, getNetwork } from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { verifySignature, getDomainOwner } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  if (req.method === "POST") {
    const network = getNetwork(req);
    if (!network) {
      return res.status(400).json({ error: "Invalid network" });
    }

    let {
      company_name,
      email,
      address,
      domain,
      signature,
      api_key,
      cycle_key,
    } = req.body;

    if (!company_name || !email || !domain || !address || !signature) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    // Check domain is valid
    let domainName;
    try {
      domainName = normalize(domain);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ error: "Invalid ens domain" });
    }

    //// OWNERSHIP CHECKS
    // check if address is valid
    try {
      address = ethers.utils.getAddress(address);
    } catch (error) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // check if domain is owned by the wallet
    const domainOwner = await getDomainOwner(domainName, network);
    if (domainOwner !== address) {
      return res
        .status(400)
        .json({ error: "Your wallet needs to own the domain" });
    }

    // Other DOMAIN CHECKS
    // check if domain is toplevel ( has no more than 1 dot)
    if (domainName.split(".").length > 2) {
      return res
        .status(400)
        .json({ error: "Invalid domain -- must be top level" });
    }
    //Check if domain exists
    let domainQuery = await sql`
     select * from domain where name = ${domainName.toLowerCase()} and network = ${network} limit 1;`;

    if (domainQuery.length > 0 && cycle_key === "1") {
      // if domain exists and cycle key is true we change the api_key
      let apiKey = uuidv4();
      await sql`
      update api_key set key = ${apiKey} where domain_id = ${domainQuery[0].id};`;
      return res.status(200).json({
        message: "API key cycled!",
        api_key: apiKey,
        domain: domainName,
      });
    } else if (domainQuery.length > 0) {
      // if domain exists and cycle key is false we return existing api_key
      let existingApiKeyQuery = await sql` 
      select * from api_key where domain_id = ${domainQuery[0].id} limit 1;`;
      return res.status(200).json({
        message: "Domain already enabled!",
        api_key: existingApiKeyQuery[0].key,
        domain: domainName,
      });
    }

    // check if domain has a good resolver
    let goodResolver = await checkResolver(domainName, network);
    if (!goodResolver) {
      return res.status(400).json({ error: "Invalid domain resolver" });
    }

    // check if signature is valid
    const validSignature = await verifySignature(address, signature);
    if (!validSignature.success) {
      return res.status(400).json({ error: validSignature.error });
    }

    let insertDomain = { name: domainName, name_limit: 1000, network: network };
    domainQuery = await sql`
  insert into domain ${sql(insertDomain, "name", "name_limit", "network")}
  returning id;`;
    let insertBrand = {
      name: domainName,
      url_slug: domainName,
      domain_id: domainQuery[0].id,
    };
    await sql`
  insert into brand ${sql(insertBrand, "name", "url_slug", "domain_id")}
  `;
    // create api key
    // check if api_key sent in request
    let apiKey;
    if (api_key) {
      // check if api_key is valid
      let apiKeyQuery = await sql`
    select * from api_key where key = ${api_key} limit 1;`;
      if (apiKeyQuery.length > 0) {
        return res.status(400).json({ error: "Invalid API key" });
      }
      apiKey = api_key;
    } else {
      // else make a new key
      apiKey = uuidv4();
    }
    // Insert api key
    const insertApiKey = {
      key: apiKey,
      domain_id: domainQuery[0].id,
    };
    await sql`
  insert into api_key ${sql(insertApiKey, "key", "domain_id")} returning key;
  `;

    // create admin
    let insertAdmin = {
      address: address,
      domain_id: domainQuery[0].id,
    };
    await sql` insert into admin ${sql(insertAdmin, "address", "domain_id")}`;

    const transporter = nodemailer.createTransport({
      // Configurations for the transport method here. This is an example using Gmail.
      // Please replace it with your own configurations.
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Alert the team that a new API key has been created
    const email_subject = `Namestone API Key Created: ${company_name} - ${domain} - ${email}`;
    const email_message = `
    API Key Created For
    Name: ${company_name}
    Email: ${email}
    Wallet Address: ${address}
    Domain: ${domain}
    `;

    const mailOptions = {
      from: "apikey@namestone.xyz",
      to: "darian@namestone.xyz, alex@namestone.xyz",
      subject: email_subject,
      text: email_message,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({
        message: "Domain enabled!",
        api_key: apiKey,
        domain: domainName,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Error sending email" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export default cors(handler);
