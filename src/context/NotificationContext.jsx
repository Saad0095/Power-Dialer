import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import useWebSocket from '../hooks/useWebSocket';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  fetchRecent: async () => {},
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

  useEffect(() => {
    if (!user || !websocketService) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev + 1);

      // Play ring notification sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (freq, startTime, duration) => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, startTime);
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };

        const now = audioCtx.currentTime;
        // Ring 1
        playTone(880, now, 0.15);      // A5
        playTone(1108.73, now, 0.15);  // C#6
        
        // Ring 2 (slightly longer and brighter)
        playTone(880, now + 0.2, 0.4);
        playTone(1108.73, now + 0.2, 0.4);
        playTone(1318.51, now + 0.2, 0.4); // E6
      } catch (err) {
        console.error("Could not play notification sound", err);
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
