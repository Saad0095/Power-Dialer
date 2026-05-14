import { CalendarClock, MapPin, User, BadgeCent, ChevronLeft, ChevronRight } from "lucide-react";

export default function DetailedLogsTable({
  detailedData,
  isManagerUser,
  pagination,
  setPagination,
}) {
  return (
    <div className="flex flex-col">
      <div className="p-4 md:p-6 space-y-4">
        {detailedData.length > 0 ? (
          detailedData.map((row) => (
            <div 
              key={row._id} 
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
            >
              {/* Left Section: Lead & Date */}
              <div className="flex items-start md:items-center gap-4">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {row.lead?.businessName || "Unknown Lead"}
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {row.qualificationLevel || row.lead?.appointmentStatus || "Qualified"}
                    </span>
                    {row.earningType === "power-hour" && (
                      <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                        Power Hour ⚡
                      </span>
                    )}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(row.earnedAt).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {row.campaign?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Agent & Amount */}
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t border-slate-100 pt-3 md:border-0 md:pt-0 dark:border-slate-700">
                {isManagerUser && (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {row.agent?.name}
                  </p>
                )}
                {isManagerUser && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/20">
                    <BadgeCent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      Rs {row.amount?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-4">
              <BadgeCent className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Detailed Logs</h3>
            <p className="text-slate-500 dark:text-slate-400">No transaction logs were found for this filter.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Page <span className="text-slate-900 dark:text-white">{pagination.page}</span> of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
