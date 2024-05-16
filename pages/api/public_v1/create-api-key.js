import nodemailer from "nodemailer";
import sql from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { providerUrl } from "../../../utils/ServerUtils";
import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
  origin: "*",
});

// Async function to resolve ENS name to address
const resolveENS = async (name, provider) => {
  try {
    const address = await provider.resolveName(name);
    return address;
  } catch (error) {
    return null;
  }
};
async function handler(req, res) {
  if (req.method === "POST") {
    console.log(req.body);
    const { name, email, wallet, domain } = req.body;

    if (!name || !email || !domain || !wallet) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Create a new API key for the user
    // check if domain is toplevel ( has no more than 1 dot)
    if (domain.split(".").length > 2) {
      return res
        .status(400)
        .json({ error: "Invalid domain -- must be top level" });
    }
    //Check if domain exists
    let domainQuery = await sql`
  select * from domain where name = ${domain.toLowerCase()} limit 1;`;
    if (domainQuery.length > 0) {
      // if domain exists we return an error
      return res.status(400).json({ error: "Domain already exists" });
    }
    // check if wallet is an ens name by checking for dot
    let address;
    if (wallet.includes(".")) {
      let provider = new ethers.providers.JsonRpcProvider(providerUrl);
      // try to resolve the ens name
      address = await resolveENS(wallet, provider);
      if (!address) {
        return res.status(400).json({ error: "Invalid ENS name" });
      }
    } else {
      // check if wallet is a valid address
      try {
        address = ethers.utils.getAddress(wallet);
      } catch (error) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
    }

    let insertDomain = { name: domain, name_limit: 1000 };
    domainQuery = await sql`
  insert into domain ${sql(insertDomain, "name", "name_limit")}
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
    const email_subject2 = `Namestone API Key Created: ${name} - ${email}`;
    const email_message2 = `
    API Key Created For
    Name: ${name}
    Email: ${email}
    Wallet Address: ${wallet}
    Domain: ${domain}
    `;

    const mailOptions2 = {
      from: "apikey@namestone.xyz",
      to: "darian@namestone.xyz, alex@namestone.xyz",
      subject: email_subject2,
      text: email_message2,
    };

    try {
      await transporter.sendMail(mailOptions2);
      return res.status(200).json({ api_key: apiKey[0].key, domain: domain });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Error sending email" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

export default cors(handler);
