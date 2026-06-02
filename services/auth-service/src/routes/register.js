const express = require('express');
const bcrypt = require('bcrypt');
const logger = require('../logging/logger');
const users = require('../store/users');

const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  if (!username || !password) {
    log.warn('registration attempt with missing fields');
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (password.length < 8) {
    log.warn('registration attempt with weak password', { username });
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }

  if (users.has(username)) {
    log.warn('registration attempt for existing username', { username });
    return res.status(409).json({ error: 'username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username, { username, passwordHash, createdAt: new Date().toISOString() });

  log.info('user registered successfully', { username });

  res.status(201).json({ message: 'user registered successfully', username });
});

module.exports = router;
