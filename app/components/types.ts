export type MediaType = 'video' | 'audio' | 'image';
export type Theme = 'dark' | 'light';
export type QualityOption = 'hd' | 'sd' | 'audio_only';

export interface DownloadResult {
  type: MediaType;
  url?: string;
  hdUrl?: string;
  sdUrl?: string;
  images?: string[];
  thumbnail?: string;
  title?: string;
  duration?: number;
  author?: string;
  likes?: number;
  views?: number;
  commentCount?: number;
  shareCount?: number;
  playCount?: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail?: string;
  type: string;
  timestamp: number;
  url: string;
  sourceUrl?: string;
  bookmarked?: boolean;
}

export interface BatchItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  title?: string;
  thumbnail?: string;
  downloadUrl?: string;
  type?: string;
  error?: string;
}

export interface QueueItem {
  id: string;
  filename: string;
  url: string;
  status: 'waiting' | 'downloading' | 'done' | 'error' | 'paused';
  progress: number;
  size?: number;
  loaded?: number;
  error?: string;
  type: string;
  speed?: number;      // bytes/sec
  eta?: number;        // seconds remaining
}

export interface Analytics {
  totalDownloads: number;
  videoCount: number;
  audioCount: number;
  imageCount: number;
  todayCount: number;
  weekCount: number;
  lastDownload?: number;
  streak?: number;
}

// ── Animation variants ────────────────────────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};
export const slideDown = {
  hidden: { opacity: 0, y: -12, height: 0 },
  show: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, height: 0, transition: { duration: 0.2 } },
};

// ── Utils ─────────────────────────────────────────────────────────────────────
export function formatTime(ts: number) { return new Date(ts).toLocaleString('id-ID'); }
export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}
export function slugify(s?: string) { return (s || 'tiktok').replace(/[^a-zA-Z0-9]/g, '_'); }
export function fileExt(type: string) { return type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4'; }
export function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
export function loadAnalytics(): Analytics {
  try {
    const raw = localStorage.getItem('tiktok-analytics');
    return raw ? JSON.parse(raw) : { totalDownloads: 0, videoCount: 0, audioCount: 0, imageCount: 0, todayCount: 0, weekCount: 0 };
  } catch { return { totalDownloads: 0, videoCount: 0, audioCount: 0, imageCount: 0, todayCount: 0, weekCount: 0 }; }
}

export function saveAnalytics(a: Analytics) {
  localStorage.setItem('tiktok-analytics', JSON.stringify(a));
}

export function trackDownload(type: MediaType) {
  const a = loadAnalytics();
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  a.totalDownloads++;
  if (type === 'video') a.videoCount++;
  else if (type === 'audio') a.audioCount++;
  else a.imageCount++;
  a.lastDownload = now;

  // Today/week counters: reset if stale by checking timestamps
  const history = JSON.parse(localStorage.getItem('dl-history') || '[]') as HistoryItem[];
  a.todayCount = history.filter(h => h.timestamp >= todayStart).length + 1;
  a.weekCount = history.filter(h => h.timestamp >= weekStart).length + 1;
  saveAnalytics(a);
}
