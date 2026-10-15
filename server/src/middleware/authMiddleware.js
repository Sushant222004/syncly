const jwt = require("jsonwebtoken");
const responseHandler = require("../Utils/responseHandler");
const auth = (req, res, next) => {
  const head = req.headers.authorization;

  if (!head) {
    return responseHandler.error(res, "Authoriztion token required", null, 401);
  }

  const token = head.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return responseHandler.error(res, "Invalid or expired token", null, 401);
  }
};

module.exports = auth;
