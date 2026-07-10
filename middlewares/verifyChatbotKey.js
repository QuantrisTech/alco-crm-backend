const crypto = require("crypto");

function verifyChatbotKey(req, res, next) {
  const expectedKey = process.env.CHATBOT_API_KEY;

  if (!expectedKey) {
    console.error("CHATBOT_API_KEY is not set in environment variables");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization || "";
  const expected = `Bearer ${expectedKey}`;

  const providedBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  const isValid =
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);

  if (!isValid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = verifyChatbotKey;