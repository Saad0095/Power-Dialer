import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isManager } from '../utils/roleUtils';
import { getDailyAgentCallCounts } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import DashboardHeader from '../components/DashboardHeader';
import AgentCallStatsPanel from '../components/AgentCallStatsPanel';
import AgentEarningsDashboard from '../components/AgentEarningsDashboard';
import { getAllAgents } from '../services/api';

export default function OverviewPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const managerView = isManager(user?.role);

  const [windowHours] = useState(12);
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyCallData, setDailyCallData] = useState({
    windowHours: 12,
    windowStart: null,
    windowEnd: null,
    agents: [],
    summary: { totalAgents: 0, activeAgents: 0, totalCalls: 0 },
  });
  const [isDailyCallsLoading, setIsDailyCallsLoading] = useState(false);
  const [dailyCallsError, setDailyCallsError] = useState('');
  const [teamAgentCount, setTeamAgentCount] = useState(0);

  useWebSocket({
    onAgentCallCompleted: () => {
      if (managerView) {
        loadDailyCallCounts();
      }
    },
    onCallCompleted: () => {
      if (managerView) {
        // Debounce or just load to capture manually logged calls and single-dialer calls
        loadDailyCallCounts();
      }
    }
  });

  const loadDailyCallCounts = async () => {
    if (!managerView) return;

    try {
      setIsDailyCallsLoading(true);
      setDailyCallsError('');
      const result = await getDailyAgentCallCounts(windowHours, selectedDate || null);
      setDailyCallData(result);
    } catch (error) {
      console.error('Failed to load daily call counts:', error);
      setDailyCallsError('Failed to load daily agent call counts');
      showNotification?.('Failed to load daily agent call counts', 'error');
    } finally {
      setIsDailyCallsLoading(false);
    }
  };

  useEffect(() => {
    if (!managerView) return;
    loadDailyCallCounts();
  }, [managerView, windowHours, selectedDate]);

  useEffect(() => {
    const loadTeamAgents = async () => {
      if (user?.role !== 'team-lead') return;
      try {
        const res = await getAllAgents();
        const list = res.data || res;
        const team = (list || []).filter(a => (a.teamLead?._id || a.teamLead) === user._id);
        setTeamAgentCount(team.length);
      } catch (err) {
        console.error('Failed to load team agents count', err);
      }
    };
    loadTeamAgents();
  }, [user]);

  const maxDate = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <DashboardHeader managerView={managerView} role={user?.role.charAt(0).toUpperCase() + user?.role.slice(1) || ""}/>
      {managerView ? (
        // Manager / Team-lead view
        <>
          {user?.role === 'team-lead' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold">My Team</h3>
              <p className="text-2xl font-bold mt-2">{teamAgentCount} agent{teamAgentCount !== 1 ? 's' : ''}</p>
            </div>
          )}
        <AgentCallStatsPanel
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isDailyCallsLoading={isDailyCallsLoading}
          loadDailyCallCounts={loadDailyCallCounts}
          dailyCallData={dailyCallData}
          dailyCallsError={dailyCallsError}
          maxDate={maxDate}
        />
        </>
      ) : (
        <AgentEarningsDashboard />
      )}
    </div>
  );
}
