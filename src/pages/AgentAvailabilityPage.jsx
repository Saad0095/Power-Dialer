import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, Clock, Phone, CheckCircle, XCircle, RefreshCw, Users, AlertCircle, Search, Pause } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isManager as checkIsManager, getRoleHomeRoute } from '../utils/roleUtils';
import {
  getAgentStats,
  managerCheckInAgent,
  managerCheckOutAgent,
  managerEndAgentBreak,
  managerStartAgentBreak,
  updateAgentAvailability,
} from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export default function AgentAvailabilityPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAgentId, setLoadingAgentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  // Check if user is manager
  useEffect(() => {
    if (user && !checkIsManager(user?.role)) {
      showNotification('You do not have permission to access this page', 'error');
      const roleHome = getRoleHomeRoute(user?.role);
      navigate(roleHome);
    }
  }, [user, navigate, showNotification]);

  // Load agents from API
  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const agentsList = await getAgentStats();
      setAgents(agentsList || []);
    } catch (err) {
      setError('Failed to load agents');
      showNotification('Failed to load agents', 'error');
      setAgents([]);
      console.error('Error loading agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle real-time agent availability changes via WebSocket
  const handleAgentAvailabilityChanged = (data) => {
    console.log('📡 Real-time agent availability:', data);
    setAgents((prevAgents) =>
      prevAgents.map((agent) =>
        agent._id === data.agentId
          ? {
            ...agent,
            ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
            ...(data.activeLead !== undefined ? { activeLead: data.activeLead } : {}),
            ...(data.attendance ? { attendance: data.attendance } : {}),
          }
          : agent
      )
    );
  };

  // Subscribe to WebSocket events
  useWebSocket({
    onAgentAvailabilityChanged: handleAgentAvailabilityChanged,
  });

  // Handle toggle availability
  const handleToggleAvailability = async (agent) => {
    const agentId = agent._id;
    const newStatus = !agent.isAvailable;

    setLoadingAgentId(agentId);
    const previousAgents = [...agents];

    // Optimistic update
    setAgents((prevAgents) =>
      prevAgents.map((a) =>
        a._id === agentId ? { ...a, isAvailable: newStatus } : a
      )
    );

    try {
      await updateAgentAvailability(agentId, newStatus);
      const statusText = newStatus ? 'available' : 'busy';
      showNotification(`${agent.name} is now ${statusText}`, 'success');
    } catch (err) {
      console.error('Failed to update agent availability:', err);
      // Revert on error
      setAgents(previousAgents);
      showNotification(`Failed to update ${agent.name}'s status`, 'error');
    } finally {
      setLoadingAgentId(null);
    }
  };

  const handleAttendanceAction = async (agent, action) => {
    setLoadingAgentId(agent._id);
    try {
      if (action === 'check-in') {
        await managerCheckInAgent(agent._id);
        showNotification(`${agent.name} checked in`, 'success');
      } else if (action === 'check-out') {
        await managerCheckOutAgent(agent._id);
        showNotification(`${agent.name} checked out`, 'success');
      } else if (action === 'break-start') {
        await managerStartAgentBreak(agent._id);
        showNotification(`${agent.name} is now on break`, 'success');
      } else if (action === 'break-end') {
        await managerEndAgentBreak(agent._id);
        showNotification(`${agent.name} break ended`, 'success');
      } else if (action === 'checkout') {
        // Explicit check out: check out agent only
        await managerCheckOutAgent(agent._id);
        showNotification(`${agent.name} has been checked out`, 'success');
      }

      await loadAgents();
    } catch (err) {
      console.error(`Failed attendance action (${action}) for ${agent.name}:`, err);
      const message = err.response?.data?.error || `Failed to update ${agent.name} attendance`;
      showNotification(message, 'error');
    } finally {
      setLoadingAgentId(null);
    }
  };

  // Initial load and periodic sync (every 30 seconds)
  useEffect(() => {
    loadAgents();

    // Sync every 30 seconds for consistency
    pollIntervalRef.current = setInterval(() => {
      loadAgents();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Manual refresh handler
  const handleRefresh = async () => {
    await loadAgents();
  };

  const getAvailabilityColor = (agent) => {
    if (!agent.attendance || !agent.attendance.isCheckedIn) {
      return 'bg-slate-900/50 border-slate-500/50 text-slate-300';
    }

    if (agent.attendance?.onDialingPause) {
        return 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300';
    }

    return agent.isAvailable && !agent.attendance.onBreak && !agent.activeLead
      ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-300'
      : 'bg-rose-900/50 border-rose-500/50 text-rose-300';
  };

  const getAvailabilityIcon = (agent) => {
    if (!agent.attendance || !agent.attendance.isCheckedIn) {
      return <Clock className="w-5 h-5 text-slate-400" />;
    }

    if (agent.attendance?.onDialingPause) {
        return <Pause className="w-5 h-5 text-indigo-400 fill-current" />;
    }

    return agent.isAvailable && !agent.attendance.onBreak && !agent.activeLead ? (
      <CheckCircle className="w-5 h-5 text-emerald-400" />
    ) : (
      <XCircle className="w-5 h-5 text-rose-400" />
    );
  };

  const stats = {
    total: agents.length,
    available: agents.filter((a) => a.attendance && a.attendance.isCheckedIn && !a.attendance.onBreak && !a.activeLead && a.isAvailable).length,
    busy: agents.filter((a) => a.attendance && a.attendance.isCheckedIn && (a.attendance.onBreak || a.activeLead || !a.isAvailable)).length,
    totalCallsToday: agents.reduce((sum, a) => sum + (a.callsToday || 0), 0),
  };

  const filteredAgents = agents.filter(agent => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(lowerQuery) ||
      agent.email?.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agent Availability</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Monitor and manage agent status in real time</p>
          </div>
        </div>
      </div>

      {/* Search and Refresh Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200/60 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-900 dark:text-slate-100 shadow-sm transition placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition ${isLoading
            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : 'bg-linear-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'
            }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Agents', value: stats.total, icon: Users, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Busy', value: stats.busy, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className="relative backdrop-blur-md bg-white/60 dark:bg-slate-800/60 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 p-6 overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${stat.bg} group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">{stat.label}</span>
            </div>
            <p className={`text-4xl font-extrabold ${stat.color} drop-shadow-xs`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-900/50 border border-rose-700 rounded-lg p-4">
          <p className="text-rose-400 text-sm flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && agents.length === 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-slate-800/40 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-center py-16">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Initializing secure sockets...</p>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const isActuallyAvailable = agent.isAvailable && !agent.attendance?.onBreak && !agent.activeLead && agent.attendance?.isCheckedIn;

          const totalBreakMs = agent.attendance?.totalBreakMs || 0;
          let currentBreakMs = 0;
          if (agent.attendance?.onBreak && agent.attendance?.breakStartedAt) {
            const serverNow = agent.attendance.serverTime ? new Date(agent.attendance.serverTime).getTime() : Date.now();
            const clientNow = Date.now();
            const clockOffset = serverNow - clientNow;
            const adjustedNow = Date.now() + clockOffset;
            
            currentBreakMs = Math.max(0, adjustedNow - new Date(agent.attendance.breakStartedAt).getTime());
          }
          const totalBreakMinutes = Math.floor((totalBreakMs + currentBreakMs) / 60000);
          const breakExceeded = totalBreakMinutes > 60;

          const totalPauseMs = agent.attendance?.totalDialingPauseMs || 0;
          let currentPauseMs = 0;
          if (agent.attendance?.onDialingPause && agent.attendance?.dialingPauseStartedAt) {
            const serverNow = agent.attendance.serverTime ? new Date(agent.attendance.serverTime).getTime() : Date.now();
            const clientNow = Date.now();
            const clockOffset = serverNow - clientNow;
            const adjustedNow = Date.now() + clockOffset;
            
            currentPauseMs = Math.max(0, adjustedNow - new Date(agent.attendance.dialingPauseStartedAt).getTime());
          }
          const totalPauseMinutes = Math.floor((totalPauseMs + currentPauseMs) / 60000);

          return (
            <div
              key={agent._id}
              className="group relative backdrop-blur-md bg-white/70 dark:bg-slate-800/80 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200/60 dark:border-slate-700/50 flex flex-col hover:-translate-y-1 transition-all duration-300 ease-out p-6"
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-linear-to-br from-cyan-500 to-blue-600 rounded-2xl p-3 shrink-0 shadow-inner group-hover:rotate-3 transition-transform duration-300">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{agent.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{agent.email}</p>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div className="mb-5">
                <span
                  className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border ${getAvailabilityColor(
                    agent
                  )}`}
                >
                  {getAvailabilityIcon(agent)}
                  {isActuallyAvailable && (
                    <span className="absolute flex h-2.5 w-2.5 -right-1 -top-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </span>
                  )}
                  {!agent.attendance || !agent.attendance.isCheckedIn
                    ? 'Checked Out'
                    : agent.activeLead
                      ? 'On Call'
                      : agent.attendance.onDialingPause
                        ? 'Dialing Paused'
                        : agent.attendance.onBreak
                          ? 'On Break'
                          : agent.isAvailable
                            ? 'Available'
                            : 'Busy'}
                </span>
              </div>

              {/* Attendance Details + Logout Button */}
              <div className="mt-auto border-t border-slate-200/60 dark:border-slate-700/50 pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2">
                  <span className="text-emerald-600 dark:text-emerald-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    First Call
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {agent.attendance?.firstCallAt
                      ? new Date(agent.attendance.firstCallAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2">
                  <span className="text-cyan-600 dark:text-cyan-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Last Call
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {agent.attendance?.lastCallAt
                      ? new Date(agent.attendance.lastCallAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>

                <div className={`flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2 ${breakExceeded ? 'bg-rose-100/80 dark:bg-rose-900/40 -mx-2 px-2 pt-2 rounded border-rose-200 dark:border-rose-800' : ''}`}>
                  <span className={`${breakExceeded ? 'text-rose-700 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'} font-medium flex items-center gap-1.5`}>
                    <Clock className="w-3.5 h-3.5" />
                    Break Taken
                  </span>
                  <span className={`${breakExceeded ? 'text-rose-800 dark:text-rose-300 font-extrabold' : 'text-amber-700 dark:text-amber-400 font-bold'}`}>
                    {totalBreakMinutes} min
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2">
                  <span className="text-indigo-600 dark:text-indigo-500 font-medium flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    Pause Taken
                  </span>
                  <span className="text-indigo-700 dark:text-indigo-400 font-bold">
                    {totalPauseMinutes} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Check In
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {agent.attendance?.checkedInAt
                      ? new Date(agent.attendance.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/30 pb-2">
                  <span className="text-rose-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Check Out
                  </span>
                  <span className="text-rose-600 font-bold">
                    {agent.attendance?.checkedOutAt
                      ? new Date(agent.attendance.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>

                {/* Explicit Check Out Button for Manager/Admin */}
                {user && (user.role === 'manager' || user.role === 'admin') && agent.attendance?.isCheckedIn && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleAttendanceAction(agent, 'checkout')}
                      disabled={loadingAgentId === agent._id}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      {loadingAgentId === agent._id ? 'Checking out...' : 'Check Out Agent'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filteredAgents.length === 0 && (
        <div className="backdrop-blur-md bg-white/40 dark:bg-slate-800/40 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-center py-20">
          <Users className="w-14 h-14 text-slate-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No agents found</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Wait for agents to connect or clear active filters.</p>
        </div>
      )}
    </div>
  );
}
