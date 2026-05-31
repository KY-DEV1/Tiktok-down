'use client';

import { motion } from 'framer-motion';

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`rounded-lg bg-white/5 ${className ?? ''}`}
      style={style}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function ResultSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-5 rounded-xl bg-surface-2 border border-white/10 space-y-4"
    >
      <div className="flex items-center gap-3">
        <Pulse className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-4 w-40" />
          <Pulse className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        {[72, 80, 88].map(w => <Pulse key={w} className="h-12 rounded-lg" style={{ width: w }} />)}
      </div>
      <Pulse className="w-full h-48 rounded-xl" />
      <div className="flex gap-3">
        <Pulse className="h-10 w-36 rounded-xl" />
        <Pulse className="h-10 w-28 rounded-xl" />
        <Pulse className="h-10 w-20 rounded-xl" />
      </div>
    </motion.div>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
      <Pulse className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Pulse className="h-3 w-3/4" />
        <Pulse className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}
