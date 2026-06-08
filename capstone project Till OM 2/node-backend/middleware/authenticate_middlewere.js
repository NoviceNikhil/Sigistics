const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Bearer token (header)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Check cookie (if not in header)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // console.log("token ---->", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attach user info
    req.user = decoded;
    // console.log("authentication successfully --->", req.user);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }
};

module.exports = authenticate;
