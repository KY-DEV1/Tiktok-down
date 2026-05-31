'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ProgressBarProps {
  visible: boolean;
  progress: number;
  label?: string;
}

export default function ProgressBar({ visible, progress, label = 'Mengunduh…' }: ProgressBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div className="flex justify-between text-xs mb-2">
            <span className="text-cyan font-semibold">⬇ {label}</span>
            <span className="text-white/50 font-semibold">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-cyan progress-glow rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
