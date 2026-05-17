import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import useWebSocket from '../hooks/useWebSocket';

let globalAudioCtx = null;
const initAudioContext = () => {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => { });
  }
  return globalAudioCtx;
};

// Ensure AudioContext is unlocked upon user interaction
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => { });
    }
  });
}

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  popupQueue: [],
  dismissPopup: () => {},
  markAsRead: async () => { },
  markAllAsRead: async () => { },
  fetchRecent: async () => { },
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // Queue of notifications to show as modal popups
  const [popupQueue, setPopupQueue] = useState([]);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getRecentNotifications(5);
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Hook into WebSocket
  const { websocketService } = useWebSocket();

  // Handle Tab Visibility & Reconnection to fetch missed notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecent();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    if (websocketService) {
      websocketService.on('connect', fetchRecent);
    }

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      if (websocketService) {
        websocketService.off('connect', fetchRecent);
      }
    };
  }, [fetchRecent, websocketService]);

  useEffect(() => {
    if (!user || !websocketService) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev + 1);

      // Push to popup queue so the modal popup is displayed
      setPopupQueue((prev) => [...prev, notification]);

      try {
        const audioCtx = initAudioContext();

        const playTone = (freq, startTime, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = audioCtx.currentTime;

        // A nice, longer, elegant ascending 4-note chime
        playTone(523.25, now, 0.4);        // C5
        playTone(659.25, now + 0.15, 0.4); // E5
        playTone(783.99, now + 0.3, 0.4);  // G5
        
        // Final chord with a much longer, ringing decay
        playTone(523.25, now + 0.45, 2.0); // C5 base
        playTone(1046.50, now + 0.45, 2.0); // C6 peak
        playTone(1318.51, now + 0.45, 2.0); // E6 peak
      } catch (err) {
        console.error('Could not play notification sound', err);
      }
    };

    websocketService.on('notification:new', handleNewNotification);

    return () => {
      websocketService.off('notification:new', handleNewNotification);
    };
  }, [user, websocketService]);

  const dismissPopup = useCallback((notificationId) => {
    setPopupQueue((prev) => prev.filter((n) => n._id !== notificationId));
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        popupQueue,
        dismissPopup,
        markAsRead,
        markAllAsRead,
        fetchRecent,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
