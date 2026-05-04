import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PauseCircle, PlayCircle } from "lucide-react";
import { canUseAttendanceControls } from "../utils/roleUtils";
import { startBreak, endBreak } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function BreakButton({ user, onShowNotification }) {
  const { hydrateAuth } = useAuth();
  const canManageBreak = canUseAttendanceControls(user?.role);
  const [isAgentBreakLoading, setIsAgentBreakLoading] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);

  useEffect(() => {
    if (
      !canManageBreak ||
      !user?.attendance?.onBreak ||
      !user?.attendance?.breakStartedAt
    ) {
      setBreakTimer(0);
      return undefined;
    }

    const serverNow = user.attendance.serverTime ? new Date(user.attendance.serverTime).getTime() : Date.now();
    const clientNow = Date.now();
    const clockOffset = serverNow - clientNow;

    const breakStart = new Date(user.attendance.breakStartedAt).getTime();
    const previousTotalBreakSeconds = Math.floor((user.attendance.totalBreakMs || 0) / 1000);

    const tick = () => {
      const adjustedNow = Date.now() + clockOffset;
      const currentBreakElapsedSeconds = Math.floor((adjustedNow - breakStart) / 1000);
      const totalElapsedSeconds = previousTotalBreakSeconds + currentBreakElapsedSeconds;
      const remaining = 60 * 60 - totalElapsedSeconds;
      setBreakTimer(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [canManageBreak, user?.attendance]);

  const formatRemainingTime = (totalSeconds) => {
    const isNegative = totalSeconds < 0;
    const safeSeconds = Math.abs(Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    const prefix = isNegative ? "-" : "";
    if (hours > 0) {
      return `${prefix}${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${prefix}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleToggleBreak = async () => {
    try {
      setIsAgentBreakLoading(true);
      if (user?.attendance?.onBreak) {
        await endBreak();
        onShowNotification?.("Break ended successfully", "success");
      } else {
        await startBreak();
        onShowNotification?.("Break started... timer active.", "success");
      }
      await hydrateAuth();
    } catch (err) {
      const message = err?.response?.data?.error || "Failed to update break status";
      onShowNotification?.(message, "error");
    } finally {
      setIsAgentBreakLoading(false);
    }
  };

  if (!canManageBreak || !user?.attendance?.isCheckedIn) return null;

  const isBreakOvertime = breakTimer < 0;

  const content = user.attendance.onBreak ? (
    <div className="flex items-center gap-2">
      <div
        className={`px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide ${
          isBreakOvertime
            ? "bg-red-900/60 border border-red-400/70 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse"
            : "bg-rose-900/40 border border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
        }`}
      >
        {isBreakOvertime ? "⚠️ Overtime: " : "Break: "}
        {formatRemainingTime(breakTimer)}
      </div>
      <button
        onClick={handleToggleBreak}
        disabled={isAgentBreakLoading}
        className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-bold shadow-md disabled:opacity-50"
      >
        <PlayCircle className="w-5 h-5" />
        {isAgentBreakLoading ? "..." : "Pause Break"}
      </button>
    </div>
  ) : (
    <button
      onClick={handleToggleBreak}
      disabled={isAgentBreakLoading}
      className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
    >
      <PauseCircle className="w-5 h-5" />
      {isAgentBreakLoading ? "Starting..." : "Take Break"}
    </button>
  );

  return createPortal(
    <div className="fixed top-6 right-4 md:right-20 lg:right-[400px] z-[99999]">
      {content}
    </div>,
    document.body,
  );
}
