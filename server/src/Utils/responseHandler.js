const responseHandler = {
  success: (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },
  error: (res, message, data = null, statusCode = 400) => {
    return res.status(statusCode).json({
      success: false,
      message, 
      data,
    });
  },
};

module.exports = responseHandler
