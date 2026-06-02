const logger = require('../logging/logger');
const { httpRequestDuration, httpRequestTotal, httpRequestErrors } = require('../metrics/prometheus');

module.exports = (req, res, next) => {
  if (req.path === '/metrics') return next();

  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationSeconds = Number(durationNs) / 1e9;
    const route = req.route?.path || req.path;
    const { statusCode } = res;

    httpRequestDuration.labels(req.method, route, statusCode).observe(durationSeconds);
    httpRequestTotal.labels(req.method, route, statusCode).inc();

    if (statusCode >= 400) {
      httpRequestErrors.labels(req.method, route, statusCode).inc();
    }

    logger.info('request proxied', {
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode,
      latencyMs: (durationSeconds * 1000).toFixed(3)
    });
  });

  next();
};
