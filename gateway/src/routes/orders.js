const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../logging/logger');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';

const proxy = createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/orders': '' },
  on: {
    error: (err, req, res) => {
      logger.error('order proxy error', { error: err.message, path: req.path });
      res.status(502).json({ error: 'order service unavailable' });
    }
  }
});

module.exports = proxy;
