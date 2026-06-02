// Send SMS route
module.exports = async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Mock SMS sending
  res.json({
    messageId: `SMS-${Date.now()}`,
    phoneNumber,
    message,
    status: 'sent',
    timestamp: new Date()
  });
};
