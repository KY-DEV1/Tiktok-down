'use client';

import { useCallback, useEffect, useState } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const notify = useCallback((title: string, body: string, icon = '/icons/icon-96.png') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon, badge: '/icons/icon-72.png' });
    } catch {
      // silently fail (e.g. blocked by browser)
    }
  }, []);

  return { permission, requestPermission, notify };
}
