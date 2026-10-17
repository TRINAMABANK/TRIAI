/**
 * In-memory sliding window rate limiter middleware for TRÍ AI SaaS
 * Protects against brute-force attacks and denial-of-service attempts.
 */

export function createRateLimiter({ windowMs = 60 * 1000, max = 30, message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }) {
  const hits = new Map();

  // Periodically clean up stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Determine key: user IP (handling proxy headers)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || req.ip || 'unknown_ip');
    const key = `${req.baseUrl || ''}${req.path}:${clientIp}`;

    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
}

// Strict limiter for authentication endpoints (prevent brute-forcing logins and registrations)
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,              // max 20 requests per minute
  message: 'Bạn đã thực hiện quá nhiều yêu cầu xác thực. Vui lòng chờ 1 phút trước khi thử lại.'
});

// Limiter for AI Chat interactions (prevent API credit exhaustion)
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Bạn đang gửi câu hỏi quá nhanh. Vui lòng giảm tần suất gửi tin nhắn.'
});

export default {
  createRateLimiter,
  authRateLimiter,
  chatRateLimiter
};
