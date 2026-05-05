import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play } from "lucide-react";
import { pauseDialing, resumeDialing } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function DialingPauseButton({ user, onShowNotification }) {
  const { hydrateAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pauseTimer, setPauseTimer] = useState(0);

  const isDialing = user?.isAutoDialing;
  const onPause = user?.attendance?.onDialingPause;
  const campaignId = user?.autoDialCampaignId || user?.attendance?.dialingPauseCampaignId;

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
      } else {
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

  const content = (
    <div className="flex items-center gap-2">
      {onPause && (
        <div className="px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-950/60 border border-indigo-400/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] backdrop-blur-sm">
          Dialing Paused: {formatTime(pauseTimer)}
        </div>
      )}
      <button
        onClick={handleTogglePause}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 backdrop-blur-sm border border-white/10 ${
          onPause 
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" 
            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
        }`}
      >
        {onPause ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
        {isLoading ? "..." : (onPause ? "Resume Dialing" : "Pause Dialing")}
      </button>
    </div>
  );

  return createPortal(
    <div className="fixed top-6 right-[calc(50%+130px)] z-[100000] pointer-events-auto transition-all duration-300">
      {content}
    </div>,
    document.body
  );
}
