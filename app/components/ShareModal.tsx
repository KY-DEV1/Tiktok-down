'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type DownloadResult } from './types';

interface Props {
  visible: boolean;
  result: DownloadResult | null;
  sourceUrl: string;
  onClose: () => void;
}

export default function ShareModal({ visible, result, sourceUrl, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = sourceUrl ? `${appUrl}?url=${encodeURIComponent(sourceUrl)}` : appUrl;

  useEffect(() => {
    if (!visible) { setCopied(null); setQrVisible(false); }
  }, [visible]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const shareNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: result?.title || 'TikTok Down',
        text: 'Download video TikTok tanpa watermark',
        url: shareLink,
      });
    } catch {}
  };

  const platforms = [
    {
      key: 'wa',
      label: 'WhatsApp',
      icon: '💬',
      color: 'bg-[#25d366]',
      url: `https://wa.me/?text=${encodeURIComponent(`Download video TikTok tanpa watermark: ${shareLink}`)}`,
    },
    {
      key: 'tg',
      label: 'Telegram',
      icon: '✈',
      color: 'bg-[#2ca5e0]',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('Download TikTok tanpa watermark!')}`,
    },
    {
      key: 'tw',
      label: 'Twitter/X',
      icon: '✕',
      color: 'bg-[#1da1f2]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Download video TikTok tanpa watermark!')}&url=${encodeURIComponent(shareLink)}`,
    },
  ];

  // Simple QR code via Google Charts API (free, no tracking)
  const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(shareLink)}&choe=UTF-8`;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
          >
            <div className="bg-[#151a24] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="font-semibold text-white">Bagikan</h3>
                <button onClick={onClose} className="text-white/40 hover:text-white transition text-lg">✕</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Video info */}
                {result?.title && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-3 border border-white/10">
                    {result.thumbnail && (
                      <img src={result.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <p className="text-xs text-white/60 line-clamp-2 flex-1">{result.title}</p>
                  </div>
                )}

                {/* Share link */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2">Link Download</p>
                  <div className="flex gap-2">
                    <input
                      readOnly value={shareLink}
                      className="flex-1 px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-white/60 text-xs font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={() => copy(shareLink, 'link')}
                      className="px-3 py-2 rounded-lg gradient-cyan text-[#080a0f] text-xs font-bold flex-shrink-0 transition hover:opacity-90"
                    >
                      {copied === 'link' ? '✓' : '⊕'}
                    </button>
                  </div>
                </div>

                {/* Copy direct URL */}
                {result?.url && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2">URL File Langsung</p>
                    <div className="flex gap-2">
                      <input
                        readOnly value={result.url}
                        className="flex-1 px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-white/60 text-xs font-mono truncate focus:outline-none"
                      />
                      <button
                        onClick={() => copy(result.url!, 'direct')}
                        className="px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-white/50 text-xs font-bold flex-shrink-0 hover:text-white transition"
                      >
                        {copied === 'direct' ? '✓' : '⊕'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Share platforms */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2">Bagikan ke</p>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((p) => (
                      <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer"
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${p.color} text-white transition hover:opacity-90 active:scale-95`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-[11px] font-semibold">{p.label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* QR Code */}
                <div>
                  <button
                    onClick={() => setQrVisible(p => !p)}
                    className="w-full py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/50 text-sm font-medium hover:text-white transition"
                  >
                    {qrVisible ? '▲ Sembunyikan QR Code' : '▼ Tampilkan QR Code'}
                  </button>
                  <AnimatePresence>
                    {qrVisible && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center gap-2 pt-4">
                          <div className="p-3 bg-white rounded-xl">
                            <img src={qrUrl} alt="QR Code" className="w-40 h-40" />
                          </div>
                          <p className="text-xs text-white/30">Scan untuk buka di perangkat lain</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Native share (mobile) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={shareNative}
                    className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-bold glow-red transition hover:opacity-90"
                  >
                    ↗ Share via Aplikasi
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
