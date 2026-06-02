// Send email route
module.exports = async (req, res) => {
  const { to, subject, body } = req.body;
  
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Mock email sending
  res.json({
    messageId: `EMAIL-${Date.now()}`,
    to,
    subject,
    status: 'sent',
    timestamp: new Date()
  });
};
