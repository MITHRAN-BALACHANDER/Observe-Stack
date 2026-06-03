const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../logging/logger');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const proxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/auth': '' },
  on: {
    error: (err, req, res) => {
      logger.error('auth proxy error', { error: err.message, path: req.path });
      res.status(502).json({ error: 'auth service unavailable' });
    }
  }
});

module.exports = proxy;
