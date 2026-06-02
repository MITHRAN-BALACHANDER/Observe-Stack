// Health check route
module.exports = (req, res) => {
  res.json({ status: 'healthy' });
};
