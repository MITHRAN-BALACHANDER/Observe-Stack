const express = require('express');
const logger = require('../logging/logger');
const orders = require('../store/orders');

const router = express.Router();

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  const order = orders.get(id);

  if (!order) {
    log.warn('order not found', { orderId: id });
    return res.status(404).json({ error: 'order not found', orderId: id });
  }

  log.info('order retrieved', { orderId: id });
  res.json(order);
});

module.exports = router;
