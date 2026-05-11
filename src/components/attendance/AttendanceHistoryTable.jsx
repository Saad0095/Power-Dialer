import { CheckCircle, User } from 'lucide-react';

const getDayName = (dateKey) => {
  if (!dateKey) return '';
  const dateObj = new Date(dateKey);
  return dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
};

const getStatusBadge = (log) => {
  if (log.isHalfDay) return <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-full font-bold text-xs whitespace-nowrap">Half Day</span>;
  if (log.isLate) return <span className="inline-flex px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-full font-bold text-xs whitespace-nowrap">Late</span>;
  if (!log.checkInAt) return <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full font-bold text-xs whitespace-nowrap">Absent</span>;
  return <span className="inline-flex px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 rounded-full font-bold text-xs whitespace-nowrap">Present</span>;
};

export default function AttendanceHistoryTable({
  agentFilter,
  isLoading,
  logs,
  onClearAgentFilter,
  formatDateKey,
  formatTime,
  formatDurationMs,
}) {
  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
      {agentFilter !== 'all' && (
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-between">
          <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">Showing history for selected agent only</p>
          <button
            type="button"
            onClick={onClearAgentFilter}
            className="text-xs px-3 py-1 rounded border border-cyan-400/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-800/40"
          >
            Clear Filter
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap bg-white dark:bg-slate-900 shadow-sm border border-slate-300 dark:border-slate-600">
          <thead className="bg-[#e6b8af] dark:bg-[#8f5e55] text-[#2c1d1a] dark:text-[#f8d4cd]">
            <tr>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Date</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Day</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Agent</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Login</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Log Out</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">First Call</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold">Last Call</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold text-center">Status</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold text-center">Break Time</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold text-center">Paused Time</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold text-center">Hours Worked</th>
              <th className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43] font-bold text-center">Lost Hours</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 border border-[#cf9488] dark:border-[#734b43]">
            {isLoading ? (
              <tr>
                <td colSpan="12" className="px-6 py-16 text-center text-slate-500 font-medium tracking-wide border border-[#cf9488] dark:border-[#734b43]">
                  <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3"></div>
                  Loading timesheets...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-6 py-12 text-center text-slate-600 dark:text-slate-400 border border-[#cf9488] dark:border-[#734b43]">
                  No attendance records found for this date range.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 border border-[#cf9488] dark:border-[#734b43]">
                    {formatDateKey(log.dateKey)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200 border border-[#cf9488] dark:border-[#734b43]">
                    {getDayName(log.dateKey)}
                  </td>
                  <td className="px-4 py-3 border border-[#cf9488] dark:border-[#734b43]">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-200">{log.agent?.name || 'Unknown Agent'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {formatTime(log.checkInAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {log.checkOutAt ? formatTime(log.checkOutAt) : <span className="text-cyan-700 dark:text-cyan-400 italic text-xs">Active</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {log.firstCallAt ? formatTime(log.firstCallAt) : <span className="text-slate-400 italic text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {log.lastCallAt ? formatTime(log.lastCallAt) : <span className="text-slate-400 italic text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3 text-center border border-[#cf9488] dark:border-[#734b43]">
                    {getStatusBadge(log)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {formatDurationMs(log.totalBreakMs)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300 border border-[#cf9488] dark:border-[#734b43]">
                    {formatDurationMs(log.totalDialingPauseMs || 0)}
                  </td>
                  <td className="px-4 py-3 text-center border border-[#cf9488] dark:border-[#734b43]">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded font-semibold text-sm border border-cyan-200 dark:border-cyan-800">
                      {formatDurationMs(log.shiftDurationMs)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border border-[#cf9488] dark:border-[#734b43]">
                    {log.lostHours > 0 ? (
                       <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{log.lostHours.toFixed(2)}h</span>
                    ) : log.compensationHours > 0 ? (
                       <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{log.compensationHours.toFixed(2)}h</span>
                    ) : (
                       <span className="text-sm font-medium text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
