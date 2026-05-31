import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/app/lib/rateLimit';
import { getRealIP } from '@/app/lib/security';

export const runtime = 'nodejs';

// Block private/internal IPs to prevent SSRF
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    // Must be HTTPS
    if (u.protocol !== 'https:') return false;
    const h = u.hostname;
    // Block private IPs and localhost
    if (BLOCKED_HOSTNAMES.includes(h)) return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(h)) return false;
    // Must have a real TLD
    if (!h.includes('.')) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const ip = getRealIP(req);
  const limit = rateLimit(`proxy:${ip}`, { limit: 60, windowMs: 60_000, blockDurationMs: 5 * 60_000 });
  if (!limit.allowed) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  const target = req.nextUrl.searchParams.get('url');
  if (!target) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // Decode in case it was double-encoded
  const decoded = decodeURIComponent(target);

  if (!isSafeUrl(decoded)) {
    return new NextResponse('URL tidak diizinkan', { status: 400 });
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,video/mp4,video/*,audio/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    };
    if (contentLength) headers['Content-Length'] = contentLength;

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err: any) {
    console.error('[Proxy Error]', err?.message);
    return new NextResponse('Proxy error: ' + err.message, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
