import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDialer } from "../hooks/useDialer";
import SmartCampaignSelector from "../components/SmartCampaignSelector";
import DialerControls from "../components/DialerControls";
import CampaignClientDetailsCard from "../components/CampaignClientDetailsCard";
import { LeadsProvider } from "../context/LeadsContext";
import LeadsTable from "../components/LeadsTable";
import { PhoneCall } from "lucide-react";
import SelectCampaignMsg from "../components/common/SelectCampaignMsg";
import { updateAgentAvailability } from "../services/api";

export default function AutoDialerPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    user?.autoDialCampaignId || user?.attendance?.dialingPauseCampaignId || null
  );

  useEffect(() => {
    // Auto-select campaign if navigating in with an active dialer state but nothing selected locally
    if (!selectedCampaignId) {
      const activeOrPausedCampaignId = user?.autoDialCampaignId || user?.attendance?.dialingPauseCampaignId;
      if (activeOrPausedCampaignId) {
        setSelectedCampaignId(activeOrPausedCampaignId);
      }
    }
  }, [user?.autoDialCampaignId, user?.attendance?.dialingPauseCampaignId, selectedCampaignId]);

  const { isDialing, setIsDialing } = useDialer(
    selectedCampaignId,
    (message, type = "success") => showNotification(message, type),
    { mode: "agent", agentId: user?._id },
  );

  const dialerRef = useRef(null);
  const [isOnBreak, setIsOnBreak] = useState(
    user?.attendance?.onBreak || false
  );
  const isOnDialingPause = user?.attendance?.onDialingPause || false;

  useEffect(() => {
    if (user?.attendance) {
      setIsOnBreak(user.attendance.onBreak || false);
    }
  }, [user?.attendance]);

  // Sync global backend dialer state to the local UI state
  // This is required because if the agent resumes from another page, 
  // the websocket event might be missed before the AutoDialerPage mounts.
  useEffect(() => {
    if (user?.isAutoDialing && selectedCampaignId && user?.autoDialCampaignId === selectedCampaignId) {
      setIsDialing(true);
    }
  }, [user?.isAutoDialing, user?.autoDialCampaignId, selectedCampaignId, setIsDialing]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 rounded p-2">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Auto Dialer
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Agent-specific sequential automatic dialing
            </p>
          </div>
        </div>
      </div>

      {/* Auto Dialer Controls */}
      <div className="space-y-4">
        <SmartCampaignSelector
          value={selectedCampaignId}
          onChange={setSelectedCampaignId}
          onShowNotification={showNotification}
          childDialerType="auto"
          childOnly
          assignedToMeOnly={true}
        />
        {selectedCampaignId && (
          <LeadsProvider campaignId={selectedCampaignId}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="mt-4 mb-6">
                  <DialerControls
                    ref={dialerRef}
                    campaignId={selectedCampaignId}
                    isDialing={isDialing}
                    setIsDialing={setIsDialing}
                    onError={(message) => showNotification(message, "error")}
                    onSuccess={(message) => showNotification(message, "success")}
                    totalLeads={1}
                    isLoading={false}
                    mode="agent"
                    agentId={user?._id}
                    isOnBreak={isOnBreak}
                    isOnDialingPause={isOnDialingPause}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-4 px-1">
                    Campaign Queue
                  </h2>
                  <LeadsTable showNotification={showNotification} hideManualCall />
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <CampaignClientDetailsCard campaignId={selectedCampaignId} />
              </div>
            </div>
          </LeadsProvider>
        )}
        {!selectedCampaignId && <SelectCampaignMsg />}
      </div>
    </div>
  );
}
