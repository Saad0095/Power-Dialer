import { useEffect, useState } from "react";
import {
  LogOut,
  Users,
  Menu,
  Moon,
  Sun,
  Zap,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  canUseAttendanceControls,
  isManager as checkIsManager,
} from "../utils/roleUtils";
import AgentListModal from "./modals/AgentListModal.jsx";
import api, {
  getPowerHourStatus,
  startPowerHour,
  stopPowerHour,
  startBreak,
  endBreak,
} from "../services/api.js";

const POWER_HOUR_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240, 300];

function formatDurationOption(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs} hr${hrs > 1 ? "s" : ""} ${mins} min`;
}

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

export default function Navbar({
  user,
  onLogout,
  onShowNotification,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme, hydrateAuth } = useAuth();
  const [powerHourActive, setPowerHourActive] = useState(false);
  const [isStartingPowerHour, setIsStartingPowerHour] = useState(false);
  const [isStoppingPowerHour, setIsStoppingPowerHour] = useState(false);
  const [selectedPowerHourMinutes, setSelectedPowerHourMinutes] = useState(60);
  const [powerHourEndsAt, setPowerHourEndsAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const isManager = checkIsManager(user?.role);
  const canManageBreak = canUseAttendanceControls(user?.role);
  const [isAgentBreakLoading, setIsAgentBreakLoading] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);

  useEffect(() => {
    const loadPowerHourStatus = async () => {
      try {
        const status = await getPowerHourStatus();
        const isActive = Boolean(status?.isActive);
        const endsAt = status?.session?.endsAt
          ? new Date(status.session.endsAt)
          : null;

        setPowerHourActive(isActive);
        setPowerHourEndsAt(isActive ? endsAt : null);

        if (isActive && endsAt) {
          const nextRemaining = Math.max(
            0,
            Math.floor((endsAt.getTime() - Date.now()) / 1000),
          );
          setRemainingSeconds(nextRemaining);
        } else {
          setRemainingSeconds(0);
        }
      } catch {
        // Keep navbar resilient if status endpoint fails.
        setPowerHourActive(false);
        setPowerHourEndsAt(null);
        setRemainingSeconds(0);
      }
    };

    loadPowerHourStatus();

    // Keep navbar timer in sync with backend session state.
    const statusPollId = setInterval(loadPowerHourStatus, 30000);
    return () => clearInterval(statusPollId);
  }, []);

  useEffect(() => {
    if (!powerHourActive || !powerHourEndsAt) {
      setRemainingSeconds(0);
      return undefined;
    }

    const tick = () => {
      const nextRemaining = Math.max(
        0,
        Math.floor((powerHourEndsAt.getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        setPowerHourActive(false);
        setPowerHourEndsAt(null);
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [powerHourActive, powerHourEndsAt]);

  useEffect(() => {
    if (
      !canManageBreak ||
      !user?.attendance?.onBreak ||
      !user?.attendance?.breakStartedAt
    ) {
      setBreakTimer(0);
      return;
    }

    // Calculate clock offset if serverTime is provided
    const serverNow = user.attendance.serverTime ? new Date(user.attendance.serverTime).getTime() : Date.now();
    const clientNow = Date.now();
    const clockOffset = serverNow - clientNow;

    const breakStart = new Date(user.attendance.breakStartedAt).getTime();
    const previousTotalBreakSeconds = Math.floor(
      (user.attendance.totalBreakMs || 0) / 1000,
    );

    const tick = () => {
      const adjustedNow = Date.now() + clockOffset;
      const currentBreakElapsedSeconds = Math.floor(
        (adjustedNow - breakStart) / 1000,
      );
      const totalElapsedSeconds =
        previousTotalBreakSeconds + currentBreakElapsedSeconds;
      // Allow negative to show overtime
      const remaining = 60 * 60 - totalElapsedSeconds;
      setBreakTimer(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [canManageBreak, user?.attendance]);

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
      const message =
        err?.response?.data?.error || "Failed to update break status";
      onShowNotification?.(message, "error");
    } finally {
      setIsAgentBreakLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const handleStartPowerHour = async () => {
    try {
      setIsStartingPowerHour(true);
      const session = await startPowerHour(selectedPowerHourMinutes, "all");
      setPowerHourActive(true);
      const endsAt = session?.endsAt ? new Date(session.endsAt) : null;
      setPowerHourEndsAt(endsAt);
      if (endsAt) {
        const nextRemaining = Math.max(
          0,
          Math.floor((endsAt.getTime() - Date.now()) / 1000),
        );
        setRemainingSeconds(nextRemaining);
      }
      onShowNotification?.(
        `Power Hour started for all agents (${selectedPowerHourMinutes} min)`,
        "success",
      );
    } catch (error) {
      const message =
        error?.response?.data?.error || "Failed to start Power Hour";
      onShowNotification?.(message, "error");
    } finally {
      setIsStartingPowerHour(false);
    }
  };

  const handleStopPowerHour = async () => {
    try {
      setIsStoppingPowerHour(true);
      await stopPowerHour();
      setPowerHourActive(false);
      setPowerHourEndsAt(null);
      setRemainingSeconds(0);
      onShowNotification?.("Power Hour ended manually", "success");
    } catch (error) {
      const message =
        error?.response?.data?.error || "Failed to stop Power Hour";
      onShowNotification?.(message, "error");
    } finally {
      setIsStoppingPowerHour(false);
    }
  };

  const isBreakOvertime = breakTimer < 0;

  return (
    <>
      <nav className="dark:bg-linear-to-r dark:from-slate-900 dark:to-slate-800 bg-linear-to-r from-slate-50 to-slate-100 dark:border-b dark:border-slate-700 border-b border-slate-200 sticky top-0 z-40 shadow-md dark:shadow-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Logo Section */}
            <div className="flex items-center gap-3 shrink-0">
              {theme === "dark" ? (
                <img
                  src={"/logo-text-white.png"}
                  alt="CleanMeets Logo"
                  className="h-12 w-auto transform-gpu scale-150 origin-left"
                />
              ) : (
                <img
                  src={"/logo-text.png"}
                  alt="CleanMeets Logo"
                  className="h-11 w-auto transform-gpu scale-200 origin-left"
                />
              )}
            </div>

            {/* Actions & User Menu */}
            <div className="flex items-center gap-2 ml-auto">
              {canManageBreak && user?.attendance?.isCheckedIn && (
                <div className="mr-2">
                  {user.attendance.onBreak ? (
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
                        {isAgentBreakLoading ? "..." : "End Break"}
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
                  )}
                </div>
              )}

              {powerHourActive && (
                <div
                  className="
      px-3 py-2 rounded-lg text-sm font-semibold mr-2
      bg-gradient-to-r from-amber-500/20 to-orange-500/20
      text-amber-700 dark:text-amber-300
      border border-amber-400/30
      shadow-[0_0_15px_rgba(251,191,36,0.25)]
      animate-powerPop
    "
                  title="Power Hour countdown"
                >
                  <span className="animate-pulseHotness">
                    🔥 Power Hour Active:{" "}
                    {formatRemainingTime(remainingSeconds)}
                  </span>
                </div>
              )}

              {/* Power Hour controls only for managers */}
              {isManager && (
                <>
                  <select
                    value={selectedPowerHourMinutes}
                    onChange={(event) =>
                      setSelectedPowerHourMinutes(Number(event.target.value))
                    }
                    disabled={powerHourActive || isStartingPowerHour}
                    className="px-2 py-2 rounded-lg border border-amber-300/60 dark:border-amber-400/30 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 text-sm disabled:opacity-50"
                    title="Select Power Hour duration"
                  >
                    {POWER_HOUR_DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {formatDurationOption(minutes)}
                      </option>
                    ))}
                  </select>
                  {!powerHourActive && (
                    <button
                      onClick={handleStartPowerHour}
                      disabled={isStartingPowerHour || isStoppingPowerHour}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-500/30 transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Start Power Hour for all agents"
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {isStartingPowerHour
                          ? "Starting..."
                          : "Start Power Hour"}
                      </span>
                    </button>
                  )}
                  {powerHourActive && (
                    <button
                      onClick={handleStopPowerHour}
                      disabled={isStoppingPowerHour || isStartingPowerHour}
                      className="flex items-center gap-1 px-3 py-2 bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg hover:bg-rose-500/30 transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="End Power Hour manually"
                    >
                      <span className="hidden sm:inline">
                        {isStoppingPowerHour ? "Ending..." : "End Power Hour"}
                      </span>
                    </button>
                  )}
                </>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition text-slate-700 dark:text-slate-300"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {/* User Profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {user?.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}