import React from "react";
import { Users, PhoneCall, RefreshCw } from "lucide-react";

export default function AgentCallStatsPanel({
  selectedDate,
  setSelectedDate,
  isDailyCallsLoading,
  loadDailyCallCounts,
  dailyCallData,
  dailyCallsError,
  maxDate
}) {
  return (
    <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {selectedDate ? `Agent Calls (${selectedDate})` : 'Agent Calls (Past 12 Hours)'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {selectedDate
              ? 'Daily calls handled per agent for selected date.'
              : 'Live rolling window for recent calls handled per agent.'}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={maxDate}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-cyan-500 text-slate-700 dark:text-slate-300 h-[40px]"
            title="Select date to view specific day's stats. Clear to view live activity."
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 transition text-sm font-medium h-[40px]"
            >
              Clear
            </button>
          )}
          <button
            onClick={loadDailyCallCounts}
            disabled={isDailyCallsLoading}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              isDailyCallsLoading
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isDailyCallsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      {dailyCallData.windowStart && dailyCallData.windowEnd && (
        <p className="font-bold text-white-600 dark:text-yellow-600">
          Window: {new Date(dailyCallData.windowStart).toLocaleString()} - {new Date(dailyCallData.windowEnd).toLocaleString()}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Calls</p>
          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{dailyCallData.summary.totalCalls}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Followups</p>
          <p className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
            {dailyCallData.summary.totalFollowups}
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Followups</p>
          <p className="text-2xl font-bold text-red-700 flex items-center gap-2">
            {dailyCallData.summary.totalAppointments}
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Agents with Calls</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            {dailyCallData.summary.activeAgents}
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">Total Agents</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{dailyCallData.summary.totalAgents}</p>
        </div>
      </div>
      {dailyCallsError && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-rose-700 dark:text-rose-300 text-sm">
          {dailyCallsError}
        </div>
      )}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-200/70 dark:bg-slate-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Agent</th>
                <th className="text-left px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Role</th>
                <th className="text-right px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Calls</th>
                <th className="text-right px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Followups</th>
                <th className="text-right px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold">Appointments Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {dailyCallData.agents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-600 dark:text-slate-400">
                    {isDailyCallsLoading ? 'Loading daily call data...' : 'No agents found'}
                  </td>
                </tr>
              ) : (
                dailyCallData.agents.map((agent) => (
                  <tr key={agent.agentId} className="bg-white dark:bg-slate-900/20">
                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-slate-100 font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{agent.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 capitalize">{agent.role}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 font-semibold">
                        <PhoneCall className="w-3 h-3" />
                        {agent.callCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-500 font-medium">
                      {agent.followups}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700 font-medium">
                      {agent.appointmentsCreated}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
