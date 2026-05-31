'use client';

import { motion } from 'framer-motion';
import { fadeUp, slugify, fileExt, type BatchItem, type MediaType } from './types';

interface BatchDownloaderProps {
  batchUrls: string;
  batchItems: BatchItem[];
  isBatchRunning: boolean;
  mediaType: MediaType;
  onChange: (v: string) => void;
  onStart: () => void;
  onReset: () => void;
}

export default function BatchDownloader({
  batchUrls,
  batchItems,
  isBatchRunning,
  onChange,
  onStart,
  onReset,
}: BatchDownloaderProps) {
  const urlCount = batchUrls.split('\n').filter((l) => l.trim().startsWith('http')).length;
  const batchDone = batchItems.filter((i) => i.status === 'done').length;
  const batchErr = batchItems.filter((i) => i.status === 'error').length;
  const batchTotal = batchItems.length;

  const downloadItem = (item: BatchItem) => {
    if (!item.downloadUrl) return;
    const a = Object.assign(document.createElement('a'), {
      href: item.downloadUrl,
      download: `${slugify(item.title)}.${fileExt(item.type || 'video')}`,
      target: '_blank',
      style: 'display:none',
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const statusColor: Record<BatchItem['status'], string> = {
    pending: 'text-white/30',
    processing: 'text-white/50',
    done: 'text-cyan',
    error: 'text-[#ff6b81]',
  };

  const statusLabel: Record<BatchItem['status'], string> = {
    pending: '⏳ Menunggu',
    processing: '⬇ Memproses…',
    done: '✓ Siap',
    error: '',
  };

  return (
    <motion.div
      key="batch"
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0 }}
      className="p-5 rounded-xl bg-surface-2 border border-white/10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
        Batch Downloader — satu URL per baris
      </p>

      <textarea
        value={batchUrls}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          'https://vt.tiktok.com/abc\nhttps://vm.tiktok.com/xyz\nhttps://www.tiktok.com/@user/video/123'
        }
        className="w-full h-36 px-4 py-3 rounded-xl bg-surface-3 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/25 resize-y font-mono"
      />

      {/* Controls */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <motion.button
          onClick={onStart}
          disabled={isBatchRunning || !urlCount}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl gradient-accent text-white text-sm font-bold glow-red disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isBatchRunning ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Memproses…
            </>
          ) : (
            `⊞ Mulai Batch (${urlCount} URL)`
          )}
        </motion.button>

        {batchItems.length > 0 && (
          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/40 text-sm transition hover:text-white"
          >
            ✕ Reset
          </button>
        )}

        {batchTotal > 0 && (
          <span className="text-xs text-white/40">
            ✓ {batchDone}/{batchTotal} selesai{batchErr > 0 && ` · ✕ ${batchErr} gagal`}
          </span>
        )}
      </div>

      {/* Progress + item list */}
      {batchTotal > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          {/* Overall progress */}
          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full gradient-cyan progress-glow rounded-full"
              animate={{ width: `${Math.round(((batchDone + batchErr) / batchTotal) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Item rows */}
          <div className="flex flex-col gap-2">
            {batchItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                className={`flex items-center gap-3 rounded-xl p-3 border transition ${
                  item.status === 'done'
                    ? 'border-cyan/20 bg-[rgba(37,244,238,0.03)]'
                    : item.status === 'error'
                    ? 'border-[rgba(254,44,85,0.2)] bg-[rgba(254,44,85,0.03)]'
                    : 'border-white/10 bg-surface-3'
                }`}
              >
                {item.thumbnail && item.status === 'done' && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{item.title || item.url}</p>
                  <p className={`text-[11px] mt-0.5 ${statusColor[item.status]}`}>
                    {item.status === 'error'
                      ? `✕ ${item.error || 'Gagal'}`
                      : statusLabel[item.status]}
                  </p>
                </div>

                {item.status === 'done' && item.downloadUrl && (
                  <button
                    onClick={() => downloadItem(item)}
                    className="px-3 py-1.5 rounded-lg gradient-cyan text-[#080a0f] text-xs font-bold flex-shrink-0 transition hover:opacity-90"
                  >
                    ↓
                  </button>
                )}
                {item.status === 'processing' && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
