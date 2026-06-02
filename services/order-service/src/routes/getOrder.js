// Get order route
module.exports = async (req, res) => {
  const { orderId } = req.query;
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }
  
  res.json({
    orderId,
    status: 'completed',
    items: [],
    totalAmount: 99.99
  });
};
