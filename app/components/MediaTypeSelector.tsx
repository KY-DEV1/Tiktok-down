'use client';

import { motion } from 'framer-motion';
import { fadeUp, type MediaType } from './types';

interface MediaOption {
  id: MediaType;
  label: string;
  icon: string;
  desc: string;
}

const OPTIONS: MediaOption[] = [
  { id: 'video', label: 'Video', icon: '▶', desc: 'HD tanpa watermark' },
  { id: 'audio', label: 'Audio', icon: '♪', desc: 'Ekstrak ke MP3' },
  { id: 'image', label: 'Gambar', icon: '⊞', desc: 'Slideshow images' },
];

interface MediaTypeSelectorProps {
  value: MediaType;
  onChange: (type: MediaType) => void;
}

export default function MediaTypeSelector({ value, onChange }: MediaTypeSelectorProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="p-5 rounded-xl bg-surface-2 border border-white/10"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-4">
        Pilih Format
      </p>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((m) => (
          <motion.button
            key={m.id}
            onClick={() => onChange(m.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative p-4 rounded-xl border text-center transition-colors ${
              value === m.id
                ? 'border-[rgba(37,244,238,0.35)] bg-[rgba(37,244,238,0.06)]'
                : 'border-white/10 bg-surface-3 hover:border-white/20'
            }`}
          >
            {value === m.id && (
              <motion.div
                layoutId="media-active"
                className="absolute inset-0 rounded-xl border border-cyan/40 bg-cyan/5"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <div
              className={`text-2xl mb-2 font-mono font-bold ${
                value === m.id ? 'text-cyan' : 'text-white/40'
              }`}
            >
              {m.icon}
            </div>
            <p className={`text-sm font-semibold ${value === m.id ? 'text-white' : 'text-white/60'}`}>
              {m.label}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">{m.desc}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
