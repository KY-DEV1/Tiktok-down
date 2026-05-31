import { NextRequest } from 'next/server';

// ── URL Validation ─────────────────────────────────────────────────────────────
const TIKTOK_PATTERNS = [
  /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/,
  /^https?:\/\/vt\.tiktok\.com\/[\w]+/,
  /^https?:\/\/vm\.tiktok\.com\/[\w]+/,
  /^https?:\/\/m\.tiktok\.com\/v\/[\w]+/,
  /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/,
];

export function isValidTikTokUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 500) return false;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return TIKTOK_PATTERNS.some((p) => p.test(url));
  } catch {
    return false;
  }
}

// ── Bot / Abuse Detection ──────────────────────────────────────────────────────
const SUSPICIOUS_UA_PATTERNS = [
  /python-requests/i,
  /curl\//i,
  /wget\//i,
  /httpie/i,
  /go-http-client/i,
  /java\//i,
  /node-fetch/i,
  /undici/i,
  /scrapy/i,
];

export function isSuspiciousRequest(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';

  // No user-agent at all
  if (!ua) return true;

  // Known bot/script user-agents
  if (SUSPICIOUS_UA_PATTERNS.some((p) => p.test(ua))) return true;

  // Missing accept header
  if (!accept) return true;

  return false;
}

// ── CSRF / Origin Check ────────────────────────────────────────────────────────
export function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host') || '';

  // Same-origin requests (no origin header) — always allow
  if (!origin && !referer) return true;

  // Same-host check: origin/referer matches the server's own host
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {}
  }

  if (referer) {
    try {
      const refHost = new URL(referer).host;
      if (refHost === host) return true;
    } catch {}
  }

  // Explicit allowlist from env (optional extra domains)
  const extras = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  if (origin && extras.some((a) => origin.startsWith(a))) return true;
  if (referer && extras.some((a) => referer.startsWith(a))) return true;

  return false;
}

// ── Request Size Guard ─────────────────────────────────────────────────────────
export function isRequestTooLarge(req: NextRequest, maxBytes = 2048): boolean {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBytes) return true;
  return false;
}

// ── Get Real IP ────────────────────────────────────────────────────────────────
export function getRealIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  );
}

// ── Sanitize input ─────────────────────────────────────────────────────────────
export function sanitizeUrl(url: string): string {
  return url.trim().replace(/[<>"']/g, '');
}

// ── Generic error responses ────────────────────────────────────────────────────
export const BLOCKED_RESPONSE = {
  success: false,
  error: 'Terlalu banyak permintaan. Coba lagi nanti.',
};

export const FORBIDDEN_RESPONSE = {
  success: false,
  error: 'Akses ditolak.',
};

export const INVALID_URL_RESPONSE = {
  success: false,
  error: 'URL tidak valid. Masukkan URL TikTok yang benar.',
};
