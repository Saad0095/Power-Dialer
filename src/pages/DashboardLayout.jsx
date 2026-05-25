import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canUseAttendanceControls, isAgent } from '../utils/roleUtils';
import { useNotification } from '../hooks/useNotification';
import { useTwilioDevice } from '../hooks/useTwilioDevice';
import { useWebSocket } from '../hooks/useWebSocket';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NotificationSystem from '../components/NotificationSystem';
import ActiveCallPanel from '../components/ActiveCallPanel';
import LeadDetailModal from '../components/modals/LeadDetailModal';
import { checkIn } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { LogIn, X, Clock } from 'lucide-react';

const DEFAULT_SHIFT_END_TIME = '04:00';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

const getZonedDateParts = (date, timezone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
};

const getShiftReminderWindowState = (date, user) => {
  const timezone = user?.timezone || DEFAULT_TIMEZONE;
  const shiftEndTime = user?.shiftEndTime || DEFAULT_SHIFT_END_TIME;
  const [endHourRaw, endMinuteRaw] = String(shiftEndTime).split(':');
  const endHour = Number(endHourRaw);
  const endMinute = Number(endMinuteRaw);

  if (!Number.isFinite(endHour) || !Number.isFinite(endMinute)) {
    return { isReminderWindow: false, dayKey: null };
  }

  const nowParts = getZonedDateParts(date, timezone);
  const nowValue = Date.UTC(
    nowParts.year,
    nowParts.month - 1,
    nowParts.day,
    nowParts.hour,
    nowParts.minute,
  );
  const shiftEndValue = Date.UTC(
    nowParts.year,
    nowParts.month - 1,
    nowParts.day,
    endHour,
    endMinute,
  );

  return {
    isReminderWindow:
      nowValue >= shiftEndValue - (10 * 60 * 1000) &&
      nowValue < shiftEndValue + (30 * 60 * 1000),
    dayKey: `${nowParts.year}-${String(nowParts.month).padStart(2, '0')}-${String(nowParts.day).padStart(2, '0')}`,
  };
};

// ─── Check-in Enforcement Modal ─────────────────────────────────────────────
function CheckInModal({ user, onCheckedIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { hydrateAuth } = useAuth();

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError('');
      await checkIn();
      await hydrateAuth();
      onCheckedIn();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">You're Not Checked In</h2>
          <p className="text-amber-100 text-sm mt-1">
            Please check in to start your shift
          </p>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">
            Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{user?.name || user?.email}</span>!
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
            Your attendance record requires a check-in before you can start working.
          </p>

          {error && (
            <div className="mb-4 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Checking In...' : 'Check In Now'}
          </button>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
            Your attendance will be recorded from this moment.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shift-End Reminder Banner ───────────────────────────────────────────────
function ShiftEndReminderBanner({ onDismiss }) {
  return (
    <div className="sticky top-[73px] z-[800] w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="w-4 h-4 shrink-0 text-blue-200" />
        <span>
          <span className="font-bold">Shift Ending Soon</span> — Please make sure to
          check out after completing your shift to ensure accurate attendance records.
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 ml-4 p-1 rounded hover:bg-white/20 transition"
        aria-label="Dismiss reminder"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main DashboardLayout ────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { user, logout, theme } = useAuth();
  const navigate = useNavigate();
  const { successMessage, errorMessage, showNotification } = useNotification();
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showShiftReminder, setShowShiftReminder] = useState(false);
  const [reminderDismissedAt, setReminderDismissedAt] = useState(null);

  // Should show check-in enforcement for attendance-tracked roles only
  const isAttendanceRole = canUseAttendanceControls(user?.role);
  const isCheckedIn = user?.attendance?.isCheckedIn;

  // Show modal if agent is in CRM but not checked in
  useEffect(() => {
    if (!user || !isAttendanceRole) return;
    setShowCheckInModal(!isCheckedIn);
  }, [user, isAttendanceRole, isCheckedIn]);

  // Shift-end reminder (runs every minute)
  useEffect(() => {
    if (!isAttendanceRole) return;

    const checkReminderTime = () => {
      const now = new Date();
      const { isReminderWindow, dayKey } = getShiftReminderWindowState(now, user);

      if (isReminderWindow) {
        if (reminderDismissedAt !== dayKey) {
          setShowShiftReminder(true);
        }
      } else {
        setShowShiftReminder(false);
      }
    };

    checkReminderTime();
    const interval = setInterval(checkReminderTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [isAttendanceRole, reminderDismissedAt, user]);

  const handleDismissReminder = useCallback(() => {
    const now = new Date();
    const { dayKey } = getShiftReminderWindowState(now, user);
    setReminderDismissedAt(dayKey);
    setShowShiftReminder(false);
  }, [user]);

  // Initialize Twilio Voice SDK for agent browsers (receiving calls)
  const { 
    isReady: isTwilioReady, 
    error: twilioError,
    activeCall,
    callStatus,
    callDirection,
    placeOutgoingCall,
    hangupActiveCall,
  } = useTwilioDevice(isAgent(user?.role));

  // Keep websocket connected globally across dashboard pages.
  const { websocketService } = useWebSocket();

  // Listen for global celebratory events
  useEffect(() => {
    if (!websocketService) return;

    const handleCelebration = (payload) => {
      if (!payload || !payload.message) return;
      showNotification?.(payload.message, 'success');
      
      // Trigger local confetti
      window.dispatchEvent(new Event('lead:appointment-success'));
    };

    websocketService.on('notification:appointment-created', handleCelebration);
    return () => {
      websocketService.off('notification:appointment-created', handleCelebration);
    };
  }, [websocketService, showNotification]);

  const [autoLeadId, setAutoLeadId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Automatically pop open the lead details when a call connects
  useEffect(() => {
    if (activeCall && (callStatus === 'ringing' || callStatus === 'connected')) {
      const customLeadId = activeCall.customParameters?.get?.('leadId');
      if (customLeadId && customLeadId !== autoLeadId) {
        setAutoLeadId(customLeadId);
      }
    } else if (callStatus === 'idle') {
      // Don't auto-close it when hanging up right away so they can take notes
    }
  }, [activeCall, callStatus, autoLeadId]);

  // Surface Twilio device issues to the user (non-blocking)
  if (isAgent(user?.role) && twilioError) {
    console.error('Twilio Device init error:', twilioError);
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-linear-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-linear-to-br from-slate-50 via-slate-100 to-slate-50'}`}>
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onShowNotification={showNotification}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Shift-end reminder banner (3:45 AM – 4:30 AM) */}
      {showShiftReminder && isCheckedIn && (
        <ShiftEndReminderBanner onDismiss={handleDismissReminder} />
      )}

      <NotificationSystem successMessage={successMessage} errorMessage={errorMessage} />

      <div className="mx-auto p-4 md:p-8">
        <div className="flex gap-4 lg:gap-6">
          <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-1 min-w-0">
            <Outlet
              context={{
                showNotification,
                twilioDialer: {
                  isReady: isTwilioReady,
                  callStatus,
                  callDirection,
                  activeCall,
                  placeOutgoingCall,
                  hangupActiveCall,
                },
              }}
            />
          </main>
        </div>
      </div>

      {/* Render ActiveCallPanel globally for agents */}
      {isAgent(user?.role) && (
        <>
          <ActiveCallPanel activeCall={activeCall} callStatus={callStatus} callDirection={callDirection} />
          <LeadDetailModal
            isOpen={!!autoLeadId}
            leadId={autoLeadId}
            onClose={() => setAutoLeadId(null)}
          />
        </>
      )}

      {/* Check-in enforcement modal */}
      {showCheckInModal && (
        <CheckInModal
          user={user}
          onCheckedIn={() => setShowCheckInModal(false)}
        />
      )}
    </div>
  );
}
