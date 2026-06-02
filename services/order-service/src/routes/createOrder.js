// Create order route
module.exports = async (req, res) => {
  const { userId, items, totalAmount } = req.body;
  
  if (!userId || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const orderId = `ORDER-${Date.now()}`;
  
  res.status(201).json({
    orderId,
    userId,
    items,
    totalAmount,
    status: 'pending',
    createdAt: new Date()
  });
};
