'use client';

import { motion } from 'framer-motion';
import { fadeUp } from './types';

const GUIDES = [
  { icon: '💻', name: 'Desktop', tip: 'File langsung tersimpan ke folder Downloads' },
  { icon: '🤖', name: 'Android', tip: 'Cek folder "Download" atau "Unduhan"' },
  { icon: '🍎', name: 'iOS', tip: 'Tekan "Buka Tab Baru", tahan video, pilih "Simpan"' },
  { icon: '📲', name: 'PWA', tip: 'Install app untuk akses lebih cepat' },
];

const FEATURES = [
  { icon: '⚡', title: 'Super Cepat', desc: 'Proses dalam detik' },
  { icon: '✦', title: 'HD Quality', desc: 'Tanpa watermark' },
  { icon: '◈', title: 'Multi Format', desc: 'Video, audio, gambar' },
  { icon: '◎', title: 'Gratis', desc: 'Selamanya gratis' },
];

export function PlatformGuide() {
  return (
    <motion.div variants={fadeUp} className="p-5 rounded-xl bg-surface-2 border border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">
        Panduan per platform
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GUIDES.map((g) => (
          <div
            key={g.name}
            className="flex gap-2.5 items-start p-3 rounded-xl bg-surface-3 border border-white/10"
          >
            <span className="text-xl flex-shrink-0">{g.icon}</span>
            <div>
              <p className="text-xs font-semibold text-white mb-1">{g.name}</p>
              <p className="text-[11px] text-white/35 leading-relaxed">{g.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  return (
    <motion.div variants={fadeUp} className="p-5 rounded-xl bg-surface-2 border border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4 text-center">
        Kenapa pilih kami
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            whileHover={{ y: -3 }}
            className="p-4 rounded-xl bg-surface-3 border border-white/10 text-center cursor-default transition"
          >
            <div className="text-2xl text-cyan mb-2 font-mono">{f.icon}</div>
            <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
            <p className="text-[11px] text-white/35">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
