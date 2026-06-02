const bcrypt = require('bcrypt');

const users = new Map();

// Seed a demo user on startup
bcrypt.hash('password123', 10).then(hash => {
  users.set('demo', { username: 'demo', passwordHash: hash, createdAt: new Date().toISOString() });
});

module.exports = users;
