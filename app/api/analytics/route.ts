import { NextRequest, NextResponse } from 'next/server';
import { getRealIP } from '@/app/lib/security';
import { rateLimit } from '@/app/lib/rateLimit';

export const runtime = 'nodejs';

interface DLRecord {
  type: 'video' | 'audio' | 'image';
  title?: string;
  timestamp: number;
}

interface AnalyticsStore {
  records: DLRecord[];
}

const store: AnalyticsStore = (global as any).__analyticsStore ?? { records: [] };
(global as any).__analyticsStore = store;

function calcStats(records: DLRecord[]) {
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayTs = startOfToday.getTime();
  const weekTs = now - 7 * 24 * 60 * 60 * 1000;

  let total = 0, video = 0, audio = 0, image = 0, today = 0, week = 0;
  for (const r of records) {
    total++;
    if (r.type === 'video') video++;
    else if (r.type === 'audio') audio++;
    else image++;
    if (r.timestamp >= todayTs) today++;
    if (r.timestamp >= weekTs) week++;
  }
  return { totalDownloads: total, videoCount: video, audioCount: audio, imageCount: image, todayCount: today, weekCount: week };
}

export async function GET(req: NextRequest) {
  const ip = getRealIP(req);
  const limit = rateLimit(`analytics:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ success: false, error: 'Rate limit.' }, { status: 429 });

  const stats = calcStats(store.records);
  const recent = store.records.slice(-10).reverse().map(r => ({ title: r.title, type: r.type, timestamp: r.timestamp }));

  return NextResponse.json({ success: true, data: { ...stats, recentTitles: recent } }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  const ip = getRealIP(req);
  const limit = rateLimit(`analytics-post:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) return NextResponse.json({ success: false, error: 'Rate limit.' }, { status: 429 });

  try {
    const { type, title } = await req.json();
    if (!['video', 'audio', 'image'].includes(type)) return NextResponse.json({ success: false }, { status: 400 });

    store.records.push({ type, title: title ? String(title).slice(0, 100) : undefined, timestamp: Date.now() });
    // Keep max 10000 records in memory
    if (store.records.length > 10000) store.records.splice(0, store.records.length - 10000);

    return NextResponse.json({ success: true, data: calcStats(store.records) });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
