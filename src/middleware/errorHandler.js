const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    message: error.message || "Internal Server Error"
  });
};

module.exports = errorHandler;
