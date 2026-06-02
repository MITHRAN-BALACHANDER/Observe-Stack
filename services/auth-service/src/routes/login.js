const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../logging/logger');
const { loginSuccessTotal, loginFailureTotal, activeSessionsTotal } = require('../metrics/prometheus');
const users = require('../store/users');

const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  if (!username || !password) {
    loginFailureTotal.inc({ reason: 'missing_credentials' });
    log.warn('login attempt with missing credentials');
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = users.get(username);

  if (!user) {
    loginFailureTotal.inc({ reason: 'user_not_found' });
    log.warn('login attempt for non-existent user', { username });
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    loginFailureTotal.inc({ reason: 'invalid_password' });
    log.warn('login attempt with wrong password', { username });
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { sub: username, username },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  loginSuccessTotal.inc();
  activeSessionsTotal.inc();

  log.info('login successful', { username });

  res.json({
    token,
    user: { username },
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
});

module.exports = router;
