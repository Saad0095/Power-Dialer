export default function AgentAttendanceSummaryTable({
  rows,
  selectedAgentId,
  onSelectAgent,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Agent Scorecards</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Click an agent to filter history below. Counts are shift-days only, excluding Saturday and Sunday.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {rows.length === 0 ? (
          <div className="col-span-full py-12 text-center backdrop-blur-md bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-slate-500 font-medium tracking-wide">
            No summary data available for this selection.
          </div>
        ) : (
          rows.map((item) => (
            <div
              key={item.agentId}
              onClick={() => onSelectAgent(item.agentId)}
              className={`relative cursor-pointer transition-all duration-300 ease-out border rounded-2xl p-5 hover:-translate-y-1 ${
                selectedAgentId === item.agentId
                  ? 'backdrop-blur-xl bg-cyan-50/90 dark:bg-cyan-900/40 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                  : 'backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-lg'
              }`}
            >
              <div className="mb-5">
                <p className="font-bold text-slate-900 dark:text-white truncate pr-2">{item.name}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.officeHours || 'Default shift'} • {item.expectedWorkHours || 0}h expected
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Present</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{item.presentDays}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded">Absent (Total)</span>
                  <span className="font-extrabold text-rose-700 dark:text-rose-300">{item.totalAbsences}</span>
                </div>
                <div className="flex flex-col text-xs mt-1 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Calls</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.totalCalls || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lates / Half-days</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.lateMarks || 0} / {item.halfDayMarks || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penalty Absences</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">{item.penaltyAbsences || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100 dark:border-slate-700/30">
                    <span className="text-slate-500 font-medium">Net Hours Bal.</span>
                    <span className={`font-bold ${item.netHoursBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.netHoursBalance > 0 ? '+' : ''}{item.netHoursBalance?.toFixed(2)}h
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium uppercase tracking-wider">Working Days</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{item.workingDays}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
