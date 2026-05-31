'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { slideDown } from './types';

interface PWABannerProps {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PWABanner({ visible, onInstall, onDismiss }: PWABannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={slideDown}
          initial="hidden"
          animate="show"
          exit="exit"
          className="flex items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-white/10 flex-wrap"
          style={{
            background: 'linear-gradient(135deg,rgba(37,244,238,0.06),rgba(254,44,85,0.04))',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center text-lg glow-red flex-shrink-0">
              ↓
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Install TikTok Down</p>
              <p className="text-xs text-white/40 mt-0.5">
                Akses lebih cepat — install sebagai aplikasi
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onInstall}
              className="px-4 py-2 rounded-lg gradient-cyan text-[#080a0f] text-sm font-bold transition hover:opacity-90 active:scale-95"
            >
              Install
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 rounded-lg bg-surface-3 border border-white/10 text-white/40 text-sm transition hover:text-white"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
