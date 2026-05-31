'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onSubmit: () => void;
  onClose: () => void;
  onPaste: () => void;
  onToggleHistory: () => void;
  onToggleTheme: () => void;
}

/**
 * Global keyboard shortcuts:
 *  Cmd/Ctrl + Enter  → submit / fetch
 *  Cmd/Ctrl + V      → paste URL from clipboard (when input is empty)
 *  Escape            → close result / modal
 *  Cmd/Ctrl + H      → toggle history sidebar
 *  Cmd/Ctrl + D      → toggle dark/light mode
 */
export function useKeyboardShortcuts({
  onSubmit,
  onClose,
  onPaste,
  onToggleHistory,
  onToggleTheme,
}: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea';

      // Escape → close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Cmd/Ctrl + Enter → submit
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
        return;
      }

      // Cmd/Ctrl + V (when NOT in an input) → paste from clipboard
      if (mod && e.key === 'v' && !inInput) {
        e.preventDefault();
        onPaste();
        return;
      }

      // Cmd/Ctrl + H → toggle history
      if (mod && e.key === 'h') {
        e.preventDefault();
        onToggleHistory();
        return;
      }

      // Cmd/Ctrl + D → toggle theme
      if (mod && e.key === 'd') {
        e.preventDefault();
        onToggleTheme();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSubmit, onClose, onPaste, onToggleHistory, onToggleTheme]);
}
