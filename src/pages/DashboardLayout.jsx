import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAgent } from '../utils/roleUtils';
import { useNotification } from '../hooks/useNotification';
import { useTwilioDevice } from '../hooks/useTwilioDevice';
import { useWebSocket } from '../hooks/useWebSocket';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NotificationSystem from '../components/NotificationSystem';
import ActiveCallPanel from '../components/ActiveCallPanel';
import LeadDetailModal from '../components/modals/LeadDetailModal';
import { useState, useEffect } from 'react';

export default function DashboardLayout() {
  const { user, logout, theme } = useAuth();
  const navigate = useNavigate();
  const { successMessage, errorMessage, showNotification } = useNotification();

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
      // Don't auto-close it when hanging up right away so they can take notes,
      // but if the call is entirely dead, we can leave it open until they close it manually.
    }
  }, [activeCall, callStatus, autoLeadId]);

  // Surface Twilio device issues to the user (non-blocking)
  if (isAgent(user?.role) && twilioError) {
    // Avoid spamming notifications every render by relying on NotificationSystem state
    // eslint-disable-next-line no-console
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

      <NotificationSystem successMessage={successMessage} errorMessage={errorMessage} />

      {/* <div className="max-w-7xl mx-auto p-4 md:p-8"> */}
      <div className="mx-auto p-4 md:p-8">
        <div className="flex gap-4 lg:gap-6">
          <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-1 min-w-0">
            {/* {isAgent(user?.role) && (
              <div className="mb-4">
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Twilio Device:{' '}
                  <span className={isTwilioReady ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {isTwilioReady ? 'Ready' : 'Initializing...'}
                  </span>
                </div>
              </div>
            )} */}

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
    </div>
  );
}
