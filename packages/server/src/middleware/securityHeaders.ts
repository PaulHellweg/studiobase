import { Request, Response, NextFunction } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // HSTS — tell browsers to always use HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Disable legacy XSS auditor; rely on CSP instead
  res.setHeader('X-XSS-Protection', '0');

  // Limit referrer information sent to third parties
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}
