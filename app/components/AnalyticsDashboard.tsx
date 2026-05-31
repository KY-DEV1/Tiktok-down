'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stagger, fadeUp, type Analytics } from './types';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [prev, setPrev] = useState<Analytics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(d => {
          setPrev(d);
          return json.data;
        });
        setLastUpdated(new Date());
        // Pulse indicator when data changes
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const total = data?.totalDownloads || 0;
  const videoPercent = total ? Math.round(((data?.videoCount || 0) / total) * 100) : 0;
  const audioPercent = total ? Math.round(((data?.audioCount || 0) / total) * 100) : 0;
  const imagePercent = total ? Math.round(((data?.imageCount || 0) / total) * 100) : 0;

  // Check if a value increased from prev
  const isNew = (key: keyof Analytics) =>
    prev && data && (data[key] as number) > (prev[key] as number);

  const stats = [
    { label: 'Total', value: data?.totalDownloads || 0, icon: '⬇', color: 'text-white', key: 'totalDownloads' as keyof Analytics },
    { label: 'Hari Ini', value: data?.todayCount || 0, icon: '☀', color: 'text-cyan', key: 'todayCount' as keyof Analytics },
    { label: '7 Hari', value: data?.weekCount || 0, icon: '📅', color: 'text-cyan', key: 'weekCount' as keyof Analytics },
    { label: 'Video', value: data?.videoCount || 0, icon: '▶', color: 'text-[#fe2c55]', key: 'videoCount' as keyof Analytics },
    { label: 'Audio', value: data?.audioCount || 0, icon: '♪', color: 'text-purple-400', key: 'audioCount' as keyof Analytics },
    { label: 'Gambar', value: data?.imageCount || 0, icon: '⊞', color: 'text-yellow-400', key: 'imageCount' as keyof Analytics },
  ];

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <motion.div
      variants={stagger} initial="hidden" animate="show"
      className="p-5 rounded-xl bg-surface-2 border border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Analytics</p>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-green-400 ${pulse ? 'scale-150' : ''} transition-transform duration-300`} 
              style={{ boxShadow: '0 0 6px #4ade80' }} 
            />
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Live</span>
          </div>
        </div>
        <span className="text-[10px] text-white/20 font-mono">
          Update: {timeStr}
        </span>
      </div>

      {/* Stat grid */}
      <motion.div variants={stagger} className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            className={`p-3 rounded-xl border text-center transition-all duration-300 ${
              isNew(s.key)
                ? 'bg-surface-3 border-cyan/30 shadow-[0_0_12px_rgba(37,244,238,0.15)]'
                : 'bg-surface-3 border-white/10'
            }`}
          >
            <div className={`text-xl mb-1 ${s.color}`}>{s.icon}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={s.value}
                initial={{ opacity: 0, y: -6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
                className="text-lg font-black text-white"
              >
                {s.value.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Breakdown bars */}
      {total > 0 ? (
        <motion.div variants={fadeUp} className="space-y-2.5">
          <p className="text-[11px] text-white/30 font-semibold uppercase tracking-widest mb-3">Breakdown format</p>
          {[
            { label: 'Video', pct: videoPercent, color: 'bg-[#fe2c55]', count: data?.videoCount || 0 },
            { label: 'Audio', pct: audioPercent, color: 'bg-purple-400', count: data?.audioCount || 0 },
            { label: 'Gambar', pct: imagePercent, color: 'bg-yellow-400', count: data?.imageCount || 0 },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-12 flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${b.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${b.pct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-xs text-white/40 w-20 text-right flex-shrink-0">
                {b.pct}% ({b.count})
              </span>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-6 text-white/20 text-sm">
          Belum ada data. Mulai download untuk melihat statistik.
        </div>
      )}
    </motion.div>
  );
}
