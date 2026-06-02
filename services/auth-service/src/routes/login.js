// Login route
module.exports = async (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication
  if (username && password) {
    return res.json({ 
      token: 'jwt-token-here',
      user: { username }
    });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
};
