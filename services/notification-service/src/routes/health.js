const express = require('express');

const router = express.Router();
const startTime = Date.now();

router.get('/', (req, res) => {
  res.json({
    status: 'up',
    service: 'notification-service',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
