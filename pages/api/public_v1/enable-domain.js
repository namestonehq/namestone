import nodemailer from "nodemailer";
import sql from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { checkResolver, providerUrl } from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { verifySignature, getDomainOwner } from "../../../utils/ServerUtils";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

async function handler(req, res) {
  if (req.method === "POST") {
    console.log(req.body);
    const { company_name, email, address, domain, signature, api_key } =
      req.body;

    if (!company_name || !email || !domain || !wallet || !signature) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    // Check domain is valid
    let domainName;
    try {
      domainName = normalize(domain);
    } catch (e) {
      return res.status(400).json({ error: "Invalid ens domain" });
    }

    //// OWNERSHIP CHECKS
    // check if address is valid
    try {
      ethers.utils.getAddress(address);
    } catch (error) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // check if domain is owned by the wallet
    const domainOwner = await getDomainOwner(address, domainName);
    if (domainOwner !== address) {
      return res
        .status(400)
        .json({ error: "Your wallet needs to own the domain" });
    }

    // check if signature is valid
    const validSignature = await verifySignature(address, signature);
    if (!validSignature.success) {
      return res.status(400).json({ error: validSignature.error });
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
  select * from domain where name = ${domainName.toLowerCase()} limit 1;`;
    if (domainQuery.length > 0) {
      // if domain exists we return an error
      return res.status(400).json({ error: "Domain already enabled" });
    }

    // check if domain has a good resolver
    let goodResolver = await checkResolver(domainName);
    if (!goodResolver) {
      return res.status(400).json({ error: "Invalid domain resolver" });
    }

    let insertDomain = { name: domainName, name_limit: 1000 };
    domainQuery = await sql`
  insert into domain ${sql(insertDomain, "name", "name_limit")}
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
      apiKey = api_key;
    } else {
      // else make a new key
      apiKey = uuidv4();
    }
    // Insert api key
    insertApiKey = {
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
    const email_subject = `Namestone API Key Created: ${name} - ${domain} - ${email}`;
    const email_message = `
    API Key Created For
    Name: ${company_name}
    Email: ${email}
    Wallet Address: ${wallet}
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
        api_key: apiKey[0].key,
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
