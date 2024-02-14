import { getToken } from "next-auth/jwt";
import { getAvailability } from "../../utils/ServerUtils";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please refresh." });
  }

  // Get Domain && Name
  if (!req.query.domain) {
    return res.status(400).json({ error: "Domain is required" });
  }
  if (!req.query.name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const domain = req.query.domain;
  const name = req.query.name;

  // Check name availability
  const { nameAvailable, errorMsg } = await getAvailability(domain, name);

  return res
    .status(200)
    .json({ nameAvailable: nameAvailable, errorMsg: errorMsg });
}
