import { getToken } from "next-auth/jwt";
import fetch from "node-fetch";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }
  try {
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
      },
    });

    const data = await response.json();
    const uploadUrl = data.result.uploadURL;

    res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
