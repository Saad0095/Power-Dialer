import { Wallet, Search, Calendar as CalendarIcon } from "lucide-react";

export default function MonthlySummaryTable({ 
  monthlyData, 
  isManagerUser,
  selectedMonth,
  setSelectedMonth,
  searchQuery,
  setSearchQuery,
  onAgentClick
}) {

  // Filter data based on search query
  const filteredData = monthlyData.filter(row => {
    if (!searchQuery) return true;
    const agentName = row.agentName || "";
    return agentName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
          />
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              {isManagerUser && <th className="px-6 py-4 font-medium">Agent</th>}
              <th className="px-6 py-4 font-medium">Month</th>
              <th className="px-6 py-4 font-medium">Total Qualifications</th>
              {isManagerUser && (
                <>
                  <th className="px-6 py-4 font-medium text-center">Power Hour</th>
                  <th className="px-6 py-4 font-medium text-center">Commission</th>
                  <th className="px-6 py-4 font-medium text-right">Total Earnings</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr 
                  key={row._id ? `${row._id}-${row.agentId || index}` : `monthly-${index}`} 
                  className={`transition-colors ${onAgentClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => onAgentClick && onAgentClick(row.agentId, row.agentName || "Unknown Agent", row.month || row._id)}
                >
                  {isManagerUser && (
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {row.agentName || "Unknown Agent"}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {row.month || row._id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      {row.totalQualifications} leads
                    </span>
                  </td>
                  {isManagerUser && (
                    <>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                          Rs {row.powerHourEarnings?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Rs {row.normalEarnings?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        Rs {row.totalEarnings?.toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isManagerUser ? 6 : 3} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-4">
                      <Wallet className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Earnings Found</h3>
                    <p className="text-slate-500 dark:text-slate-400">There is no monthly earnings history available for the selected filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
