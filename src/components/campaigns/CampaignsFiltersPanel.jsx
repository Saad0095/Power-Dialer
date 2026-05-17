import { Check, Filter, Minus, Search, X } from "lucide-react";

const PIPELINE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Caller", value: "caller" },
  { label: "Closer", value: "closer" },
];

export default function CampaignsFiltersPanel({
  searchTerm,
  onSearchTermChange,
  pipelineTypeFilter,
  onPipelineTypeChange,
  selectedCount,
  selectedAgentId,
  onSelectedAgentChange,
  agents,
  onBulkAssign,
  onClearSelected,
  isBulkAssigning,
  dialerTypeFilter,
  onDialerTypeChange,
  assignmentFilter,
  onAssignmentFilterChange,
  dateRange,
  onDateRangeChange,
  onResetDateRange,
  allSelectableIds,
  selectedCampaignIds,
  onToggleSelectAll,
}) {
  const areAllVisibleSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedCampaignIds.includes(id));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <div className="flex w-full flex-1 gap-4 lg:w-auto">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
              {PIPELINE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => onPipelineTypeChange(option.value)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    pipelineTypeFilter === option.value
                      ? "bg-white text-primary-600 shadow-sm dark:bg-slate-700 dark:text-primary-400"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {selectedCount > 0 && onBulkAssign && (
                <div className="animate-in zoom-in-95 flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-1.5 duration-200 dark:border-primary-800/50 dark:bg-primary-900/20">
                  <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                    {selectedCount} Selected
                  </span>
                  <div className="h-4 w-px bg-primary-200 dark:bg-primary-800" />
                  <select
                    value={selectedAgentId}
                    onChange={(event) => onSelectedAgentChange(event.target.value)}
                    className="cursor-pointer rounded-lg bg-transparent p-2 text-xs font-semibold text-slate-700 outline-none focus:ring-0 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="">Assign Agent...</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={onBulkAssign}
                    disabled={!selectedAgentId || isBulkAssigning}
                    className="text-xs font-bold text-primary-600 disabled:opacity-50 dark:text-primary-400"
                  >
                    Apply
                  </button>
                  <button
                    onClick={onClearSelected}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              )}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 dark:border-slate-700/50">
          <button
            onClick={onToggleSelectAll}
            className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${
              selectedCampaignIds.length > 0
                ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400"
                : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                selectedCampaignIds.length > 0
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {selectedCampaignIds.length > 0 &&
                (areAllVisibleSelected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                ))}
            </span>
            Select visible
          </button>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Advanced:
            </span>
          </div>

          <select
            value={dialerTypeFilter}
            onChange={(event) => onDialerTypeChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-hidden transition focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Dialers</option>
            <option value="auto">Auto</option>
            <option value="parallel">Parallel</option>
          </select>

          <select
            value={assignmentFilter}
            onChange={(event) => onAssignmentFilterChange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-hidden transition focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>

          <div className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-900">
            <input
              type="date"
              value={dateRange.start}
              onChange={(event) =>
                onDateRangeChange({ ...dateRange, start: event.target.value })
              }
              className="border-none bg-transparent p-0 text-[11px] font-bold text-slate-700 focus:ring-0 dark:text-slate-300"
            />
            <span className="text-[10px] font-bold text-slate-400">TO</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(event) =>
                onDateRangeChange({ ...dateRange, end: event.target.value })
              }
              className="border-none bg-transparent p-0 text-[11px] font-bold text-slate-700 focus:ring-0 dark:text-slate-300"
            />
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={onResetDateRange}
                className="ml-1 p-0.5 text-slate-400 transition hover:text-rose-500"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
