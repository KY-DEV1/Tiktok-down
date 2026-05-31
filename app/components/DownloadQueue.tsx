'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, formatBytes, fileExt, slugify, type QueueItem } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DownloadQueue({ visible, onClose }: Props) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const activeRef = useRef<Set<string>>(new Set());

  const addToQueue = useCallback((url: string, type: string, title?: string) => {
    const item: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename: `${slugify(title)}_${Date.now()}.${fileExt(type)}`,
      url,
      status: 'waiting',
      progress: 0,
      type,
    };
    setItems(prev => [...prev, item]);
  }, []);

  // Expose addToQueue globally so page.tsx can call it
  useEffect(() => {
    (window as any).__queueAdd = addToQueue;
    return () => { delete (window as any).__queueAdd; };
  }, [addToQueue]);

  const startDownload = useCallback(async (id: string) => {
    if (activeRef.current.has(id)) return;
    activeRef.current.add(id);

    setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'downloading' } : it));

    const item = items.find(i => i.id === id);
    if (!item) { activeRef.current.delete(id); return; }

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    try {
      const proxied = `/api/proxy?url=${encodeURIComponent(item.url)}`;
      const res = await fetch(proxied);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const total = parseInt(res.headers.get('content-length') || '0');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const speed = timeDiff > 0.5 ? (loaded - lastLoaded) / timeDiff : 0;
        const eta = speed > 0 && total > 0 ? Math.round((total - loaded) / speed) : 0;

        if (timeDiff > 0.2) { lastLoaded = loaded; lastTime = now; }

        const progress = total ? Math.round((loaded / total) * 100) : 0;
        setItems(prev => prev.map(it => it.id === id ? { ...it, progress, size: total, loaded, speed, eta } : it));
      }

      const blob = new Blob(chunks);
      const burl = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: burl, download: item.filename, style: 'display:none' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(burl), 1000);

      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'done', progress: 100 } : it));
    } catch (err: any) {
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'error', error: err.message } : it));
    } finally {
      activeRef.current.delete(id);
    }
  }, [items]);

  // Auto-start waiting items (max 2 concurrent)
  useEffect(() => {
    const waiting = items.filter(i => i.status === 'waiting');
    const downloading = items.filter(i => i.status === 'downloading');
    if (downloading.length < 2 && waiting.length > 0) {
      startDownload(waiting[0].id);
    }
  }, [items, startDownload]);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearDone = () => setItems(prev => prev.filter(i => i.status !== 'done' && i.status !== 'error'));
  const retryItem = (id: string) => setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'waiting', progress: 0, error: undefined } : it));

  const statusIcon: Record<QueueItem['status'], string> = {
    waiting: '⏳', downloading: '⬇', done: '✓', error: '✕', paused: '⏸',
  };
  const statusColor: Record<QueueItem['status'], string> = {
    waiting: 'text-white/30', downloading: 'text-cyan', done: 'text-emerald-400', error: 'text-[#ff6b81]', paused: 'text-yellow-400',
  };

  const totalDone = items.filter(i => i.status === 'done').length;
  const totalErr = items.filter(i => i.status === 'error').length;
  const totalActive = items.filter(i => i.status === 'downloading').length;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl"
            style={{ background: '#0e1117' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-white">Download Queue</h3>
                <p className="text-xs text-white/30 mt-0.5">
                  {totalActive > 0 ? `${totalActive} sedang diunduh · ` : ''}{totalDone}/{items.length} selesai
                  {totalErr > 0 && ` · ${totalErr} gagal`}
                </p>
              </div>
              <div className="flex gap-2">
                {(totalDone > 0 || totalErr > 0) && (
                  <button onClick={clearDone} className="text-xs text-white/40 hover:text-white transition px-2 py-1 rounded-lg bg-surface-3 border border-white/10">
                    Bersihkan
                  </button>
                )}
                <button onClick={onClose} className="text-white/40 hover:text-white transition text-lg">✕</button>
              </div>
            </div>

            {/* Overall progress */}
            {items.length > 0 && (
              <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
                <div className="flex justify-between text-[11px] text-white/30 mb-1.5">
                  <span>Total progress</span>
                  <span>{Math.round((totalDone / items.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-cyan progress-glow rounded-full"
                    animate={{ width: `${Math.round((totalDone / items.length) * 100)}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}

            {/* Item list */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20 p-8 text-center">
                  <div className="text-4xl">⬇</div>
                  <p className="text-sm">Queue kosong.</p>
                  <p className="text-xs">Klik "Tambah ke Queue" di hasil download untuk menambahkan file.</p>
                </div>
              ) : (
                <motion.div className="divide-y divide-white/5">
                  {items.map((item) => (
                    <motion.div key={item.id} layout variants={fadeUp} initial="hidden" animate="show"
                      className="px-5 py-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`text-base mt-0.5 flex-shrink-0 ${statusColor[item.status]}`}>
                          {statusIcon[item.status]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{item.filename}</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
                            {item.status === 'downloading' && (
                              <>
                                <span className="text-cyan">{item.progress}%</span>
                                {item.size ? <span>{formatBytes(item.loaded || 0)} / {formatBytes(item.size)}</span> : null}
                                {item.speed ? <span>{formatBytes(item.speed)}/s</span> : null}
                                {item.eta ? <span>~{item.eta}s</span> : null}
                              </>
                            )}
                            {item.status === 'done' && <span className="text-emerald-400">Selesai ✓</span>}
                            {item.status === 'error' && <span className="text-[#ff6b81]">{item.error || 'Gagal'}</span>}
                            {item.status === 'waiting' && <span>Menunggu…</span>}
                          </div>

                          {/* Progress bar */}
                          {(item.status === 'downloading') && (
                            <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden mt-2">
                              <motion.div
                                className="h-full gradient-cyan rounded-full"
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5 flex-shrink-0">
                          {item.status === 'error' && (
                            <button onClick={() => retryItem(item.id)}
                              className="px-2 py-1 rounded-lg bg-surface-3 border border-white/10 text-white/40 text-[11px] hover:text-white transition"
                            >↺</button>
                          )}
                          {(item.status === 'done' || item.status === 'error' || item.status === 'waiting') && (
                            <button onClick={() => removeItem(item.id)}
                              className="px-2 py-1 rounded-lg bg-surface-3 border border-white/10 text-white/30 text-[11px] hover:text-[#ff6b81] transition"
                            >✕</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
