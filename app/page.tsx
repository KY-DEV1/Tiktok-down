'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWRMutation from 'swr/mutation';

import {
  stagger, fadeUp, slugify, fileExt,

  type MediaType, type DownloadResult, type HistoryItem,
  type BatchItem, type Analytics, type Theme,
} from './components/types';
import Header from './components/Header';
import PWABanner from './components/PWABanner';
import MediaTypeSelector from './components/MediaTypeSelector';
import UrlInput from './components/UrlInput';
import VideoResult from './components/VideoResult';
import ImageResult from './components/ImageResult';
import BatchDownloader from './components/BatchDownloader';
import HistorySidebar from './components/HistorySidebar';
import { PlatformGuide, FeatureCards } from './components/PlatformGuide';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ShareModal from './components/ShareModal';
import DownloadQueue from './components/DownloadQueue';
import { ResultSkeleton } from './components/Skeleton';
import { useKeyboardShortcuts } from './lib/useKeyboardShortcuts';
import { useNotifications } from './lib/useNotifications';

// ── SWR fetcher ──────────────────────────────────────────────────────────────
async function fetchDownload(_key: string, { arg }: { arg: { url: string; mediaType: MediaType } }) {
  const res = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Gagal mengambil data');
  return data.data as DownloadResult;
}

export default function Home() {
  // Core
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [sourceUrl, setSourceUrl] = useState('');

  // Download
  const [isDownloading, setIsDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlError, setDlError] = useState('');

  // Clipboard
  const [clipboardPasted, setClipboardPasted] = useState(false);

  // History & Analytics
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);

  // Theme
  const [theme, setTheme] = useState<Theme>('dark');

  // PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [platform, setPlatform] = useState('');

  // Batch
  const [batchUrls, setBatchUrls] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Share
  const [showShare, setShowShare] = useState(false);

  // Queue
  const [showQueue, setShowQueue] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // SWR
  const { trigger, isMutating, error: swrError } = useSWRMutation('/api/download', fetchDownload);

  // Notifications
  const { permission: notifPermission, requestPermission, notify } = useNotifications();

  // Analytics — fire-and-forget POST to server
  const trackDownloadServer = async (type: string, title?: string) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title }),
      });
    } catch {}
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setPlatform('Android');
    else if (/iphone|ipad|ipod/i.test(ua)) setPlatform('iOS');
    else setPlatform('Desktop');

    const savedHistory = localStorage.getItem('dl-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsPWA(true); setShowInstall(false); });
    if (window.matchMedia('(display-mode: standalone)').matches) setIsPWA(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (history.length) localStorage.setItem('dl-history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // Auto paste
  const handleAutoPaste = useCallback(async () => {
    if (url.trim() || clipboardPasted) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text && /tiktok\.com|vt\.tiktok|vm\.tiktok/.test(text)) {
        setUrl(text.trim()); setClipboardPasted(true);
      }
    } catch {}
  }, [url, clipboardPasted]);

  useEffect(() => {
    handleAutoPaste();
    window.addEventListener('focus', handleAutoPaste);
    return () => window.removeEventListener('focus', handleAutoPaste);
  }, [handleAutoPaste]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!url.trim()) return;
    setResult(null); setDlError(''); setDlProgress(0);
    try {
      const data = await trigger({ url: url.trim(), mediaType });
      setResult(data);
      setSourceUrl(url.trim());
      trackDownloadServer(data.type, data.title);

      setHistory(prev => [{
        id: Date.now().toString(),
        title: data.title || 'TikTok Media',
        thumbnail: data.thumbnail,
        type: data.type,
        timestamp: Date.now(),
        url: data.url || data.images?.[0] || '',
        sourceUrl: url.trim(),
        bookmarked: false,
      }, ...prev]);
    } catch {}
  }, [url, mediaType, trigger]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsPWA(true);
    setDeferredPrompt(null); setShowInstall(false);
  };

  const proxyUrl = (raw: string) => `/api/proxy?url=${encodeURIComponent(raw)}`;

  const downloadFile = async (fileUrl: string, filename: string) => {
    if (!fileUrl?.startsWith('http')) { setDlError('URL tidak valid'); return; }
    setDlError(''); setIsDownloading(true); setDlProgress(0);
    try {
      const res = await fetch(proxyUrl(fileUrl));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const total = parseInt(res.headers.get('content-length') || '0');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream not supported');
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); loaded += value.length;
        if (total) setDlProgress(Math.round((loaded / total) * 100));
      }
      const blob = new Blob(chunks);
      if (!blob.size) throw new Error('File kosong');
      const burl = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: burl, download: filename, style: 'display:none' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(burl), 1000);
      setDlProgress(100);
      // Browser notification on completion
      notify('✓ Download selesai!', filename);
    } catch (err: any) {
      setDlError('Gagal mengunduh: ' + err.message);
      window.open(fileUrl, '_blank');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDlProgress(0), 1500);
    }
  };

  const downloadAllImages = async (images: string[], title?: string) => {
    setIsDownloading(true); setDlError('');
    for (let i = 0; i < images.length; i++) {
      setDlProgress(Math.round((i / images.length) * 100));
      try {
        const r = await fetch(proxyUrl(images[i]));
        const blob = await r.blob();
        const burl = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: burl, download: `${slugify(title)}_${i + 1}.jpg`, style: 'display:none' });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(burl), 1000);
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }
    setDlProgress(100); setIsDownloading(false);
    setTimeout(() => setDlProgress(0), 1500);
    notify('✓ Semua gambar selesai!', `${images.length} gambar dari "${title || 'TikTok'}"`);
  };

  const handleBatch = async () => {
    const lines = batchUrls.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (!lines.length) return;
    const items: BatchItem[] = lines.map((u, i) => ({ id: `${i}-${Date.now()}`, url: u, status: 'pending' }));
    setBatchItems(items); setIsBatchRunning(true);

    // Request notification permission before batch starts
    if (notifPermission === 'default') await requestPermission();

    for (let i = 0; i < items.length; i++) {
      setBatchItems(p => p.map(it => it.id === items[i].id ? { ...it, status: 'processing' } : it));
      try {
        const res = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: items[i].url, mediaType }) });
        const d = await res.json();
        if (d.success) {
          trackDownloadServer(d.data.type, d.data.title);
          setBatchItems(p => p.map(it => it.id === items[i].id ? { ...it, status: 'done', title: d.data.title, thumbnail: d.data.thumbnail, downloadUrl: d.data.url || d.data.images?.[0], type: d.data.type } : it));
        } else throw new Error(d.error);
      } catch (e: any) {
        setBatchItems(p => p.map(it => it.id === items[i].id ? { ...it, status: 'error', error: e.message } : it));
      }
      await new Promise(r => setTimeout(r, 600));
    }
    setIsBatchRunning(false);
    notify('✓ Batch selesai!', `${items.length} URL telah diproses.`);
  };

  const handleAddToQueue = (dlUrl: string, type: string, title?: string) => {
    (window as any).__queueAdd?.(dlUrl, type, title);
    setShowQueue(true);
    setQueueCount(c => c + 1);
  };

  const handleToggleBookmark = (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, bookmarked: !h.bookmarked } : h));
  };

  const handleExportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `tiktok-history-${Date.now()}.json`,
      style: 'display:none',
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePasteShortcut = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setUrl(text.trim()); setClipboardPasted(true); }
    } catch {}
  }, []);

  const handleClose = useCallback(() => { setResult(null); setDlError(''); setDlProgress(0); }, []);
  const handleClear = () => { setUrl(''); setClipboardPasted(false); };
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  const toggleHistory = useCallback(() => setShowHistory(p => !p), []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useKeyboardShortcuts({
    onSubmit: handleSubmit,
    onClose: handleClose,
    onPaste: handlePasteShortcut,
    onToggleHistory: toggleHistory,
    onToggleTheme: toggleTheme,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080a0f]' : 'bg-[#f4f6fb]'} text-white relative overflow-x-hidden`}>
      {/* Ambient blobs */}
      <div className="fixed -top-[30vh] -left-[20vw] w-[70vw] h-[70vh] bg-[radial-gradient(circle,rgba(254,44,85,0.08)_0%,transparent_65%)] pointer-events-none z-0" />
      <div className="fixed -bottom-[20vh] -right-[15vw] w-[60vw] h-[60vh] bg-[radial-gradient(circle,rgba(37,244,238,0.07)_0%,transparent_65%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 pb-20">

        <PWABanner visible={showInstall && !isPWA} onInstall={handleInstall} onDismiss={() => setShowInstall(false)} />

        <Header
          platform={platform}
          historyCount={history.length}
          showHistory={showHistory}
          isPWA={isPWA}
          hasDeferredPrompt={!!deferredPrompt}
          theme={theme}
          queueCount={queueCount}
          showAnalytics={showAnalytics}
          notifPermission={notifPermission}
          onToggleHistory={toggleHistory}
          onToggleAnalytics={() => setShowAnalytics(p => !p)}
          onToggleQueue={() => setShowQueue(p => !p)}
          onToggleTheme={toggleTheme}
          onInstall={handleInstall}
          onRequestNotif={requestPermission}
        />

        {/* Keyboard shortcut hint — only desktop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="hidden md:flex items-center gap-3 mb-4 -mt-8 flex-wrap"
        >
          {[
            ['⌘ Enter', 'Fetch'],
            ['⌘ V', 'Paste URL'],
            ['⌘ H', 'Riwayat'],
            ['⌘ D', 'Tema'],
            ['Esc', 'Tutup'],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-white/20">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-white/10 font-mono text-white/30">{key}</kbd>
              {label}
            </span>
          ))}
        </motion.div>

        {/* Analytics dashboard (collapsible) */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid gap-6 transition-all duration-300 ${showHistory ? 'lg:grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>

          {/* Main column */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">

            <motion.p variants={fadeUp} className="text-white/40 text-sm -mt-4">
              Video · Audio · Gambar — Tanpa watermark, selamanya gratis
            </motion.p>

            {/* Tab bar */}
            <motion.div variants={fadeUp} className="flex gap-1 p-1.5 rounded-xl bg-surface border border-white/10">
              {(['single', 'batch'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  {activeTab === tab && (
                    <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-surface-2 border border-white/10"
                      style={{ zIndex: -1 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  {tab === 'single' ? '▶ Single URL' : '⊞ Batch Download'}
                </button>
              ))}
            </motion.div>

            <MediaTypeSelector value={mediaType} onChange={setMediaType} />

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'single' ? (
                <motion.div key="single" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-5">
                  <UrlInput
                    url={url} mediaType={mediaType} isLoading={isMutating} error={swrError}
                    clipboardPasted={clipboardPasted} onChange={setUrl} onSubmit={handleSubmit}
                    onFocus={handleAutoPaste} onClear={handleClear}
                    onPasteClipboard={async () => { try { const t = await navigator.clipboard.readText(); if (t) { setUrl(t.trim()); setClipboardPasted(true); } } catch {} }}
                  />

                  <AnimatePresence>
                    {isMutating && <ResultSkeleton />}
                  </AnimatePresence>

                  <AnimatePresence>
                    {result && result.type !== 'image' && (
                      <VideoResult
                        result={result} isDownloading={isDownloading} dlProgress={dlProgress} dlError={dlError}
                        onDownload={downloadFile} onClose={handleClose}
                        onShare={() => setShowShare(true)}
                        onAddToQueue={handleAddToQueue}
                      />
                    )}
                    {result?.type === 'image' && result.images && (
                      <ImageResult
                        result={result} isDownloading={isDownloading} dlProgress={dlProgress} dlError={dlError}
                        onDownloadOne={downloadFile} onDownloadAll={downloadAllImages} onClose={handleClose}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <BatchDownloader
                  batchUrls={batchUrls} batchItems={batchItems} isBatchRunning={isBatchRunning} mediaType={mediaType}
                  onChange={setBatchUrls} onStart={handleBatch}
                  onReset={() => { setBatchItems([]); setBatchUrls(''); }}
                />
              )}
            </AnimatePresence>

            <PlatformGuide />
            <FeatureCards />
          </motion.div>

          {/* History sidebar */}
          <HistorySidebar
            visible={showHistory}
            history={history}
            onClear={() => setHistory([])}
            onToggleBookmark={handleToggleBookmark}
            onExport={handleExportHistory}
          />
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-center text-xs text-white/20 mt-12"
        >
          © 2025 TikTok Downloader · Built with Next.js by Ki
        </motion.footer>
      </div>

      {/* Modals */}
      <ShareModal visible={showShare} result={result} sourceUrl={sourceUrl} onClose={() => setShowShare(false)} />
      <DownloadQueue visible={showQueue} onClose={() => setShowQueue(false)} />
    </div>
  );
}
