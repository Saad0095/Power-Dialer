import React, { useState, useMemo, useEffect, useRef } from "react";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import { formatSessionLabel, getProgressValue } from "../utils/scraperUtils";

const STATUS_STYLES = {
  queued:  "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  running: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  done:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  error:   "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function ScrapeSessionsList({
  sessions,
  sessionPagination = { total: 0, page: 1, pages: 1 },
  sessionFilters = { page: 1, limit: 10, search: "", datePreset: "all", creatorFilter: "all" },
  setSessionFilters,
  selectedSessionId,
  setSelectedSessionId,
  handleDeleteSession,
  handleCancelSession,
  isLoadingSessions,
  isLoadingResults,
  agents = [],
  refreshSessions,
  showNotification,
}) {
  const [localSearch, setLocalSearch] = useState(sessionFilters.search || "");

  useEffect(() => {
    const t = setTimeout(() => {
      if (sessionFilters.search !== localSearch) {
        setSessionFilters((prev) => ({ ...prev, search: localSearch, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [localSearch, setSessionFilters, sessionFilters.search]);

  const handleFilterChange = (key, value) => {
    setSessionFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > sessionPagination.pages) return;
    setSessionFilters((prev) => ({ ...prev, page: newPage }));
  };



  const managers = useMemo(() => {
    const found = agents.filter((a) => (a?.role || "").toString().toLowerCase() === "manager");
    return found.length ? found : agents;
  }, [agents]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectAllRef = useRef(null);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Keep the select-all checkbox state (checked / indeterminate) in sync
  useEffect(() => {
    const totalVisible = sessions.length;
    const selectedCount = selectedIds.size;
    const el = selectAllRef.current;
    if (!el) return;
    if (selectedCount === 0) {
      el.indeterminate = false;
      el.checked = false;
    } else if (selectedCount > 0 && selectedCount < totalVisible) {
      el.indeterminate = true;
      el.checked = false;
    } else if (selectedCount === totalVisible && totalVisible > 0) {
      el.indeterminate = false;
      el.checked = true;
    } else {
      el.indeterminate = false;
      el.checked = false;
    }
  }, [selectedIds, sessions]);

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    const confirmed = window.confirm(`Delete ${selectedIds.size} sessions and their imported leads?`);
    if (!confirmed) return;
    try {
      const resp = await fetch(`/api/scraper/sessions/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      // Defensive parsing: handle empty or non-JSON responses
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText || 'Bulk delete failed');
      }

      const ct = resp.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await resp.json() : { message: await resp.text() };

      clearSelection();
      setSelectedSessionId?.(null);
      refreshSessions?.();

      // Build a friendly summary from returned JSON
      let msg = data?.message || 'Deleted selected sessions.';
      if (data?.data && typeof data.data === 'object') {
        const parts = [];
        const d = data.data;
        if (d.deletedSessions != null) parts.push(`sessions:${d.deletedSessions}`);
        if (d.deletedResults != null) parts.push(`results:${d.deletedResults}`);
        if (d.attempted != null) parts.push(`attempted:${d.attempted}`);
        if (d.failed != null) parts.push(`failed:${d.failed}`);
        if (parts.length) msg = `${msg} (${parts.join(' | ')})`;
      }

      if (showNotification) showNotification(msg, 'success');
      else if (window.showNotification) window.showNotification(msg, 'success');
      else window.alert(msg);
    } catch (err) {
      console.error('Bulk delete failed', err);
      const em = err?.message || 'Bulk delete failed';
      if (showNotification) showNotification(em, 'error');
      else if (window.showNotification) window.showNotification(em, 'error');
      else window.alert(em);
    }
  };

  useEffect(() => {    
    if (selectedSessionId && !sessions.some((s) => s._id === selectedSessionId)) {
      setSelectedSessionId?.(null);
    }
  }, [sessions, selectedSessionId, setSelectedSessionId]);

  const formatAgentLabel = (a) => {
    if (!a) return "";
    // common string fields
    if (typeof a.name === "string") return a.name;
    if (typeof a.fullName === "string") return a.fullName;
    // name may be an object with parts
    if (a.name && typeof a.name === "object") {
      const n = a.name;
      const parts = [n.first, n.firstName, n.givenName, n.last, n.lastName, n.familyName].filter(Boolean);
      if (parts.length) return parts.join(" ");
      try {
        return JSON.stringify(n);
      } catch (e) {
        return String(a._id || a.id || a.email || "");
      }
    }
    // fallback to other common fields
    if (a.firstName || a.lastName) return `${a.firstName || ""} ${a.lastName || ""}`.trim();
    if (a.email) return a.email;
    return String(a._id || a.id || "");
  };

  return (
    <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
      <div className="mb-4 space-y-3">

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Sessions</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Newest scrape jobs appear here.</p>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search sessions..."
            className="flex-1 min-w-[180px] text-sm px-3 py-2 border rounded-md bg-white dark:bg-slate-900/20 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-primary-400 outline-none"
          />

          {/* Per-page selector */}
          <div className="relative inline-block">
            <select
              value={sessionFilters.limit}
              onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
              className="text-sm pr-8 pl-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-600 appearance-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              {/* <option value={100}>100 / page</option> */}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={sessionFilters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="text-sm px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-600"
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={sessionFilters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="text-sm px-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-600"
            />
          </div>

            {/* Created By (Managers) Dropdown */}
            <div className="relative inline-block">
              <select
                value={sessionFilters.creatorFilter}
                onChange={(e) => handleFilterChange("creatorFilter", e.target.value)}
                className="text-sm pr-8 pl-3 py-2 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-600 appearance-none"
              >
                <option value="all">All creators</option>
                {managers.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>{formatAgentLabel(m)}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

          {/* Bulk actions */}
          <div className="ml-2 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                ref={selectAllRef}
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(sessions.map((s) => s._id)));
                  } else {
                    clearSelection();
                  }
                }}
                className="w-4 h-4"
                aria-label="Select all visible sessions"
              />
              <span className="text-slate-700 dark:text-slate-300">Select all</span>
            </label>

            
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="px-3 py-2 rounded-md bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Delete selected ({selectedIds.size})
            </button>
          </div>

          {/* Clear */}
          {(sessionFilters.search || sessionFilters.startDate || sessionFilters.endDate || sessionFilters.creatorFilter !== "all") && (
            <button
              onClick={() => {
                setLocalSearch("");
                setSessionFilters({ page: 1, limit: 10, search: "", startDate: "", endDate: "", creatorFilter: "all" });
              }}
              className="text-sm text-slate-500 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}

        </div>
      </div>
      <div className="space-y-3 max-h-[42rem] overflow-auto pr-1">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-600 dark:text-slate-400">
            {isLoadingSessions ? "Loading sessions..." : "No sessions found matching criteria."}
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              className={`relative rounded-lg border p-4 transition ${
                selectedSessionId === session._id
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/20"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedSessionId(session._id)}
                className="w-full text-left"
              >
                {selectedSessionId === session._id && isLoadingResults ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
                      <p className="font-semibold text-slate-900 dark:text-white">Loading...</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[session.status] || STATUS_STYLES.running}`}>
                      {session.status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatSessionLabel(session)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">By {session?.createdBy.name}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[session.status] || STATUS_STYLES.running}`}>
                      {session.status}
                    </span>
                  </div>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                  Requested {session.maxResults} | Skipped {session.skipResults || 0} | Found {session.totalFound || 0} | Imported {session.importedCount || 0}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {session.strictLocation === false ? "Nearby areas allowed" : "Strict city match"}
                </p>
                {session.status === "running" ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="truncate">{session.progressMessage || "Scraping in progress..."}</span>
                      <span>{getProgressValue(session)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${getProgressValue(session)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </button>
              <div className="absolute top-3 right-3 z-20">
                <input
                  type="checkbox"
                  checked={selectedIds.has(session._id)}
                  onChange={() => toggleSelect(session._id)}
                  className="w-4 h-4"
                />
              </div>
              <div className="mt-3 flex items-center justify-end">
                <div className="flex items-center gap-3">
                  {session.status === "running" && (
                    <button
                      type="button"
                      onClick={() => handleCancelSession?.(session._id)}
                      className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300 hover:underline text-sm"
                    >
                      Stop
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session._id)}
                    className="inline-flex items-center gap-2 text-rose-700 dark:text-rose-300 hover:underline text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {sessionPagination.total > 0 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{((sessionPagination.page - 1) * sessionFilters.limit) + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(sessionPagination.page * sessionFilters.limit, sessionPagination.total)}</span> of <span className="font-medium text-slate-900 dark:text-white">{sessionPagination.total}</span> sessions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(sessionPagination.page - 1)}
              disabled={sessionPagination.page <= 1}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
              Page {sessionPagination.page} of {sessionPagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(sessionPagination.page + 1)}
              disabled={sessionPagination.page >= sessionPagination.pages}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
