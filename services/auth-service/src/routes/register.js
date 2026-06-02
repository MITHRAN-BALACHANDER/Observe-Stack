// Register route
module.exports = async (req, res) => {
  const { username, email, password } = req.body;
  
  // Mock registration
  if (username && email && password) {
    return res.status(201).json({ 
      user: { username, email },
      message: 'User registered successfully'
    });
  }
  
  return res.status(400).json({ error: 'Invalid input' });
};
