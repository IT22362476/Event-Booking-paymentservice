const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: Invalid Token Format" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: Token Missing" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    req.token = token;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(400).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken;
