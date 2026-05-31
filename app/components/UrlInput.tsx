'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideDown, type MediaType } from './types';

interface UrlInputProps {
  url: string;
  mediaType: MediaType;
  isLoading: boolean;
  error?: Error | null;
  clipboardPasted: boolean;
  onChange: (url: string) => void;
  onSubmit: () => void;
  onFocus: () => void;
  onClear: () => void;
  onPasteClipboard: () => void;
}

const mediaLabel: Record<MediaType, string> = {
  video: 'Video',
  audio: 'Audio',
  image: 'Gambar',
};

export default function UrlInput({
  url,
  mediaType,
  isLoading,
  error,
  clipboardPasted,
  onChange,
  onSubmit,
  onFocus,
  onClear,
  onPasteClipboard,
}: UrlInputProps) {
  return (
    <motion.div variants={fadeUp} className="p-5 rounded-xl bg-surface-2 border border-white/10">
      {/* Input row */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="Tempel URL TikTok — vt.tiktok.com, vm.tiktok.com …"
            className="w-full px-4 py-3 pr-10 rounded-xl bg-surface-3 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition"
          />
          {url && (
            <button
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition text-base"
            >
              ✕
            </button>
          )}
        </div>

        <motion.button
          onClick={onSubmit}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-3 rounded-xl gradient-accent text-white text-sm font-bold glow-red disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Memproses…
            </>
          ) : (
            `↓ ${mediaLabel[mediaType]}`
          )}
        </motion.button>
      </div>

      {/* Clipboard hint */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={onPasteClipboard}
          className="px-3 py-1.5 rounded-lg bg-surface-3 border border-white/10 text-white/50 text-xs font-semibold transition hover:text-white hover:border-white/20"
        >
          ⊕ Paste Clipboard
        </button>
        <span className="text-xs text-white/30">
          {clipboardPasted && url
            ? '✓ URL terdeteksi dari clipboard'
            : 'Auto-paste saat halaman difokus'}
        </span>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            variants={slideDown}
            initial="hidden"
            animate="show"
            exit="exit"
            className="mt-3 flex items-center gap-2 text-sm text-[#ff6b81] bg-[rgba(254,44,85,0.06)] border border-[rgba(254,44,85,0.2)] rounded-lg px-4 py-3"
          >
            ! {error.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
