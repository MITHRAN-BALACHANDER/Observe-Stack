const logger = require('../logging/logger');
const { httpRequestsTotal, httpRequestDurationSeconds } = require('../metrics/prometheus');

module.exports = (req, res, next) => {
  if (req.path === '/metrics') return next();

  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationSeconds = Number(durationNs) / 1e9;
    const labels = { method: req.method, path: req.route?.path || req.path, status: res.statusCode };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);

    logger.info('request completed', {
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs: (durationSeconds * 1000).toFixed(3)
    });
  });

  next();
};
