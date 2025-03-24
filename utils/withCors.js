import Cors from "micro-cors";

/**
 * Helper function to enable CORS for API endpoints
 *
 * @param {Function} handler - The API route handler
 * @param {Array} allowedMethods - Array of HTTP methods to allow (default: GET, HEAD, OPTIONS)
 * @returns {Function} - The handler with CORS enabled
 */
export const withCors = (
  handler,
  allowedMethods = ["GET", "HEAD", "OPTIONS"]
) => {
  const cors = Cors({
    allowMethods: allowedMethods,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
  });

  return cors(handler);
};

export default withCors;
