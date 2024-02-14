import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, email, telegram, project, hear, comments } = JSON.parse(
      req.body
    );

    if (!name || !email) {
      res.status(400).json({ error: "Missing parameters" });
      return;
    }

    const email_subject = `Namestone inbound: ${name} - ${email}`;
    const email_message = `
    Name: ${name}
    Email: ${email}
    Telegram: ${telegram}
    Project: ${project}
    Heard about from: ${hear}
    Additional comments: ${comments}
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
      from: "darian@namestone.xyz",
      to: "darian@namestone.xyz, alex@namestone.xyz",
      subject: email_subject,
      text: email_message,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error sending email" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
