import Cors from "micro-cors";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  return res.status(200).json({ success: true });
}

export default cors(handler);
