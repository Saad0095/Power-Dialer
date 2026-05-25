import React from "react";
import { createPortal } from "react-dom";
import { X, Bell, AlertCircle, Calendar, UserCheck, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getRoleHomeRoute } from "../../utils/roleUtils";

const TYPE_CONFIG = {
  follow_up: {
    icon: Calendar,
    color: "from-blue-500 to-indigo-600",
    label: "Follow-up",
  },
  appointment: {
    icon: Calendar,
    color: "from-emerald-500 to-teal-600",
    label: "Appointment",
  },
  qa_required: {
    icon: UserCheck,
    color: "from-amber-500 to-orange-500",
    label: "Action Required",
  },
  qa_feedback: {
    icon: UserCheck,
    color: "from-purple-500 to-violet-600",
    label: "QA Feedback",
  },
  lead_status: {
    icon: AlertCircle,
    color: "from-rose-500 to-pink-600",
    label: "Lead Update",
  },
  campaign_event: {
    icon: Megaphone,
    color: "from-slate-500 to-slate-600",
    label: "Campaign",
  },
  system: {
    icon: Bell,
    color: "from-slate-500 to-slate-600",
    label: "System",
  },
};

/**
 * Resolve the target URL based on notification type + metadata.
 * ALL lead-related types attach ?leadId= so the target page can auto-open the modal.
 */
function resolveNotificationRoute(notification, basePath, isManagerLike) {
  const { type, metadata } = notification;
  const taskId = metadata?.taskId;
  const leadId = metadata?.leadId;

  if (taskId) {
    return `${basePath}/tasks?taskId=${taskId}`;
  }

  // Any notification that has a leadId → go to the leads management page with the lead pre-opened
  if (leadId) {
    if (isManagerLike) {
      return `${basePath}/caller-leads?leadId=${leadId}`;
    }
    // Agents use the followups page
    return `${basePath}/followups?leadId=${leadId}`;
  }

  // No leadId — fall back to section-level routing
  if (type === "campaign_event") {
    return isManagerLike ? `${basePath}/campaigns` : `${basePath}/auto-dialer`;
  }
  if (type === "follow_up" || type === "appointment" || type === "qa_required" || type === "qa_feedback" || type === "lead_status") {
    if (isManagerLike) return `${basePath}/caller-leads`;
    return `${basePath}/followups`;
  }

  return `${basePath}/notifications`;
}

export default function NotificationPopup({ popup, onDismiss }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = getRoleHomeRoute(user?.role);
  const isManagerLike = ["admin", "manager", "team-lead"].includes(user?.role);

  const config = TYPE_CONFIG[popup?.type] || TYPE_CONFIG.system;
  const Icon = config.icon;

  const handleClick = () => {
    onDismiss(popup._id);
    const route = resolveNotificationRoute(popup, basePath, isManagerLike);
    navigate(route);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    onDismiss(popup._id);
  };

  if (!popup) return null;

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[99999] w-96 max-w-[calc(100vw-2rem)]"
      style={{ animation: "slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group"
        onClick={handleClick}
      >
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${config.color} p-4 flex items-start gap-3`}>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-white/80 mb-0.5">
              {config.label}
            </span>
            <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
              {popup.title}
            </h3>
          </div>
          {/* Dismiss button — manually close only */}
          <button
            onClick={handleDismiss}
            className="shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {popup.metadata?.isTask && popup.metadata?.taskStatus !== "completed" ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              Action required
            </span>
          ) : null}
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
            {popup.message}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            {new Date(popup.createdAt || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Click to open
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(120px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
      `}</style>
    </div>,
    document.body,
  );
}
