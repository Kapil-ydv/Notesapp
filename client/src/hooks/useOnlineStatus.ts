import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const handleOnline = () => {
      updateOnlineStatus();
      // Sync when coming back online
      setTimeout(() => {
        syncManager.syncAll();
      }, 1000); // Small delay to ensure connection is stable
    };

    const handleOffline = () => {
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
