const responseHandler = require("../Utils/responseHandler");

const errorHandler = (err, req, res, next) => {
  console.log(err);

  if (err.code === 11000) {
    responseHandler.error(res, "Email must be unique", null, 409);
    return;
  }

  responseHandler.error(res, "Something went wrong");
};

module.exports = errorHandler;
