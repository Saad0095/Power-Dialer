import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotificationContext } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { getRoleHomeRoute } from "../../utils/roleUtils";
import NotificationPopup from "./NotificationPopup";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, popupQueue, dismissPopup } =
    useNotificationContext();
  const { user } = useAuth();
  const basePath = getRoleHomeRoute(user?.role);
  const isManagerLike = ["admin", "manager", "team-lead"].includes(user?.role);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resolveRoute = (notification) => {
    const { type, metadata } = notification || {};
    const leadId = metadata?.leadId;
    const taskId = metadata?.taskId;

    if (leadId) {
      if (isManagerLike) return `${basePath}/caller-leads?leadId=${leadId}`;
      if (user?.role === "client") return `${basePath}/leads`;
      return `${basePath}/followups?leadId=${leadId}`;
    }

    if (taskId) {
      return `${basePath}/tasks?taskId=${taskId}`;
    }

    if (type === "campaign_event") {
      return isManagerLike ? `${basePath}/campaigns` : `${basePath}/auto-dialer`;
    }

    if (
      type === "follow_up" ||
      type === "appointment" ||
      type === "qa_required" ||
      type === "qa_feedback" ||
      type === "lead_status"
    ) {
      if (isManagerLike) return `${basePath}/caller-leads`;
      if (user?.role === "client") return `${basePath}/leads`;
      return `${basePath}/followups`;
    }

    return `${basePath}/notifications`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);
    navigate(resolveRoute(notification));
  };

  const currentPopup = popupQueue[0] ?? null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setIsOpen((prev) => {
              if (!prev) setBellRinging(true);
              return !prev;
            });
          }}
          className="relative cursor-pointer rounded-lg p-2 text-slate-700 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/50"
          aria-label="Notifications"
        >
          <Bell
            className={`h-5 w-5 fill-yellow-500 text-yellow-500 transition-transform ${bellRinging ? "animate-bell-ring" : ""}`}
            onAnimationEnd={() => setBellRinging(false)}
          />
          {unreadCount > 0 && (
            <span
              className="
                absolute top-0 right-0
                flex min-w-[18px] -translate-y-1/3 translate-x-1/3 items-center justify-center
                rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-medium text-white
                dark:border-slate-900
                [animation:badgePop_0.35s_cubic-bezier(.34,1.56,.64,1)_forwards,badgePulse_2s_0.4s_ease-in-out_infinite]
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
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
                    className={`cursor-pointer border-b border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/30 ${
                      !notification.isRead ? "bg-blue-50/50 dark:bg-blue-500/5" : ""
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <h4
                        className={`text-sm ${
                          !notification.isRead
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {notification.message}
                    </p>

                    {notification.metadata?.isTask &&
                    notification.metadata?.taskStatus !== "completed" ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        Action required
                      </span>
                    ) : null}

                    <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
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
              className="block w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-slate-50 dark:border-slate-700/50 dark:text-blue-400 dark:hover:bg-slate-700/30"
            >
              View all notifications
            </Link>
          </div>
        )}
      </div>

      <NotificationPopup popup={currentPopup} onDismiss={dismissPopup} />
    </>
  );
}
