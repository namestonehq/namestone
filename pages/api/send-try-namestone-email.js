import nodemailer from "nodemailer";
import sql from "../../lib/db";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, email, project, domain } = JSON.parse(req.body);

    if (!name || !email || !domain || !project) {
      res.status(400).json({ error: "Missing parameters" });
      return;
    }

    // Create a new API key for the user
    //Check if domain exists
    let domainQuery = await sql`
  select * from domain where name = ${domain.toLowerCase()} limit 1;`;
    if (domainQuery.length > 0) {
      // if domain exists we return an error
      res.status(400).json({ error: "Domain already exists" });
      return;
    }

    let insertDomain = { name: domain, name_limit: 1000 };
    domainQuery = await sql`
  insert into domain ${sql(insertDomain, "name", "name_limit")}
  returning id;`;
    let insertBrand = {
      name: project,
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

    // send email
    const email_subject = `Your Namestone API Key`;
    const email_message = `
    Hi ${name},
    Here's your namestone API key for your project ${project}:
    ${apiKey[0].key}

    You can use this key to create and manage subdomains for ${domain}.
    Here is an example: https://namestone.xyz/docs/set-name 
    Please keep this key safe and do not share it with anyone.
    `;

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
      from: "apikey@namestone.xyz",
      to: email,
      subject: email_subject,
      text: email_message,
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
    Name: ${name}
    Email: ${email}
    Project: ${project}
    Domain: ${domain}
    `;

    const mailOptions2 = {
      from: "apikey@namestone.xyz",
      to: "darian@nftychat.xyz, alex@nftychat.xyz, darian@namestone.xyz, alex@namestone.xyz",
      subject: email_subject2,
      text: email_message2,
    };

    try {
      await transporter.sendMail(mailOptions2);
      res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error sending email" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
