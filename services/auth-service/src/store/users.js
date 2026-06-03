const bcrypt = require('bcryptjs');

const users = new Map();

const demoHash = bcrypt.hashSync('password123', 10);
users.set('demo', { username: 'demo', passwordHash: demoHash, createdAt: new Date().toISOString() });

module.exports = users;
