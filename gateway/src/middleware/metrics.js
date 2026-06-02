const logger = require('../logging/logger');
const { httpRequestDuration, httpRequestTotal, httpRequestErrors } = require('../metrics/prometheus');

module.exports = (req, res, next) => {
  const start = Date.now();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode;

    httpRequestDuration
      .labels(req.method, route, statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, statusCode)
      .inc();

    if (statusCode >= 400) {
      httpRequestErrors
        .labels(req.method, route, statusCode)
        .inc();
    }

    logger.info('HTTP request', {
      method: req.method,
      route,
      statusCode,
      duration,
      correlationId: req.correlationId
    });
  });

  next();
};
