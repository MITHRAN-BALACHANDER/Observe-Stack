const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../logging/logger');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

const proxy = createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/notifications': '' },
  on: {
    error: (err, req, res) => {
      logger.error('notification proxy error', { error: err.message, path: req.path });
      res.status(502).json({ error: 'notification service unavailable' });
    }
  }
});

module.exports = proxy;
