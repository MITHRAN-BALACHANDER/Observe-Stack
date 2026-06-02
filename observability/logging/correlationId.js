const { v4: uuidv4 } = require('uuid');

class CorrelationIdManager {
  generateId() {
    return uuidv4();
  }

  getOrGenerateId(existingId) {
    return existingId || this.generateId();
  }

  middleware() {
    return (req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] || this.generateId();
      res.setHeader('x-correlation-id', req.correlationId);
      next();
    };
  }
}

module.exports = new CorrelationIdManager();
