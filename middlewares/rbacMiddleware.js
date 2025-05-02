const { StatusCodes } = require("http-status-codes");

const isPermission = allowedRoles => async (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Forbidden (Role not found)!!" });
      return;
    }
    next();
  } catch (error) {
    console.log("Error from rbacMiddleware:", error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
};
const rbacMiddleware = { isPermission };
module.exports = rbacMiddleware;
