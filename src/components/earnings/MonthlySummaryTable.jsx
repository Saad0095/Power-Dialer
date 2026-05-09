import { Wallet, CalendarCheck, TrendingUp } from "lucide-react";

export default function MonthlySummaryTable({ monthlyData, isManagerUser }) {
  return (
    <div className="p-4 md:p-6">
      {monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyData.map((row, index) => (
            <div
              key={row._id ? row._id : `monthly-${index}`}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-slate-800/80 dark:border dark:border-slate-700"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-100/50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-primary-900/20" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {row.month || row._id}
                  </h3>
                </div>
              </div>

              {isManagerUser && row.agentName && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Agent: <span className="text-slate-900 dark:text-white">{row.agentName}</span>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Qualifications</p>
                  <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                    {row.totalQualifications} <span className="text-sm font-normal text-slate-500">leads</span>
                  </p>
                </div>
                
                {isManagerUser && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Earnings</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <p className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                        Rs {row.totalEarnings?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-4">
            <Wallet className="h-12 w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Earnings Found</h3>
          <p className="text-slate-500 dark:text-slate-400">There is no monthly earnings history available for the selected filters.</p>
        </div>
      )}
    </div>
  );
}
