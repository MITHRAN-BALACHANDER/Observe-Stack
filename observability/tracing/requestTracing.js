const { v4: uuidv4 } = require('uuid');
const traceContext = require('./traceContext');

// Request tracing middleware
function requestTracing(req, res, next) {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = uuidv4();
  const parentSpanId = req.headers['x-span-id'] || null;

  req.traceId = traceId;
  req.spanId = spanId;
  req.parentSpanId = parentSpanId;

  // Set headers for downstream services
  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-span-id', spanId);

  // Start trace span
  const span = traceContext.startTrace(traceId, spanId, parentSpanId);

  // Add request metadata to span
  span.tags.method = req.method;
  span.tags.path = req.path;
  span.tags.userAgent = req.headers['user-agent'];

  res.on('finish', () => {
    span.tags.statusCode = res.statusCode;
    traceContext.endSpan(traceId, spanId);
  });

  next();
}

module.exports = { requestTracing, traceContext };
