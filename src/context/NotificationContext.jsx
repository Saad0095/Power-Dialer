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
  markAsRead: async () => { },
  markAllAsRead: async () => { },
  fetchRecent: async () => { },
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

    // const handleNewNotification = (notification) => {
    //   setNotifications((prev) => [notification, ...prev].slice(0, 5));
    //   setUnreadCount((prev) => prev + 1);

    //   try {
    //     const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    //     const playTone = (freq, startTime, duration) => {
    //       const oscillator = audioCtx.createOscillator();
    //       const gainNode = audioCtx.createGain();

    //       oscillator.type = 'sine';
    //       oscillator.frequency.setValueAtTime(freq, startTime);

    //       gainNode.gain.setValueAtTime(0, startTime);
    //       gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
    //       gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    //       oscillator.connect(gainNode);
    //       gainNode.connect(audioCtx.destination);

    //       oscillator.start(startTime);
    //       oscillator.stop(startTime + duration);
    //     };

    //     const now = audioCtx.currentTime;
    //     // Ring 1
    //     playTone(880, now, 0.15);      // A5
    //     playTone(1108.73, now, 0.15);  // C#6

    //     // Ring 2 (slightly longer and brighter)
    //     playTone(880, now + 0.2, 0.4);
    //     playTone(1108.73, now + 0.2, 0.4);
    //     playTone(1318.51, now + 0.2, 0.4); // E6
    //   } catch (err) {
    //     console.error("Could not play notification sound", err);
    //   }
    // };

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev + 1);

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
        // C5, E5, G5, C6 with long sustain on the last note
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
