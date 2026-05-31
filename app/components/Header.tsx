'use client';

import { motion } from 'framer-motion';
import { fadeUp, type Theme } from './types';

interface HeaderProps {
  platform: string;
  historyCount: number;
  showHistory: boolean;
  isPWA: boolean;
  hasDeferredPrompt: boolean;
  theme: Theme;
  queueCount: number;
  showAnalytics: boolean;
  notifPermission: NotificationPermission;
  onToggleHistory: () => void;
  onToggleAnalytics: () => void;
  onToggleQueue: () => void;
  onToggleTheme: () => void;
  onInstall: () => void;
  onRequestNotif: () => void;
}

const platformIcon: Record<string, string> = { Android: '🤖', iOS: '🍎', Desktop: '💻' };

export default function Header({
  platform, historyCount, showHistory, isPWA, hasDeferredPrompt,
  theme, queueCount, showAnalytics, notifPermission,
  onToggleHistory, onToggleAnalytics, onToggleQueue, onToggleTheme, onInstall, onRequestNotif,
}: HeaderProps) {
  const isDark = theme === 'dark';
  const notifGranted = notifPermission === 'granted';
  const notifDenied = notifPermission === 'denied';

  return (
    <motion.header variants={fadeUp} initial="hidden" animate="show"
      className="flex items-center justify-between mb-12 flex-wrap gap-4"
    >
      {/* Logo */}
      <div className="flex items-center gap-4">
        <motion.div
          className="w-11 h-11 rounded-lg gradient-accent flex items-center justify-center text-xl glow-red flex-shrink-0"
          whileHover={{ scale: 1.08, rotate: -4 }} transition={{ type: 'spring', stiffness: 300 }}
        >↓</motion.div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight">TikTok&nbsp;Down</h1>
          {platform && (
            <p className="text-xs font-semibold text-cyan mt-0.5">
              {platformIcon[platform] ?? '📱'} {platform}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* PWA Install */}
        {!isPWA && hasDeferredPrompt && (
          <motion.button onClick={onInstall} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg border border-[rgba(37,244,238,0.25)] bg-[rgba(37,244,238,0.06)] text-cyan text-sm font-semibold transition hover:bg-[rgba(37,244,238,0.12)]"
          >⊕ Install</motion.button>
        )}

        {/* Notification bell */}
        {!notifDenied && (
          <motion.button
            onClick={notifGranted ? undefined : onRequestNotif}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              notifGranted
                ? 'border-cyan/20 bg-cyan/5 text-cyan cursor-default'
                : 'border-white/10 bg-surface-2 text-white/50 hover:text-white'
            }`}
            title={notifGranted ? 'Notifikasi aktif' : 'Aktifkan notifikasi'}
          >
            {notifGranted ? '🔔' : '🔕'}
          </motion.button>
        )}

        {/* Analytics toggle */}
        <motion.button onClick={onToggleAnalytics} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
            showAnalytics
              ? 'border-cyan/30 bg-cyan/10 text-cyan'
              : 'border-white/10 bg-surface-2 text-white/50 hover:text-white'
          }`}
        >📊</motion.button>

        {/* Queue */}
        <motion.button onClick={onToggleQueue} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="relative px-3 py-2 rounded-lg bg-surface-2 border border-white/10 text-white/50 text-sm transition hover:text-white"
        >
          ⬇
          {queueCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full gradient-accent text-white text-[10px] font-bold flex items-center justify-center">
              {queueCount > 9 ? '9+' : queueCount}
            </span>
          )}
        </motion.button>

        {/* History */}
        <motion.button onClick={onToggleHistory} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-white/60 text-sm font-medium transition hover:text-white hover:border-white/20"
        >
          ≡ {showHistory ? 'Sembunyikan' : 'Riwayat'}
          {historyCount > 0 && <span className="text-cyan font-bold">{historyCount}</span>}
        </motion.button>

        {/* Theme toggle */}
        <motion.button onClick={onToggleTheme} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-white/10 text-white/50 text-sm transition hover:text-white"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? '◑' : '●'}
        </motion.button>
      </div>
    </motion.header>
  );
}
