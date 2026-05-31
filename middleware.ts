import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, strictRateLimit } from './app/lib/rateLimit';
import { getRealIP, isSuspiciousRequest, isAllowedOrigin } from './app/lib/security';

export const config = {
  matcher: ['/api/:path*'],
};

// CSP header value
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // needed for Next.js
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.tiktokcdn.com https://*.tiktok.com https://www.tikwm.com",
  "media-src 'self' blob: https://*.tiktokcdn.com https://*.tiktok.com https://www.tikwm.com",
  "connect-src 'self' blob: https://*.tiktok.com https://www.tikwm.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export async function middleware(req: NextRequest) {
  const ip = getRealIP(req);
  const path = req.nextUrl.pathname;

  // ── Security headers for all responses ──────────────────────────────────────
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': CSP,
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };

  // ── API route protection ─────────────────────────────────────────────────────
  if (path.startsWith('/api/')) {

    // 1. Bot / suspicious request detection
    if (isSuspiciousRequest(req)) {
      const strict = strictRateLimit(`suspicious:${ip}`);
      if (!strict.allowed) {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak.' },
          { status: 403, headers: securityHeaders }
        );
      }
    }

    // 2. Origin / CORS check
    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak.' },
        { status: 403, headers: securityHeaders }
      );
    }

    // 3. Rate limiting — 20 requests/minute, block 10 minutes if exceeded
    const limit = rateLimit(ip, { limit: 20, windowMs: 60_000, blockDurationMs: 10 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: limit.blocked ? `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(limit.resetIn / 60)} menit.` : 'Rate limit tercapai.' },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': String(limit.resetIn),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(limit.resetIn),
          },
        }
      );
    }

    // Pass with rate limit headers
    const res = NextResponse.next();
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    return res;
  }

  // ── Non-API: just add security headers ──────────────────────────────────────
  const res = NextResponse.next();
  Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
