'use client';

import { useEffect } from 'react';

export default function UIProtection() {
  useEffect(() => {
    // ── 1. Disable right-click context menu ──────────────────────────────────
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ── 2. Disable common keyboard shortcuts ─────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // F12 — DevTools
      if (e.key === 'F12') { e.preventDefault(); return false; }

      // Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        const blocked = ['u', 's', 'a', 'p', 'j']; // view-source, save, select-all, print, devtools
        if (blocked.includes(key)) { e.preventDefault(); return false; }

        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C — DevTools
        if (e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) {
          e.preventDefault();
          return false;
        }
      }

      // Alt+F4 on Windows — allow (it's OS level, just don't block)
    };

    // ── 3. Disable text selection on non-input elements ───────────────────────
    const onSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (['input', 'textarea'].includes(tag)) return true;
      e.preventDefault();
      return false;
    };

    // ── 4. Disable drag ───────────────────────────────────────────────────────
    const onDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ── 5. DevTools size detection ────────────────────────────────────────────
    let devtoolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          // Blur/hide sensitive content
          document.body.style.filter = 'blur(8px)';
          document.body.style.pointerEvents = 'none';
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false;
          document.body.style.filter = '';
          document.body.style.pointerEvents = '';
        }
      }
    };

    // ── 6. Console warning ────────────────────────────────────────────────────
    const printWarning = () => {
      console.clear();
      console.log(
        '%c⛔ STOP!',
        'color: red; font-size: 48px; font-weight: bold;'
      );
      console.log(
        '%cIni adalah fitur browser untuk developer. Jika seseorang menyuruh kamu paste sesuatu di sini, itu adalah penipuan.',
        'color: #fe2c55; font-size: 16px;'
      );
    };

    // ── 7. Anti iframe embedding ──────────────────────────────────────────────
    if (window.top !== window.self) {
      window.top!.location.href = window.self.location.href;
    }

    // Register all listeners
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('dragstart', onDragStart);

    const devtoolsInterval = setInterval(checkDevTools, 1000);
    printWarning();

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('dragstart', onDragStart);
      clearInterval(devtoolsInterval);
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  return null; // No visible UI
}
