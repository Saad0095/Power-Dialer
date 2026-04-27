import { ArrowUpRight, Search, Phone, Globe, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

export default function ScrapeResultsTable({ 
  results, 
  isLoadingResults,
  pagination = { total: 0, page: 1, pages: 1 },
  filters = { page: 1, limit: 50, hasPhone: false, hasWebsite: false, search: "" },
  setFilters
}) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search business name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-shadow text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFilterChange('hasPhone', !filters.hasPhone)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              filters.hasPhone 
                ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' 
                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Has Phone</span>
          </button>
          <button
            onClick={() => handleFilterChange('hasWebsite', !filters.hasWebsite)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              filters.hasWebsite 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Has Website</span>
          </button>
        </div>
        {/* Per-page selector */}
        <div className="relative inline-block">
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            className="text-sm pr-8 pl-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-600 appearance-none"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/30 ">
        <div className="overflow-x-auto overflow-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Business</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Address</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">Website</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {
            // isLoadingResults ? (
            //   <tr>
            //     <td colSpan={4} className="px-4 py-8 text-center">
            //       <div className="flex items-center justify-center">
            //         <LoadingSpinner />
            //       </div>
            //     </td>
            //   </tr>
            // ) : 
            results.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-600 dark:text-slate-400">
                  Select a session to review results.
                </td>
              </tr>
            ) : (
              results.map((row) => (
                <tr key={row._id} className="bg-white dark:bg-slate-900/20 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{row.name || "Untitled business"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.phone || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.address || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {row.website ? (
                        <a
                          href={row.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 hover:underline"
                        >
                          Website
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">-</span>
                      )}
                      {row.mapUrl ? (
                        <a
                          href={row.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 hover:underline"
                        >
                          Maps
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isLoadingResults && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center backdrop-blur-xs">
            <LoadingSpinner />
          </div>
        )}
      </div>
      
      {/* Pagination Footer */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{((pagination.page - 1) * filters.limit) + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.page * filters.limit, pagination.total)}</span> of <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
