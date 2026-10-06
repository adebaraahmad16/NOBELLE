import { RequestHandler } from 'express';

// Per-process limiter. Use a shared gateway limiter when deploying multiple replicas.
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key);
  }, windowMs);
  cleanup.unref();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.expires <= now) {
      bucket = { count: 0, expires: now + windowMs };
      buckets.set(key, bucket);
    }
    if (++bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.expires - now) / 1000));
      res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', errors: [] });
      return;
    }
    next();
  };
}
