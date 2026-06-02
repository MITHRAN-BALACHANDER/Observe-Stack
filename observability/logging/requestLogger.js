const logger = require('./logger');

// Request-specific logging with correlation ID
function logRequest(req, res, next) {
  const correlationId = req.correlationId || req.headers['x-correlation-id'];
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      correlationId,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });

  next();
}

module.exports = logRequest;
