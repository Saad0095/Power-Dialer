import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotificationContext } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { getRoleHomeRoute } from "../../utils/roleUtils";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [bellRinging, setBellRinging] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotificationContext();
  const { user } = useAuth();
  const basePath = getRoleHomeRoute(user?.role);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);

    // Simple navigation mapping based on type
    if (
      notification.type === "campaign_event" &&
      (user?.role === "admin" || user?.role === "manager")
    ) {
      navigate(`${basePath}/campaigns`);
    } else if (
      notification.type === "campaign_event" &&
      (user?.role !== "admin" || user?.role !== "manager")
    ) {
      navigate(`${basePath}/auto-dialer`);
    } else if (
      (notification.type === "follow_up" ||
        notification.type === "appointment") &&
      (user?.role === "admin" || user?.role === "manager")
    ) {
      navigate(`${basePath}/caller-leads`);
    } else if (
      notification.type === "follow_up" ||
      notification.type === "appointment"
    ) {
      navigate(`${basePath}/followups`);
    } else {
      navigate(`${basePath}/notifications`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition text-slate-700 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border-2 border-white dark:border-slate-900 rounded-full transform translate-x-1/4 -translate-y-1/4">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button> */}
      {/* Bell button — rings on open */}
      <button
        onClick={() => {
          setIsOpen((prev) => {
            if (!prev) setBellRinging(true);
            return !prev;
          });
        }}
        className="relative p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition text-slate-700 dark:text-slate-300 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell
          className={`w-5 h-5 transition-transform  text-yellow-500 fill-yellow-500 ${bellRinging ? "animate-bell-ring" : ""}`}
          onAnimationEnd={() => setBellRinging(false)}
        />
        {unreadCount > 0 && (
          <span
            className="
      absolute top-0 right-0
      flex items-center justify-center
      min-w-[18px] h-[18px] px-1
      text-[10px] font-medium text-white
      bg-red-500 rounded-full
      border-2 border-white dark:border-slate-900
      translate-x-1/3 -translate-y-1/3
      [animation:badgePop_0.35s_cubic-bezier(.34,1.56,.64,1)_forwards,badgePulse_2s_0.4s_ease-in-out_infinite]
    "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No recent notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${
                    !notification.isRead
                      ? "bg-blue-50/50 dark:bg-blue-500/5"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()}{" "}
                    {new Date(notification.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>

          <Link
            to={`${basePath}/notifications`}
            onClick={() => setIsOpen(false)}
            className="block w-full text-center px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition border-t border-slate-100 dark:border-slate-700/50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
