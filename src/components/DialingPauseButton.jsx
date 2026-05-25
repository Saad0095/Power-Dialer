import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { pauseDialing, resumeDialing, stopDialing } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { isManager as checkIsManager } from "../utils/roleUtils";

export default function DialingPauseButton({ user, onShowNotification }) {
  const pauseWarningSeconds = 5 * 60;
  const pauseLimitSeconds = 10 * 60;
  const { hydrateAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [pauseTimer, setPauseTimer] = useState(0);
  const warningShownRef = useRef(false);
  const limitHandledRef = useRef(false);

  const isDialing = user?.isAutoDialing;
  const onPause = user?.attendance?.onDialingPause;
  const totalPauseUsedSeconds = Math.floor((user?.attendance?.totalDialingPauseMs || 0) / 1000);
  const hasReachedPauseLimit = totalPauseUsedSeconds >= pauseLimitSeconds;

  const isManagerLike = checkIsManager(user?.role);
  const targetRoute = isManagerLike ? '/manager/auto-dialer' : '/agent/auto-dialer';

  // Cleanup ghost sessions: if backend thinks we are actively dialing (not paused), 
  // but we are NOT on the auto-dialer page (e.g. due to a hard page refresh), 
  // the local dialing loop is dead. We must hide the button and stop the backend session.
  useEffect(() => {
    if (isDialing && !onPause && location.pathname !== targetRoute) {
       if (user?.autoDialCampaignId) {
         stopDialing(user.autoDialCampaignId, user._id).then(() => {
             hydrateAuth();
         }).catch(() => {});
       }
    }
  }, [isDialing, onPause, location.pathname, user, targetRoute, hydrateAuth]);

  useEffect(() => {
    if (!onPause || !user?.attendance?.dialingPauseStartedAt) {
      setPauseTimer(0);
      return undefined;
    }

    const serverNow = user.attendance.serverTime ? new Date(user.attendance.serverTime).getTime() : Date.now();
    const clientNow = Date.now();
    const clockOffset = serverNow - clientNow;

    const pauseStart = new Date(user.attendance.dialingPauseStartedAt).getTime();
    const previousTotalPauseSeconds = Math.floor((user.attendance.totalDialingPauseMs || 0) / 1000);

    const tick = () => {
      const adjustedNow = Date.now() + clockOffset;
      const currentPauseElapsedSeconds = Math.floor((adjustedNow - pauseStart) / 1000);
      const totalElapsedSeconds = previousTotalPauseSeconds + currentPauseElapsedSeconds;
      setPauseTimer(totalElapsedSeconds);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [onPause, user?.attendance]);

  useEffect(() => {
    if (!onPause) {
      warningShownRef.current = false;
      limitHandledRef.current = false;
      return;
    }

    if (pauseTimer >= pauseWarningSeconds && !warningShownRef.current) {
      warningShownRef.current = true;
      onShowNotification?.("Pause warning: 5 minutes used. Please resume before the 10-minute limit.", "warning");
    }

    if (pauseTimer < pauseLimitSeconds || limitHandledRef.current) {
      return;
    }

    limitHandledRef.current = true;

    const autoResume = async () => {
      const targetCampaignId = user?.attendance?.dialingPauseCampaignId || user?.autoDialCampaignId;
      if (!targetCampaignId) {
        onShowNotification?.("Dialing pause limit reached. Please reopen your auto dialer.", "error");
        return;
      }

      try {
        setIsLoading(true);
        await resumeDialing(targetCampaignId, user._id, true);
        await hydrateAuth();
        onShowNotification?.("Pause limit reached. Dialing resumed automatically.", "warning");
        if (location.pathname !== targetRoute) {
          navigate(targetRoute);
        }
      } catch (err) {
        const message = err?.response?.data?.error || "Pause limit reached, but auto-resume failed";
        onShowNotification?.(message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    void autoResume();
  }, [
    hydrateAuth,
    location.pathname,
    navigate,
    onPause,
    onShowNotification,
    pauseLimitSeconds,
    pauseTimer,
    pauseWarningSeconds,
    targetRoute,
    user,
  ]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleTogglePause = async () => {
    try {
      setIsLoading(true);
      if (onPause) {
        const targetCampaignId = user?.attendance?.dialingPauseCampaignId || user?.autoDialCampaignId;
        if (!targetCampaignId) {
            onShowNotification?.("No campaign found to resume", "error");
            return;
        }
        await resumeDialing(targetCampaignId, user._id, true);
        onShowNotification?.("Dialing resumed", "success");
        if (location.pathname !== targetRoute) {
            navigate(targetRoute);
        }
      } else {
        if (hasReachedPauseLimit) {
          onShowNotification?.("Daily pause limit reached. You can pause for up to 10 minutes total.", "error");
          return;
        }
        if (!user?.autoDialCampaignId) {
             onShowNotification?.("No active campaign to pause", "error");
             return;
        }
        await pauseDialing(user.autoDialCampaignId, user._id, true);
        onShowNotification?.("Dialing paused", "success");
      }
      await hydrateAuth();
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to update dialing status";
      onShowNotification?.(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show if dialing or paused
  if (!isDialing && !onPause) return null;

  // Once the daily pause allowance is exhausted, hide the pause control.
  if (!onPause && hasReachedPauseLimit) return null;

  // Don't show if we are in a ghost session (actively dialing but not on the right page)
  if (isDialing && !onPause && location.pathname !== targetRoute) return null;

  const content = (
    <div className={`
      relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-500 transform
      ${onPause 
        ? "bg-slate-900/80 border-amber-500/30 shadow-amber-900/20" 
        : "bg-slate-900/80 border-emerald-500/30 shadow-emerald-900/20"}
      p-4 flex flex-col gap-3 min-w-[280px]
    `}>
      {/* Decorative gradient blur */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 ${onPause ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
      
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${onPause ? "bg-amber-400" : "bg-emerald-400"}`}></div>
            {!onPause && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
            )}
          </div>
          <span className="text-white font-bold tracking-wide">
            {onPause ? "Dialer Paused" : "Auto Dialer Active"}
          </span>
        </div>
        
        {onPause && (
          <div className="font-mono text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
            {formatTime(pauseTimer)}
          </div>
        )}
      </div>

      <button
        onClick={handleTogglePause}
        disabled={isLoading}
        className={`
          z-10 relative flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
          ${onPause 
            ? "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/20" 
            : "bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20"
          }
        `}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : onPause ? (
          <>
            <Play className="w-5 h-5 fill-current" />
            Resume Dialing
          </>
        ) : (
          <>
            <Pause className="w-5 h-5 fill-current" />
            Pause Dialing
          </>
        )}
      </button>
    </div>
  );

  return createPortal(
    <div className="fixed top-24 right-8 z-[100000] pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-500">
      {content}
    </div>,
    document.body
  );
}
