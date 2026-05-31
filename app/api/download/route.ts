import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {
  isValidTikTokUrl,
  isRequestTooLarge,
  sanitizeUrl,
  getRealIP,
  BLOCKED_RESPONSE,
  FORBIDDEN_RESPONSE,
  INVALID_URL_RESPONSE,
} from '@/app/lib/security';
import { rateLimit } from '@/app/lib/rateLimit';

export const runtime = 'nodejs';

// ── Typed return shape ─────────────────────────────────────────────────────────
interface MediaResult {
  downloadUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  images: string[];
  title: string;
  duration?: number;
  author?: string;
  likes?: number;
  views?: number;
  commentCount?: number;
  shareCount?: number;
}

// ── Media fetcher ──────────────────────────────────────────────────────────────
async function getTikTokMedia(url: string): Promise<MediaResult> {
  const apis = [
    {
      name: 'tikwm',
      url: 'https://www.tikwm.com/api/',
      method: 'POST' as const,
      data: { url },
      parser: (data: any): MediaResult | null => {
        if (!data.data) return null;
        const d = data.data;
        const fix = (u: string) => u?.startsWith('http') ? u : `https://www.tikwm.com${u}`;
        const downloadUrl = d.play ? fix(d.play) : '';
        const audioUrl = d.music ? fix(d.music) : '';
        const thumbnailUrl = d.cover ? fix(d.cover) : '';
        const images: string[] = Array.isArray(d.images) ? d.images.map(fix) : [];
        if (!downloadUrl && !images.length) return null;
        return {
          downloadUrl, audioUrl, thumbnailUrl, images,
          title: d.title || 'TikTok Video',
          duration: d.duration,
          author: d.author?.unique_id || d.author?.nickname || undefined,
          likes: d.digg_count || d.statistics?.digg_count || undefined,
          views: d.play_count || d.statistics?.play_count || undefined,
          commentCount: d.comment_count || d.statistics?.comment_count || undefined,
          shareCount: d.share_count || d.statistics?.share_count || undefined,
        };
      },
    },
    {
      name: 'tikodl',
      url: `https://api.tikodl.com/video/?url=${encodeURIComponent(url)}`,
      method: 'GET' as const,
      parser: (data: any): MediaResult | null => {
        const downloadUrl = data.video?.noWatermark || '';
        const images: string[] = Array.isArray(data.images) ? data.images : [];
        if (!downloadUrl && !images.length) return null;
        return {
          downloadUrl, audioUrl: '', thumbnailUrl: data.thumbnail || '', images,
          title: data.title || 'TikTok Video',
          duration: data.duration,
        };
      },
    },
  ];

  for (const api of apis) {
    try {
      const config: any = {
        method: api.method,
        url: api.url,
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, */*' },
      };
      if (api.method === 'POST' && 'data' in api) {
        config.data = new URLSearchParams(api.data as Record<string, string>);
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      const response = await axios(config);
      const result = api.parser(response.data);
      if (result) return result;
    } catch {
      continue;
    }
  }
  throw new Error('Semua API gagal mengambil data TikTok');
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getRealIP(req);

  try {
    if (isRequestTooLarge(req, 2048)) {
      return NextResponse.json(FORBIDDEN_RESPONSE, { status: 413 });
    }

    const limit = rateLimit(`dl:${ip}`, { limit: 15, windowMs: 60_000, blockDurationMs: 15 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: `Terlalu banyak request. Tunggu ${Math.ceil(limit.resetIn / 60)} menit.` },
        { status: 429, headers: { 'Retry-After': String(limit.resetIn) } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Body tidak valid.' }, { status: 400 });
    }

    const { url: rawUrl, mediaType = 'video' } = body;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'URL diperlukan.' }, { status: 400 });
    }

    const url = sanitizeUrl(rawUrl);

    if (!isValidTikTokUrl(url)) {
      return NextResponse.json(INVALID_URL_RESPONSE, { status: 400 });
    }

    const allowedTypes = ['video', 'audio', 'image'];
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json({ success: false, error: 'Format tidak valid.' }, { status: 400 });
    }

    const result = await getTikTokMedia(url);

    const meta = {
      thumbnail: result.thumbnailUrl,
      title: result.title,
      duration: result.duration,
      author: result.author,
      likes: result.likes,
      views: result.views,
      commentCount: result.commentCount,
      shareCount: result.shareCount,
    };

    let finalResult;
    if (mediaType === 'video') {
      if (!result.downloadUrl) return NextResponse.json({ success: false, error: 'Video tidak ditemukan.' }, { status: 404 });
      finalResult = { type: 'video', url: result.downloadUrl, ...meta };
    } else if (mediaType === 'audio') {
      if (!result.audioUrl) return NextResponse.json({ success: false, error: 'Audio tidak tersedia.' }, { status: 404 });
      finalResult = { type: 'audio', url: result.audioUrl, ...meta };
    } else {
      if (!result.images?.length) return NextResponse.json({ success: false, error: 'Tidak ada gambar.' }, { status: 404 });
      finalResult = { type: 'image', images: result.images, ...meta };
    }

    return NextResponse.json({ success: true, data: finalResult }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    });

  } catch (error: any) {
    console.error('[API Error]', error?.message);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan. Coba lagi.' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json(FORBIDDEN_RESPONSE, { status: 405 }); }
export async function PUT() { return NextResponse.json(FORBIDDEN_RESPONSE, { status: 405 }); }
export async function DELETE() { return NextResponse.json(FORBIDDEN_RESPONSE, { status: 405 }); }
