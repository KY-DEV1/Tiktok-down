import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * TikTok Downloader - Public REST API v1
 *
 * Endpoint: POST /api/v1/media
 *
 * Request Body (JSON):
 * {
 *   "url": "https://www.tiktok.com/@user/video/123456",
 *   "type": "video" | "audio" | "image" | "all"   // default: "all"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "title": "...",
 *     "duration": 30,
 *     "thumbnail": "https://...",
 *     "video":  { "url": "https://..." },        // if type = video | all
 *     "audio":  { "url": "https://..." },        // if type = audio | all
 *     "images": { "urls": ["https://..."] }      // if type = image | all
 *   },
 *   "meta": {
 *     "api_version": "1.0",
 *     "source": "tiktok-downloader",
 *     "timestamp": "2025-10-01T00:00:00.000Z"
 *   }
 * }
 *
 * Error Response:
 * {
 *   "success": false,
 *   "error": { "code": "INVALID_URL", "message": "..." }
 * }
 */

// ─── Error Codes ──────────────────────────────────────────────────────────────

const ERROR_CODES = {
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  MISSING_URL:        'MISSING_URL',
  INVALID_URL:        'INVALID_URL',
  INVALID_TYPE:       'INVALID_TYPE',
  NOT_FOUND:          'NOT_FOUND',
  UPSTREAM_FAILED:    'UPSTREAM_FAILED',
  INTERNAL_ERROR:     'INTERNAL_ERROR',
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

function errorResponse(res: NextApiResponse, status: number, code: ErrorCode, message: string) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = 'video' | 'audio' | 'image' | 'all';

interface RawMedia {
  downloadUrl: string;
  audioUrl?: string;
  thumbnailUrl: string;
  images?: string[];
  title: string;
  duration?: number;
}

// ─── Upstream API Fetcher (reused from download.ts, centralised here) ─────────

async function fetchTikTokMedia(url: string): Promise<RawMedia> {
  const apis = [
    {
      name: 'tikwm',
      call: async () => {
        const res = await axios({
          method: 'POST',
          url: 'https://www.tikwm.com/api/',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          data: new URLSearchParams({ url }),
        });

        const d = res.data?.data;
        if (!d) return null;

        const abs = (u: string, base = 'https://www.tikwm.com') =>
          u?.startsWith('http') ? u : `${base}${u}`;

        return {
          downloadUrl:  abs(d.play  || ''),
          audioUrl:     d.music  ? abs(d.music)  : undefined,
          thumbnailUrl: abs(d.cover || ''),
          images: Array.isArray(d.images)
            ? d.images.map((i: string) => abs(i))
            : [],
          title:    d.title    || 'TikTok Video',
          duration: d.duration || undefined,
        } as RawMedia;
      },
    },
    {
      name: 'tikodl',
      call: async () => {
        const res = await axios({
          method: 'GET',
          url: `https://api.tikodl.com/video/?url=${encodeURIComponent(url)}`,
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        });

        const d = res.data;
        if (!d) return null;

        return {
          downloadUrl:  d.video?.noWatermark || '',
          thumbnailUrl: d.thumbnail || '',
          images: Array.isArray(d.images) ? d.images : [],
          title:    d.title    || 'TikTok Video',
          duration: d.duration || undefined,
        } as RawMedia;
      },
    },
  ];

  for (const api of apis) {
    try {
      const result = await api.call();
      if (result && (result.downloadUrl || result.audioUrl || (result.images?.length ?? 0) > 0)) {
        return result;
      }
    } catch (err: any) {
      console.warn(`[v1/media] API "${api.name}" failed:`, err.message);
    }
  }

  throw new Error('All upstream APIs failed');
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST
  if (req.method !== 'POST') {
    return errorResponse(res, 405, ERROR_CODES.METHOD_NOT_ALLOWED, 'Use POST request.');
  }

  const { url, type = 'all' } = req.body ?? {};

  // Validate url
  if (!url || typeof url !== 'string' || !url.trim()) {
    return errorResponse(res, 400, ERROR_CODES.MISSING_URL, '"url" field is required.');
  }

  const cleanUrl = url.trim();
  if (!/^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i.test(cleanUrl)) {
    return errorResponse(
      res, 400, ERROR_CODES.INVALID_URL,
      'URL must be a valid TikTok link (tiktok.com, vm.tiktok.com, vt.tiktok.com).'
    );
  }

  // Validate type
  const VALID_TYPES: MediaType[] = ['video', 'audio', 'image', 'all'];
  if (!VALID_TYPES.includes(type as MediaType)) {
    return errorResponse(
      res, 400, ERROR_CODES.INVALID_TYPE,
      `"type" must be one of: ${VALID_TYPES.join(', ')}.`
    );
  }

  const requestedType = type as MediaType;

  try {
    const raw = await fetchTikTokMedia(cleanUrl);

    // Build data object based on requested type
    const data: Record<string, any> = {
      title:     raw.title,
      duration:  raw.duration ?? null,
      thumbnail: raw.thumbnailUrl || null,
    };

    if (requestedType === 'video' || requestedType === 'all') {
      data.video = raw.downloadUrl ? { url: raw.downloadUrl } : null;
    }

    if (requestedType === 'audio' || requestedType === 'all') {
      data.audio = raw.audioUrl ? { url: raw.audioUrl } : null;
    }

    if (requestedType === 'image' || requestedType === 'all') {
      const imgs = raw.images ?? [];
      data.images = imgs.length > 0 ? { urls: imgs, count: imgs.length } : null;
    }

    // Check that the requested type actually has data
    if (requestedType !== 'all') {
      const hasData =
        (requestedType === 'video' && data.video) ||
        (requestedType === 'audio' && data.audio) ||
        (requestedType === 'image' && data.images);

      if (!hasData) {
        return errorResponse(
          res, 404, ERROR_CODES.NOT_FOUND,
          `No "${requestedType}" media found for the given TikTok URL.`
        );
      }
    }

    return res.status(200).json({
      success: true,
      data,
      meta: {
        api_version: '1.0',
        source:      'tiktok-downloader',
        timestamp:   new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[v1/media] Error:', err.message);

    if (err.message.includes('upstream') || err.message.includes('API')) {
      return errorResponse(res, 502, ERROR_CODES.UPSTREAM_FAILED, 'Failed to fetch media from TikTok.');
    }

    return errorResponse(res, 500, ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.');
  }
}
