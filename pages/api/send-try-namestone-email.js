import nodemailer from "nodemailer";
import sql from "../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { getToken } from "next-auth/jwt";
import { getDomainOwner } from "../../utils/ServerUtils";

// Async function to resolve ENS name to address
const resolveENS = async (name, provider) => {
  try {
    const address = await provider.resolveName(name);
    return address;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Please refresh." });
    }

    const wallet = token.sub;
    const { name, email, domain, network } = JSON.parse(req.body);

    if (!name || !email || !domain || !network) {
      res.status(400).json({ error: "Missing parameters" });
      console.log("Try Namestone error: Missing parameters");
      return;
    }

    // Create a new API key for the user
    // check if domain is toplevel ( has no more than 1 dot)
    if (domain.split(".").length > 2) {
      res.status(400).json({ error: "Invalid domain -- must be top level" });
      console.log("Try Namestone error: Invalid domain -- must be top level");
      return;
    }
    //Check if domain exists
    let domainQuery = await sql`
  select * from domain where name = ${domain.toLowerCase()} and network = ${network} limit 1;`;
    if (domainQuery.length > 0) {
      // if domain exists we return an error
      res.status(400).json({ error: "Domain already exists" });
      console.log("Try Namestone error: Domain already exists");
      return;
    }

    // check if wallet is a valid address
    let address;
    try {
      address = ethers.utils.getAddress(wallet);
    } catch (error) {
      res.status(400).json({ error: "Invalid wallet address" });
      console.log("Try Namestone error: Invalid wallet address");
      return;
    }

    //Check if user Owns the domain
    const domainOwner = await getDomainOwner(domain, network);
    if (domainOwner !== address) {
      return res
        .status(400)
        .json({ error: "Your wallet needs to own the domain" });
    }

    let insertDomain = {
      name: domain,
      name_limit: 100000,
      address: address,
      network: network,
    };
    domainQuery = await sql`
  insert into domain ${sql(
    insertDomain,
    "name",
    "name_limit",
    "address",
    "network"
  )}
  returning id;`;
    let insertBrand = {
      name: domain,
      url_slug: domain,
      domain_id: domainQuery[0].id,
    };
    await sql`
  insert into brand ${sql(insertBrand, "name", "url_slug", "domain_id")}
  `;
    // create api key
    let insertApiKey = {
      key: uuidv4(),
      domain_id: domainQuery[0].id,
    };
    let apiKey = await sql`
  insert into api_key ${sql(insertApiKey, "key", "domain_id")} returning key;
  `;

    // create admin
    let insertAdmin = {
      address: address,
      domain_id: domainQuery[0].id,
    };
    await sql` insert into admin ${sql(insertAdmin, "address", "domain_id")}`;

    // send email
    const email_subject = `Your Namestone API Key`;
    const email_message = `
    Hi ${name},
    Here's your namestone API key for your domain ${domain}:
    ${apiKey[0].key}

    On network ${network}.

    You can use this key to create and manage subdomains for ${domain}.
    Here is an example: https://namestone.com/docs/set-name 
    Please keep this key safe and do not share it with anyone.
    `;
    const email_html = `<!DOCTYPE html>
    <html>
    <head>
    <style>
    body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
    }
    .container {
        width: 500px;
        margin: 20px auto;
        padding: 20px;
    }
    .api-key {
        background-color: #f4f4f4;
        padding: 10px;
        margin: 20px 0;
        word-wrap: break-word;
        font-weight: bold;
        border-radius: 5px;
    }
    .button {
        display: inline-block;
        background-color: #FF8B36;
        color: #171717;
        padding: 8px 50px;
        text-decoration: none;
        border-radius: 8px;
        margin: 20px 0;
        font-weight: bold;
    }
</style>
    </head>
    <body>
        <div class="container">
            <p>Hi <strong>${name}</strong>,</p>
    
            <p>Your API key for <strong>${domain}</strong> on <strong>${network}</strong> is:</p>
    
            <div class="api-key">${apiKey[0].key}</div>
    
            <p>Do not share this key with anyone. This key grants you access to NameStone's API, allowing you to gaslessly issue and manage subnames for <strong>${domain}</strong>.</p>
    
            <p>Visit our <a href="https://namestone.com/docs">docs</a> to get started.</p>
    
            <p>Feel free to reach out with questions or further assistance.</p>
    
            <p>Alex<br>
            NameStone<br>
            <a href="https://namestone.com">namestone.com</a></p>
    
            <a href="https://namestone.com/docs" class="button">Docs</a>
        </div>
    </body>
    </html>`;

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

    const mailOptions = {
      from: "apikey@namestone.com",
      to: email,
      subject: email_subject,
      text: email_message,
      html: email_html,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error sending email" });
    }

    // Alert the team that a new API key has been created
    const email_subject2 = `Namestone API Key Created: ${name} - ${email}`;
    const email_message2 = `
    API Key Created For
    Source: Try Namestone
    Name: ${name}
    Email: ${email}
    Wallet Address: ${wallet}
    Domain: ${domain}
    Network: ${network}
    `;

    const mailOptions2 = {
      from: "apikey@namestone.com",
      to: "darian@namestone.com, alex@namestone.com",
      subject: email_subject2,
      text: email_message2,
    };

    try {
      await transporter.sendMail(mailOptions2);
      res.status(200).json({ address: address });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error sending email" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
