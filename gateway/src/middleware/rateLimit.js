const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

const store = new Map();

// Prune expired entries every minute to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}, WINDOW_MS).unref();

module.exports = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + WINDOW_MS };
  }

  entry.count++;
  store.set(ip, entry);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.reset / 1000));

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'too many requests, slow down' });
  }

  next();
};
