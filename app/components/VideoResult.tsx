'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn, slideDown, slugify, fileExt, formatDuration, type DownloadResult } from './types';
import ProgressBar from './ProgressBar';

interface VideoResultProps {
  result: DownloadResult;
  isDownloading: boolean;
  dlProgress: number;
  dlError: string;
  onDownload: (url: string, filename: string) => void;
  onClose: () => void;
  onShare: () => void;
  onAddToQueue: (url: string, type: string, title?: string) => void;
}

function formatNumber(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function VideoResult({
  result, isDownloading, dlProgress, dlError, onDownload, onClose, onShare, onAddToQueue,
}: VideoResultProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const px = (url?: string) => url ? `/api/proxy?url=${encodeURIComponent(url)}` : '';
  const isVideo = result.type === 'video';
  const filename = `${slugify(result.title)}.${fileExt(result.type)}`;

  const handleCopy = async () => {
    if (!result.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = result.url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const infoChips = [
    ['Format', isVideo ? 'MP4' : 'MP3'],
    ['Kualitas', 'Original'],
    ...(result.duration ? [['Durasi', formatDuration(result.duration)]] : []),
  ];

  // Metadata stats — hanya tampil kalau ada minimal 1 nilai
  const metaStats = [
    { icon: '♥', label: 'Likes', value: formatNumber(result.likes) },
    { icon: '▶', label: 'Views', value: formatNumber(result.views ?? result.playCount) },
    { icon: '↗', label: 'Share', value: formatNumber(result.shareCount) },
    { icon: '💬', label: 'Komentar', value: formatNumber(result.commentCount) },
  ].filter(s => s.value !== '—');

  const hasAuthor = !!result.author;
  const hasMeta = metaStats.length > 0 || hasAuthor;

  return (
    <motion.div key="result" variants={scaleIn} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95 }}
      className="p-5 rounded-xl bg-surface-2 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-mono font-bold flex-shrink-0 ${isVideo ? 'gradient-accent glow-red' : 'gradient-cyan'} text-[#080a0f]`}>
          {isVideo ? '▶' : '♪'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{isVideo ? 'Video' : 'Audio'} siap diunduh</h3>
          {result.title && <p className="text-xs text-white/40 truncate mt-0.5">"{result.title}"</p>}
        </div>
        <button onClick={onShare}
          className="px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-white/40 text-sm hover:text-white transition flex-shrink-0"
          title="Bagikan"
        >↗</button>
      </div>

      {/* Author chip */}
      {hasAuthor && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Pembuat</span>
          <span className="px-2.5 py-1 rounded-full bg-surface-3 border border-white/10 text-xs font-semibold text-cyan">
            @{result.author}
          </span>
        </div>
      )}

      {/* Info chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {infoChips.map(([k, v]) => (
          <div key={k} className="px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-center min-w-[72px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-1">{k}</p>
            <p className="text-xs font-semibold text-white">{v}</p>
          </div>
        ))}
      </div>

      {/* Metadata stats panel */}
      {hasMeta && metaStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-3 mb-5 flex-wrap"
        >
          {metaStats.map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/10">
              <span className="text-sm">{s.icon}</span>
              <div>
                <p className="text-xs font-bold text-white leading-none">{s.value}</p>
                <p className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Video preview */}
      {isVideo && result.url && (
        <div className="mb-5">
          {!showPreview ? (
            <motion.div onClick={() => setShowPreview(true)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="relative rounded-xl overflow-hidden cursor-pointer border border-white/10"
            >
              {result.thumbnail && (
                <img src={px(result.thumbnail)} alt="Thumbnail" className="w-full object-cover" style={{ maxHeight: 300 }} />
              )}
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-3">
                <motion.div whileHover={{ scale: 1.12 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-[#080a0f] text-2xl font-bold gradient-cyan glow-cyan"
                >▶</motion.div>
                <p className="text-white text-sm font-semibold">Klik untuk preview video</p>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl overflow-hidden border border-white/10 bg-black"
            >
              <video ref={videoRef} src={px(result.url)} controls autoPlay className="w-full" style={{ maxHeight: 360 }} poster={px(result.thumbnail)} />
              <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2 text-xs text-white/40">
                <span>Preview langsung dari server</span>
                <button onClick={() => setShowPreview(false)} className="hover:text-white transition">✕ Tutup</button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Audio player */}
      {!isVideo && result.url && (
        <div className="mb-5 p-6 rounded-xl bg-surface-3 border border-dashed border-white/15 text-center">
          <div className="text-4xl mb-3">♪</div>
          <p className="text-white/50 text-sm mb-4">Audio TikTok siap diunduh</p>
          <audio controls className="w-full max-w-sm mx-auto" src={px(result.url)} />
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {dlError && (
          <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit"
            className="mb-4 flex gap-2 text-sm text-[#ff6b81] bg-[rgba(254,44,85,0.06)] border border-[rgba(254,44,85,0.2)] rounded-lg px-4 py-3"
          >✕ {dlError}</motion.div>
        )}
      </AnimatePresence>

      <ProgressBar visible={isDownloading} progress={dlProgress} />

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <motion.button
          onClick={() => onDownload(result.url!, filename)}
          disabled={isDownloading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl gradient-cyan text-[#080a0f] text-sm font-bold disabled:opacity-60 transition"
        >{isDownloading ? `⬇ ${dlProgress}%` : `↓ Unduh ${isVideo ? 'Video' : 'Audio'}`}</motion.button>

        {/* Copy URL */}
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
            copied
              ? 'border-cyan/40 bg-cyan/10 text-cyan'
              : 'bg-surface-3 border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
          title="Copy link no-watermark"
        >{copied ? '✓ Tersalin!' : '⎘ Copy URL'}</motion.button>

        <motion.button
          onClick={() => onAddToQueue(result.url!, result.type, result.title)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/60 text-sm font-medium transition hover:text-white hover:border-white/20"
        >+ Queue</motion.button>

        <a href={result.url} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/60 text-sm font-medium transition hover:text-white hover:border-white/20"
        >↗ Tab Baru</a>

        <button onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/60 text-sm font-medium transition hover:text-white hover:border-white/20"
        >✕</button>
      </div>
    </motion.div>
  );
}
