'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stagger, fadeUp, formatTimeAgo, type HistoryItem } from './types';

interface HistorySidebarProps {
  visible: boolean;
  history: HistoryItem[];
  onClear: () => void;
  onToggleBookmark: (id: string) => void;
  onExport: () => void;
}

export default function HistorySidebar({ visible, history, onClear, onToggleBookmark, onExport }: HistorySidebarProps) {
  const [filter, setFilter] = useState<'all' | 'bookmarked'>('all');

  const displayed = filter === 'bookmarked' ? history.filter(h => h.bookmarked) : history;
  const bookmarkCount = history.filter(h => h.bookmarked).length;

  const typeIcon: Record<string, string> = { video: '▶', audio: '♪', image: '⊞' };
  const typeColor: Record<string, string> = {
    video: 'text-[#fe2c55]',
    audio: 'text-purple-400',
    image: 'text-yellow-400',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-xl bg-surface-2 border border-white/10 self-start sticky top-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-semibold text-sm text-white">Riwayat Download</h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onExport}
                  className="text-xs text-white/40 hover:text-white transition font-semibold"
                  title="Export ke JSON"
                >↓ Export</button>
              )}
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className="text-xs text-[#ff6b81] hover:text-[#fe2c55] transition font-semibold"
                >Hapus</button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          {history.length > 0 && (
            <div className="flex border-b border-white/10">
              {(['all', 'bookmarked'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-2 text-xs font-semibold transition ${
                    filter === f
                      ? 'text-cyan border-b-2 border-cyan'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {f === 'all' ? `Semua (${history.length})` : `★ Favorit (${bookmarkCount})`}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {displayed.length === 0 ? (
              <div className="px-5 py-10 text-center text-white/30 text-sm leading-relaxed">
                {filter === 'bookmarked'
                  ? 'Belum ada favorit.\nTap ★ pada item untuk menyimpan.'
                  : 'Belum ada riwayat.\nDownload pertamamu muncul di sini.'}
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show">
                {displayed.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={fadeUp}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-surface-3 transition group"
                  >
                    {/* Thumbnail / icon */}
                    <div
                      onClick={() => window.open(item.url, '_blank')}
                      className="cursor-pointer flex-shrink-0"
                    >
                      {item.thumbnail && item.type !== 'audio' ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center text-white/40 text-sm">
                          ♪
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <p className="text-xs text-white font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                      <p className={`text-[10px] font-bold mt-0.5 uppercase ${typeColor[item.type] ?? 'text-cyan'}`}>
                        {typeIcon[item.type] ?? '▶'} {item.type}
                      </p>
                    </div>

                    {/* Bookmark button */}
                    <button
                      onClick={() => onToggleBookmark(item.id)}
                      className={`text-base flex-shrink-0 transition opacity-0 group-hover:opacity-100 ${
                        item.bookmarked ? 'opacity-100 text-yellow-400' : 'text-white/30 hover:text-yellow-400'
                      }`}
                      title={item.bookmarked ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                    >
                      {item.bookmarked ? '★' : '☆'}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
