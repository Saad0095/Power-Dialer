import {
  useContext,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Play, Square, Pause, SkipForward, Phone } from "lucide-react";
import {
  logAgentCallAttempt,
  startDialing,
  stopDialing,
  completeCampaign,
} from "../services/api";
import { LeadsContext } from "../context/LeadsContext";
import EditLeadModal from "./modals/EditLeadModal";
import { useAuth } from "../hooks/useAuth";

const DialerControls = forwardRef(function DialerControls(
  {
    campaignId,
    isDialing,
    setIsDialing,
    onError,
    onSuccess,
    totalLeads,
    isLoading,
    mode = "power",
    agentId = null,
    isOnBreak = false,
    isOnDialingPause = false,
    onCallTriggered,
  },
  ref,
) {
  const isAgentMode = mode === "agent";
  const { hydrateAuth } = useAuth();
  const leadsContext = useContext(LeadsContext);
  const leads = leadsContext ? leadsContext.leads : [];
  const pagination = leadsContext ? leadsContext.pagination : null;
  const changePage = leadsContext ? leadsContext.changePage : null;

  useImperativeHandle(ref, () => ({
    triggerNextCall: handleNextCall,
  }));

  // Frontend Auto Dialer State (Zoom Integration)
  const [autoDialState, setAutoDialState] = useState({
    active: false,
    currentIndex: 0,
    status: "idle", // 'idle' | 'calling' | 'paused'
  });
  const currentLead = autoDialState.active
    ? leads[autoDialState.currentIndex]
    : null;

  const triggerZoomCall = async (lead) => {
    if (!lead || !lead.phoneNumber) {
      onError("Lead missing phone number");
      return;
    }
    const cleanNumber = String(lead.phoneNumber).replace(/[^\d+]/g, "");

    window.open(`zoomphonecall://${cleanNumber}`, "_self");
    onSuccess(`Dialing ${lead.businessName || lead.phoneNumber} via Zoom`);

    try {
      if (isAgentMode && campaignId) {
        await logAgentCallAttempt({
          campaignId,
          leadId: lead._id,
          phoneNumber: lead?.phoneNumber,
          platform: "zoom",
          outcome: "attempted",
        });
      }

      if (leadsContext?.updateLead) {
        leadsContext.updateLead({
          ...lead,
          dialerStatus: "connected",
          isAutoDialingCurrent: true,
        });
      }

      if (onCallTriggered) {
        onCallTriggered(lead);
      }
      setActiveDialerLead(lead);
      setShowDispositionModal(true);
    } catch (e) {
      console.error("Failed to track call attempt", e);
    }
  };

  const advanceNextCall = (prevState) => {
    const previousLead = leads[prevState.currentIndex];
    if (previousLead && leadsContext?.updateLead) {
      leadsContext.updateLead({ ...previousLead, isAutoDialingCurrent: false });
    }

    // Find the NEXT pending lead
    const nextPendingIndex = leads.findIndex(
      (l, index) =>
        index > prevState.currentIndex && l.dialerStatus === "pending",
    );
    if (nextPendingIndex === -1) {
      return null;
    }
    triggerZoomCall(leads[nextPendingIndex]);
    return { ...prevState, currentIndex: nextPendingIndex };
  };

  const findFirstPendingLead = (pageLeads) => {
    if (!Array.isArray(pageLeads)) return -1;
    return pageLeads.findIndex((lead) => lead.dialerStatus === "pending");
  };

  const advanceToNextPageAndCall = async () => {
    const currentLeadOnPage = leads[autoDialState.currentIndex];
    if (currentLeadOnPage && leadsContext?.updateLead) {
      leadsContext.updateLead({
        ...currentLeadOnPage,
        isAutoDialingCurrent: false,
      });
    }

    if (!pagination || typeof changePage !== "function") {
      try {
        await stopDialing(campaignId, agentId || null);
        await completeCampaign(campaignId);
        await hydrateAuth();
      } catch(e) {}
      setIsDialing(false);
      setAutoDialState({ active: false, currentIndex: 0, status: "idle" });
      onSuccess("Auto Dialer completed all pending leads.");
      return;
    }

    let currentPageToFetch = pagination.page || 1;
    let currentTotalPages = pagination.totalPages || 1;

    // Re-fetch the current page first.
    // If the table is filtered by "Pending", the completed leads fall off page 1,
    // meaning the *next* batch of pending leads will slide into page 1!
    // If not filtered, re-fetching page 1 will just yield completed leads, and we'll naturally move to page 2.
    while (currentPageToFetch <= currentTotalPages) {
      const result = await changePage(currentPageToFetch);
      const fetchedLeads = result?.leads || [];

      if (result?.pagination?.totalPages) {
        currentTotalPages = result.pagination.totalPages;
      }

      const firstPendingIndex = findFirstPendingLead(fetchedLeads);

      if (firstPendingIndex !== -1) {
        setAutoDialState({
          active: true,
          currentIndex: firstPendingIndex,
          status: "calling",
        });
        triggerZoomCall(fetchedLeads[firstPendingIndex]);
        onSuccess(`Continued dialing on page ${currentPageToFetch}.`);
        return;
      }

      currentPageToFetch += 1;
    }

    try {
      await stopDialing(campaignId, agentId || null);
      await completeCampaign(campaignId);
      await hydrateAuth();
    } catch(e) {}
    setIsDialing(false);
    setAutoDialState({ active: false, currentIndex: 0, status: "idle" });
    onSuccess("Auto Dialer completed all pending leads across all pages.");
  };

  // Remove timer effect: user must click Next Call to advance

  // Handle Power Dialer (Twilio Backend)
  const handleStartPowerDialer = async () => {
    if (!campaignId) {
      onError("Please select a campaign first");
      return;
    }
    if (totalLeads === 0) {
      onError("Please upload leads first");
      return;
    }
    try {
      // Twilio - Power Dial Only
      await startDialing(campaignId, agentId || null);
      setIsDialing(true);
      onSuccess("Power dialing started");
    } catch (error) {
      onError(error.response?.data?.error || "Failed to start dialing");
    }
  };

  const handleStopPowerDialer = async () => {
    try {
      await stopDialing(campaignId, agentId || null);
      setIsDialing(false);
      onSuccess("Power dialing stopped");
    } catch (error) {
      onError(error.response?.data?.error || "Failed to stop dialing");
    }
  };

  // // Handle Agent Auto Dialer (Zoom Frontend)
  // const handleStartAutoDialer = () => {
  //   if (!campaignId) {
  //     onError("Please select a campaign first");
  //     return;
  //   }
  //   if (leads.length === 0) {
  //     onError("No leads available on this page to dial");
  //     return;
  //   }
  //   // Find the FIRST pending lead
  //   const firstPendingIndex = leads.findIndex(
  //     (l) => l.dialerStatus === "pending",
  //   );
  //   if (firstPendingIndex === -1) {
  //     onError("All leads on this page have been dialed.");
  //     return;
  //   }
  //   setIsDialing(true);
  //   setAutoDialState({
  //     active: true,
  //     currentIndex: firstPendingIndex,
  //     status: "calling",
  //   });
  //   triggerZoomCall(leads[firstPendingIndex]);
  // };

  const handleStartAutoDialer = async () => {
    if (!campaignId) {
      onError("Please select a campaign first");
      return;
    }

    if (!pagination || typeof changePage !== "function") {
      onError("Pagination not ready");
      return;
    }

    setIsDialing(true);

    let page = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;

    while (page <= totalPages) {
      const result = await changePage(page);
      const fetchedLeads = result?.leads || [];

      const index = fetchedLeads.findIndex((l) => l.dialerStatus === "pending");

      if (index !== -1) {
        // Notify backend that we are dialing (Manual/Zoom mode)
        try {
           await startDialing(campaignId, agentId || null, true); // true for isManual
           await hydrateAuth(); // refresh user.isAutoDialing for the pause button
        } catch (err) {
           console.error("Failed to notify backend of manual dialing start", err);
        }

        setAutoDialState({
          active: true,
          currentIndex: index,
          status: "calling",
        });

        triggerZoomCall(fetchedLeads[index]);
        onSuccess(`Resumed dialing from page ${page}`);
        return;
      }

      page++;
    }

    try {
      await stopDialing(campaignId, agentId || null);
      await completeCampaign(campaignId);
      await hydrateAuth();
    } catch(e) {}
    setIsDialing(false);
    onError("No pending leads found in campaign");
  };

  const handleStopAutoDialer = async () => {
    const activeLead = leads[autoDialState.currentIndex];
    if (activeLead && leadsContext?.updateLead) {
      leadsContext.updateLead({ ...activeLead, isAutoDialingCurrent: false });
    }

    try {
      await stopDialing(campaignId, agentId || null);
      await hydrateAuth(); // refresh user.isAutoDialing
    } catch (err) {
      console.error("Failed to notify backend of manual dialing stop", err);
    }

    setIsDialing(false);
    setAutoDialState({ active: false, currentIndex: 0, status: "idle" });
    onSuccess("Agent auto dialer stopped");
  };

  const handlePauseResumeAutoDialer = () => {
    setAutoDialState((prev) => ({
      ...prev,
      status: prev.status === "paused" ? "calling" : "paused",
    }));
  };

  const handleNextCall = async () => {
    // If the dialer is stopped or paused (e.g. by Break or Dialing Pause), don't automatically advance
    if (!autoDialState.active || isOnBreak || isOnDialingPause) return;

    const nextState = advanceNextCall(autoDialState);
    if (nextState) {
      setAutoDialState(nextState);
      return;
    }

    await advanceToNextPageAndCall();
  };

  const handleNextCallRef = useRef(handleNextCall);
  useEffect(() => {
    handleNextCallRef.current = handleNextCall;
  });

  const prevIsOnBreak = useRef(isOnBreak);
  useEffect(() => {
    if (prevIsOnBreak.current && !isOnBreak) {
      if (autoDialState.active) {
        setTimeout(() => handleNextCallRef.current(), 500);
      }
    }
    prevIsOnBreak.current = isOnBreak;
  }, [isOnBreak]);

  // Sync internal autoDialState with global isDialing prop and isOnDialingPause
  useEffect(() => {
    if ((!isDialing || isOnDialingPause) && autoDialState.active) {
      setAutoDialState({ active: false, currentIndex: 0, status: "idle" });
    }
  }, [isDialing, isOnDialingPause]);

  // Cleanup: Pause dialer if the agent navigates away while dialing
  useEffect(() => {
    return () => {
      // We can't access latest state in cleanup without refs, so we use a ref to track if we're active
    };
  }, []);

  const activeStateRef = useRef(autoDialState.active);
  useEffect(() => {
    activeStateRef.current = autoDialState.active;
  }, [autoDialState.active]);

  const pauseRef = useRef(isOnDialingPause);
  useEffect(() => {
    pauseRef.current = isOnDialingPause;
  }, [isOnDialingPause]);

  useEffect(() => {
    return () => {
      if (activeStateRef.current && !pauseRef.current) {
        import("../services/api").then(({ stopDialing }) => {
          stopDialing(campaignId, agentId || null).catch(() => {});
        });
      }
    };
  }, [campaignId, agentId]);

  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [activeDialerLead, setActiveDialerLead] = useState(null);

  const handleDispositionSaved = (updatedLead) => {
    if (leadsContext?.updateLead) {
      leadsContext.updateLead(updatedLead);
    }
    setShowDispositionModal(false);
    onSuccess("Lead disposed successfully");

    // Add a 5-second delay before triggering the next call
    // Uses the ref to ensure we don't use stale closures if the break state changed during the wait
    setTimeout(() => {
      handleNextCallRef.current();
    }, 1000);
  };

  const hasAttemptedAutoStart = useRef(false);
  useEffect(() => {
    if (isDialing && isAgentMode && !autoDialState.active && leads.length > 0 && !hasAttemptedAutoStart.current) {
      hasAttemptedAutoStart.current = true;
      handleStartAutoDialer();
    }
    if (!isDialing) {
      hasAttemptedAutoStart.current = false;
    }
  }, [isDialing, isAgentMode, autoDialState.active, leads.length]);

  return (
    <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">
        {isAgentMode ? "Agent Auto Dialer" : "Power Dialer Controls"}
      </h2>

      {!isAgentMode ? (
        // Power Dialer UI
        <div>
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleStartPowerDialer}
              disabled={
                isDialing || !campaignId || totalLeads === 0 || isLoading
              }
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                isDialing || !campaignId || totalLeads === 0 || isLoading
                  ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-linear-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-emerald-500/50"
              }`}
            >
              <Play className="w-5 h-5" />
              Start Power Dialer
            </button>
            <button
              onClick={handleStopPowerDialer}
              disabled={!isDialing || isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                !isDialing || isLoading
                  ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-linear-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-lg hover:shadow-rose-500/50"
              }`}
            >
              <Square className="w-5 h-5" />
              Stop Power Dialer
            </button>
          </div>
          {isDialing && (
            <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 font-semibold">
                Power dialer is running via Twilio...
              </span>
            </div>
          )}
        </div>
      ) : (
        // Agent Auto Dialer UI (Zoom Integration)
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            {!autoDialState.active && (
              <button
                onClick={handleStartAutoDialer}
                disabled={!campaignId || leads.length === 0 || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                  !campaignId || leads.length === 0 || isLoading
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-linear-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-lg hover:shadow-indigo-500/50"
                }`}
              >
                <Play className="w-5 h-5" />
                Start Auto Dialer
              </button>
            )}
          </div>

          {autoDialState.active && !isOnBreak && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${autoDialState.status === "calling" ? "bg-indigo-400 animate-pulse" : "bg-amber-400"}`}
                ></div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Auto Dialing in Progress
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Lead {autoDialState.currentIndex + 1} of {leads.length}:{" "}
                    <span className="text-emerald-400 font-mono">
                      {currentLead?.phoneNumber}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <EditLeadModal
        isOpen={showDispositionModal}
        lead={activeDialerLead}
        onClose={() => setShowDispositionModal(false)}
        onSave={handleDispositionSaved}
        onLeadDeleted={() => setShowDispositionModal(false)}
        hideCloseButton={true}
      />
    </div>
  );
});

export default DialerControls;
