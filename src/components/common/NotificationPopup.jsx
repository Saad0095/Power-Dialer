import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bell,
  AlertCircle,
  Calendar,
  UserCheck,
  Megaphone,
} from "lucide-react";
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

function resolveNotificationRoute(notification, basePath, isManagerLike, role) {
  const { type, metadata } = notification || {};
  const leadId = metadata?.leadId;
  const taskId = metadata?.taskId;

  if (leadId) {
    if (isManagerLike) return `${basePath}/caller-leads?leadId=${leadId}`;
    if (role === "client") return `${basePath}/leads`;
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
    if (role === "client") return `${basePath}/leads`;
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
    navigate(resolveNotificationRoute(popup, basePath, isManagerLike, user?.role));
  };

  const handleDismiss = (event) => {
    event.stopPropagation();
    onDismiss(popup._id);
  };

  if (!popup) return null;

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[99999] w-96 max-w-[calc(100vw-2rem)]"
      style={{
        animation:
          "slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <div
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={handleClick}
      >
        <div className={`bg-gradient-to-r ${config.color} flex items-start gap-3 p-4`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-0.5 inline-block text-[10px] font-bold uppercase tracking-widest text-white/80">
              {config.label}
            </span>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {popup.title}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/40"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="px-4 py-3">
          {popup.metadata?.isTask && popup.metadata?.taskStatus !== "completed" ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              Action required
            </span>
          ) : null}
          <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
            {popup.message}
          </p>
          <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
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
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
