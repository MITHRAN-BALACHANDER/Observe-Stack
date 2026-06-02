const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  req.requestId = uuidv4();
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();

  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);

  next();
};
