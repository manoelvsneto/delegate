const logger = require('../logger');

// Central error handler middleware
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
    statusCode,
  }, err.message || 'Internal Server Error');

  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    statusCode
  });
}

module.exports = errorHandler;