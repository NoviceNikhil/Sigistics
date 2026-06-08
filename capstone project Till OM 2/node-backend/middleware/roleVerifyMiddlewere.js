const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      // console.log("authorize file --->", user);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - No user found",
        });
      }

      // role check
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - Access denied",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Role authorization failed",
      });
    }
  };
};

module.exports = authorizeRoles;
