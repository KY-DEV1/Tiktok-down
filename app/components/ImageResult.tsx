'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn, stagger, fadeUp, slugify, type DownloadResult } from './types';
import ProgressBar from './ProgressBar';

interface ImageResultProps {
  result: DownloadResult;
  isDownloading: boolean;
  dlProgress: number;
  dlError: string;
  onDownloadOne: (url: string, filename: string) => void;
  onDownloadAll: (images: string[], title?: string) => void;
  onClose: () => void;
}

const px = (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`;

export default function ImageResult({
  result, isDownloading, dlProgress, dlError, onDownloadOne, onDownloadAll, onClose,
}: ImageResultProps) {
  const images = result.images ?? [];
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <motion.div
      key="images" variants={scaleIn} initial="hidden" animate="show"
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-5 rounded-xl bg-surface-2 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg gradient-cyan text-[#080a0f] flex items-center justify-center text-xl font-bold flex-shrink-0">
          ⊞
        </div>
        <div>
          <h3 className="font-semibold text-white">{images.length} Gambar Ditemukan</h3>
          <p className="text-xs text-white/40 mt-0.5">Tap gambar untuk preview · Unduh satu per satu atau semua sekaligus</p>
        </div>
      </div>

      {/* Author */}
      {result.author && (
        <div className="mb-4">
          <span className="px-2.5 py-1 rounded-full bg-surface-3 border border-white/10 text-xs font-semibold text-cyan">
            @{result.author}
          </span>
        </div>
      )}

      {/* Image grid */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="grid gap-3 mb-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
      >
        {images.map((img, i) => (
          <motion.div
            key={i} variants={fadeUp}
            className="rounded-xl bg-surface-3 border border-white/10 overflow-hidden flex flex-col"
          >
            {/* Thumbnail */}
            <div
              className="relative cursor-pointer bg-black/30 flex items-center justify-center overflow-hidden"
              style={{ aspectRatio: '9/16', maxHeight: 200 }}
              onClick={() => window.open(px(img), '_blank')}
            >
              {!failed[i] ? (
                <>
                  {!loaded[i] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cyan/40 border-t-cyan rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={px(img)}
                    alt={`Slide ${i + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loaded[i] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoaded(p => ({ ...p, [i]: true }))}
                    onError={() => setFailed(p => ({ ...p, [i]: true }))}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 p-4 text-white/30">
                  <span className="text-2xl">🖼</span>
                  <span className="text-[10px]">Slide {i + 1}</span>
                </div>
              )}

              {/* Badge */}
              <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {i + 1}/{images.length}
              </div>

              {/* Overlay hint */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded-lg">↗ Preview</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-2.5 flex flex-col gap-1.5">
              <button
                onClick={() => onDownloadOne(img, `${slugify(result.title)}_${i + 1}.jpg`)}
                className="w-full py-2 rounded-lg gradient-cyan text-[#080a0f] text-xs font-bold transition hover:opacity-90 active:scale-95"
              >
                ↓ Unduh {i + 1}
              </button>
              <button
                onClick={() => window.open(px(img), '_blank')}
                className="w-full py-1.5 rounded-lg bg-surface border border-white/10 text-white/40 text-[11px] transition hover:text-white hover:border-white/20"
              >
                ↗ Lihat
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {dlError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex gap-2 text-sm text-[#ff6b81] bg-[rgba(254,44,85,0.06)] border border-[rgba(254,44,85,0.2)] rounded-lg px-4 py-3 overflow-hidden"
          >
            ✕ {dlError}
          </motion.div>
        )}
      </AnimatePresence>

      <ProgressBar visible={isDownloading} progress={dlProgress} label="Mengunduh gambar…" />

      {/* Actions */}
      <div className="flex gap-3 flex-wrap items-center">
        <motion.button
          onClick={() => onDownloadAll(images, result.title)}
          disabled={isDownloading}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-xl gradient-cyan text-[#080a0f] text-sm font-bold disabled:opacity-60 transition"
        >
          {isDownloading ? `⬇ ${dlProgress}%` : `↓ Unduh Semua (${images.length})`}
        </motion.button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-surface-3 border border-white/10 text-white/60 text-sm transition hover:text-white"
        >
          ✕ Tutup
        </button>
      </div>

      {result.title && (
        <p className="mt-4 text-xs text-white/30 italic truncate">"{result.title}"</p>
      )}
    </motion.div>
  );
}
