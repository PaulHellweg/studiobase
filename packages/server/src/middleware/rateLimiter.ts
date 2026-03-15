import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, try again later' },
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many booking attempts' },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Stripe sends bursts
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
