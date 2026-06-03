const { v4: uuidv4 } = require('uuid');

const SAFE_ID_RE = /^[\w\-]{1,128}$/;

module.exports = (req, res, next) => {
  req.requestId = uuidv4();

  const provided = req.headers['x-correlation-id'];
  req.correlationId = (provided && SAFE_ID_RE.test(provided)) ? provided : uuidv4();

  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);

  next();
};
