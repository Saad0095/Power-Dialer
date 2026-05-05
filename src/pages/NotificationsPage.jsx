import React, { useEffect, useState } from 'react';
import { getNotifications } from '../services/api';
import { useNotificationContext } from '../context/NotificationContext';
import { Bell, Check, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  const { markAsRead, markAllAsRead } = useNotificationContext();

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await getNotifications(pageNum, 20, unreadOnly);
      if (data.success) {
        if (pageNum === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Stay updated with your latest alerts and tasks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={unreadOnly} 
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
            />
            Unread only
          </label>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && page === 1 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No notifications found</h3>
            <p className="text-slate-500 dark:text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-5 flex gap-4 transition-colors ${
                  !notification.isRead 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="mt-1">
                  {!notification.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-base mb-1 ${!notification.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-500 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!notification.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="shrink-0 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {page < totalPages && (
        <div className="mt-6 text-center">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
