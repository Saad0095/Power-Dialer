import ScrapeForm from "../components/ScrapeForm";
import ScrapeResultsTable from "../components/ScrapeResultsTable";
import ScrapeImportPanel from "../components/ScrapeImportPanel";
import ScrapeSessionsList from "../components/ScrapeSessionsList";
import { useEffect, useState } from "react";
import { MapPinned, RefreshCw } from "lucide-react";
import { csvEscape, normalizeExportPhone, getProgressValue } from "../utils/scraperUtils";
import useScraperStats from "../hooks/useScraperStats";
import { useOutletContext } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  deleteScrapeSession,
  getCampaigns,
  getScrapeSession,
  getScrapeSessionResults,
  getScrapeSessions,
  importScrapeSessionResults,
  startScrapeSession,
  cancelScrapeSession,
  getDailyScrapeLeads,
  getScraperManagersAndAdmins,
} from "../services/api";

const DEFAULT_FORM = {
  businessType: "",
  location: "",
  maxResults: 20,
  skipResults: 0,
  strictLocation: true,
};

const STATUS_STYLES = {
  queued:
    "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  running:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  canceled:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function DailyLeadsChart({ series }) {
  if (!series?.length) return null;

  const max = Math.max(...series.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
        Leads Scraped — Last {series.length} Days&nbsp;
        <span className="normal-case font-normal">
          (12:00 noon → 12:00 noon PKT)
        </span>
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {series.map((d, i) => {
          const heightPct = Math.max((d.count / max) * 100, d.count ? 5 : 0);
          const isToday = i === series.length - 1;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              {d.count > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                  {d.count}
                </span>
              )}
              <div
                title={`${d.label}: ${d.count} lead${d.count !== 1 ? "s" : ""}`}
                className={`w-full rounded-t transition-all duration-500 min-h-0.5 ${
                  isToday
                    ? "bg-violet-500 dark:bg-violet-400"
                    : "bg-violet-200 dark:bg-violet-800/60"
                }`}
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none whitespace-nowrap">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ScraperPage() {
  const { showNotification } = useOutletContext();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 50, hasPhone: false, hasWebsite: false, search: "" });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [sessionFilters, setSessionFilters] = useState({ page: 1, limit: 50, search: "", startDate: "", endDate: "", creatorFilter: "all" });
  const [sessionPagination, setSessionPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [campaigns, setCampaigns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Daily leads state: { count: number, series: Array<{ label, count }> }
  const [dailyLeads, setDailyLeads] = useState({ count: 0, series: [] });

  const canImport =
    Boolean(selectedSessionId) && results.length > 0 && selectedCampaignId;

  const hasActiveSession = sessions.some(
    (s) => s.status === "running" || s.status === "queued",
  );

  const stats = useScraperStats(results);

  // -------------------------------------------------------------------------
  // Loaders
  // -------------------------------------------------------------------------

  const loadReferenceData = async () => {
    try {
      const [campaignData, agentData] = await Promise.all([
        getCampaigns(),
        getScraperManagersAndAdmins(),
      ]);
      const normalizedCampaigns = Array.isArray(campaignData)
        ? campaignData
        : campaignData?.data || [];
      setCampaigns(normalizedCampaigns);
      console.log(agentData);
      
      setAgents(agentData || []);
    } catch (error) {
      console.error("Failed to load scraper reference data:", error);
      showNotification?.("Failed to load campaigns or agents", "error");
    }
  };

  const loadSessions = async (preferredSessionId = null, options = {}, currentFilters = sessionFilters) => {
    const { silent = false } = options;
    try {
      if (!silent) setIsLoadingSessions(true);
      const data = await getScrapeSessions(currentFilters);
      setSessions(data.sessions || []);
      setSessionPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error("Failed to load scrape sessions:", error);
      showNotification?.("Failed to load scrape sessions", "error");
    } finally {
      if (!silent) setIsLoadingSessions(false);
    }
  };

  const loadSessionResults = async (sessionId, currentFilters = filters) => {
    if (!sessionId) {
      setSelectedSession(null);
      setResults([]);
      setPagination({ total: 0, page: 1, pages: 1 });
      return;
    }
    try {
      setIsLoadingResults(true);
      const data = await getScrapeSessionResults(sessionId, currentFilters);
      setSelectedSession(data.session);
      setResults(data.results || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error("Failed to load scrape results:", error);
      showNotification?.("Failed to load scrape results", "error");
      setSelectedSession(null);
      setResults([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    } finally {
      setIsLoadingResults(false);
    }
  };

  const loadDailyLeads = async () => {
    try {
      const data = await getDailyScrapeLeads(7);
      if (!data) return;
      setDailyLeads({
        // "today" count = last item in series (current noon→noon window)
        count: data.series?.length
          ? (data.series[data.series.length - 1]?.count ?? 0)
          : (data.count ?? 0),
        series: data.series || [],
      });
    } catch (err) {
      console.error("Failed to load daily leads:", err);
    }
  };

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  useEffect(() => {
    void loadReferenceData();
    void loadDailyLeads();
  }, []);

  useEffect(() => {
    void loadSessions(selectedSessionId, {}, sessionFilters);
  }, [sessionFilters]);

  useEffect(() => {
    if (selectedSessionId) {
      setFilters({ page: 1, limit: 50, hasPhone: false, hasWebsite: false, search: "" });
    } else {
      setSelectedSession(null);
      setResults([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      void loadSessionResults(selectedSessionId, filters);
    }
  }, [selectedSessionId, filters]);

  // Poll sessions list while any job is active
  useEffect(() => {
    if (!hasActiveSession) return undefined;

    const interval = window.setInterval(async () => {
      try {
        await loadSessions(selectedSessionId, { silent: true });
      } catch (error) {
        console.error("Failed to refresh active scrape sessions:", error);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [hasActiveSession, selectedSessionId]);

  // Poll selected session's results while it is running/queued
  useEffect(() => {
    const status = selectedSession?.status;
    if (!selectedSessionId || (status !== "running" && status !== "queued")) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const latestSession = await getScrapeSession(selectedSessionId);
        setSessions((prev) =>
          prev.map((s) =>
            s._id === latestSession._id ? { ...s, ...latestSession } : s,
          ),
        );

        if (latestSession.status === "running") {
          const latestData = await getScrapeSessionResults(selectedSessionId, filters);
          setResults(latestData.results || []);
          if (latestData.pagination) setPagination(latestData.pagination);
        }

        if (
          latestSession.status !== "running" &&
          latestSession.status !== "queued"
        ) {
          window.clearInterval(interval);
          await loadSessions(selectedSessionId);
          await loadSessionResults(selectedSessionId, filters);

          if (latestSession.status === "done") {
            showNotification?.(
              `Scrape complete. ${latestSession.totalFound || 0} results collected.`,
              "success",
            );
            // Refresh daily leads count when a job finishes
            void loadDailyLeads();
          } else if (latestSession.status === "error") {
            showNotification?.(latestSession.error || "Scrape failed", "error");
          }
        }
      } catch (error) {
        console.error("Failed to poll scrape session:", error);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [selectedSession?.status, selectedSessionId, showNotification]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStartScrape = async (event) => {
    event.preventDefault();
    const businessType = form.businessType.trim();
    const location = form.location.trim();
    if (!businessType || !location) {
      showNotification?.("Business type and location are required", "error");
      return;
    }
    try {
      setIsStarting(true);
      const response = await startScrapeSession({
        businessType,
        location,
        maxResults: Number(form.maxResults),
        skipResults: Number(form.skipResults) || 0,
        strictLocation: Boolean(form.strictLocation),
      });
      setForm((prev) => ({ ...prev, businessType: "", location: "" }));
      await loadSessions(response.sessionId);
      await loadSessionResults(response.sessionId, { page: 1, limit: 50, hasPhone: false, hasWebsite: false, search: "" });
      const msg =
        response.queuePosition > 1
          ? `Queued at position ${response.queuePosition}`
          : "Scrape job started";
      showNotification?.(msg, "success");
    } catch (error) {
      console.error("Failed to start scrape:", error);
      showNotification?.(
        error.response?.data?.error || "Failed to start scrape job",
        "error",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedSessionId || !selectedCampaignId) {
      showNotification?.("Select a campaign before importing", "error");
      return;
    }
    try {
      setIsImporting(true);
      const payload = { campaignId: selectedCampaignId };
      if (selectedAgentId) payload.agentId = selectedAgentId;
      const response = await importScrapeSessionResults(
        selectedSessionId,
        payload,
      );
      showNotification?.(
        response.message || "Results imported successfully",
        "success",
      );
      await loadSessions(selectedSessionId);
      await loadSessionResults(selectedSessionId, filters);
    } catch (error) {
      console.error("Failed to import scrape results:", error);
      showNotification?.(
        error.response?.data?.error || "Failed to import scrape results",
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const confirmed = window.confirm(
      "Delete this scrape session and its stored results?",
    );
    if (!confirmed) return;
    try {
      await deleteScrapeSession(sessionId);
      const fallbackSessionId =
        sessionId === selectedSessionId ? null : selectedSessionId;
      if (sessionId === selectedSessionId) {
        setSelectedSessionId(null);
        setSelectedSession(null);
        setResults([]);
      }
      await loadSessions(fallbackSessionId);
      showNotification?.("Scrape session deleted", "success");
    } catch (error) {
      console.error("Failed to delete scrape session:", error);
      showNotification?.(
        error.response?.data?.error || "Failed to delete scrape session",
        "error",
      );
    }
  };

  const handleCancelSession = async (sessionId) => {
    const confirmed = window.confirm("Cancel this running scrape session?");
    if (!confirmed) return;
    try {
      await cancelScrapeSession(sessionId);
      if (sessionId === selectedSessionId) {
        setSelectedSessionId(null);
        setSelectedSession(null);
        setResults([]);
      }
      await loadSessions(null);
      showNotification?.("Scrape session canceled", "success");
    } catch (error) {
      console.error("Failed to cancel scrape session:", error);
      showNotification?.(
        error.response?.data?.error || "Failed to cancel scrape session",
        "error",
      );
    }
  };

  const handleExportCsv = async () => {
    if (!selectedSessionId) return;
    try {
      // Fetch all matching results for export based on current filters
      const data = await getScrapeSessionResults(selectedSessionId, { ...filters, limit: 0 });
      const exportResults = data.results || [];
      
      if (!exportResults.length) {
        showNotification?.("No results to export", "info");
        return;
      }
      
      const headers = ["name", "phone", "address", "website", "mapUrl"];
      const rows = [
        headers.join(","),
        ...exportResults.map((row) =>
          headers
            .map((h) =>
              h === "phone"
                ? csvEscape(normalizeExportPhone(row.phone))
                : csvEscape(row[h]),
            )
            .join(","),
        ),
      ];
      const blob = new Blob([rows.join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scrape-${selectedSessionId || Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      showNotification?.("Failed to export results", "error");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 rounded p-2">
              <MapPinned className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Google Maps Scraper
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Run Google Maps scraper, review the results, then import into
                CRM campaign.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6">
        <div className="space-y-6">
          <ScrapeForm
            form={form}
            setForm={setForm}
            isStarting={isStarting}
            onSubmit={handleStartScrape}
          />

          {/* Results panel */}
          <div
            className="relative bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700"
            aria-busy={isLoadingResults}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Scrape Results
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Review what the scraper found before importing anything into
                  the lead queue.
                </p>
              </div>
           
              <button
                type="button"
                onClick={() => {
                  void loadReferenceData();
                  void loadSessions(selectedSessionId);
                  void loadDailyLeads();
                }}
                className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingSessions ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
                 <button
                type="button"
                onClick={handleExportCsv}
                disabled={isLoadingResults || !results.length}
                className="text-sm px-4 py-2 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                Export
              </button>
            </div>

            {/* Selected session info */}
            {selectedSession && (
              <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedSession.businessType} in {selectedSession.location}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[selectedSession.status] || STATUS_STYLES.queued}`}
                  >
                    {selectedSession.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Created {new Date(selectedSession.createdAt).toLocaleString()}{" "}
                  | Requested {selectedSession.maxResults} | Skipped{" "}
                  {selectedSession.skipResults || 0} | Found{" "}
                  {selectedSession.totalFound || 0} | Imported{" "}
                  {selectedSession.importedCount || 0}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mode:{" "}
                  {selectedSession.strictLocation === false
                    ? "Nearby areas allowed"
                    : "Strict city match"}
                </p>

                {selectedSession.status === "done" && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Completed at{" "}
                    {selectedSession.completedAt
                      ? new Date(selectedSession.completedAt).toLocaleString()
                      : selectedSession.updatedAt
                        ? new Date(selectedSession.updatedAt).toLocaleString()
                        : "-"}
                    {selectedSession.createdAt &&
                      (selectedSession.completedAt ||
                        selectedSession.updatedAt) &&
                      (() => {
                        const start = new Date(selectedSession.createdAt);
                        const end = new Date(
                          selectedSession.completedAt ||
                            selectedSession.updatedAt,
                        );
                        const ms = end - start;
                        if (ms > 0) {
                          const sec = Math.floor(ms / 1000) % 60;
                          const min = Math.floor(ms / 60000) % 60;
                          const hr = Math.floor(ms / 3600000);
                          return ` | Duration: ${hr ? hr + "h " : ""}${min ? min + "m " : ""}${sec}s`;
                        }
                        return "";
                      })()}
                  </p>
                )}

                {(selectedSession.status === "running" ||
                  selectedSession.status === "queued") && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        {selectedSession.progressMessage ||
                          "Waiting in queue..."}
                      </span>
                      {selectedSession.status === "running" && (
                        <span>{getProgressValue(selectedSession)}%</span>
                      )}
                    </div>
                    {selectedSession.status === "running" && (
                      <>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{
                              width: `${getProgressValue(selectedSession)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Processed {selectedSession.processedCount || 0} /{" "}
                          {selectedSession.maxResults || 0} | Successful{" "}
                          {selectedSession.successCount || 0} | Discovered{" "}
                          {selectedSession.discoveredCount || 0}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {selectedSession.error && (
                  <p className="text-sm text-rose-600 dark:text-rose-300 mt-2">
                    {selectedSession.error}
                  </p>
                )}
              </div>
            )}

            {isLoadingResults && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 dark:bg-black/50">
                <LoadingSpinner />
              </div>
            )}

            <ScrapeResultsTable
              results={results}
              isLoadingResults={isLoadingResults}
              pagination={pagination}
              filters={filters}
              setFilters={setFilters}
            />
          </div>

          {/* Weekly stats (moved to bottom) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Weekly Snapshot
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Summary of the last 7 days of scraper activity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Results
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalResults}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  With Phone
                </p>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  {stats.withPhone}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  With Website
                </p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {stats.withWebsite}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Rated
                </p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {stats.rated}
                </p>
              </div>

              <div className="rounded-lg border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/20 p-4">
                <p className="text-xs uppercase tracking-wide text-violet-500 dark:text-violet-400">
                  Today's Leads
                </p>
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {dailyLeads.count}
                </p>
                <p className="text-[10px] text-violet-400 dark:text-violet-500 mt-0.5 leading-none">
                  noon → noon PKT
                </p>
              </div>
            </div>

            <DailyLeadsChart series={dailyLeads.series} />
          </div>
        </div>

        <div className="space-y-6">
          <ScrapeImportPanel
            campaigns={campaigns}
            agents={agents}
            selectedCampaignId={selectedCampaignId}
            setSelectedCampaignId={setSelectedCampaignId}
            selectedAgentId={selectedAgentId}
            setSelectedAgentId={setSelectedAgentId}
            canImport={canImport}
            isImporting={isImporting}
            selectedSession={selectedSession}
            handleImport={handleImport}
          />
          <ScrapeSessionsList
            sessions={sessions}
            sessionPagination={sessionPagination}
            sessionFilters={sessionFilters}
            setSessionFilters={setSessionFilters}
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={setSelectedSessionId}
            handleDeleteSession={handleDeleteSession}
            handleCancelSession={handleCancelSession}
            isLoadingSessions={isLoadingSessions}
            isLoadingResults={isLoadingResults}
            agents={agents}
            refreshSessions={() => void loadSessions(selectedSessionId, {}, sessionFilters)}
            showNotification={showNotification}
          />
        </div>
      </div>
    </div>
  );
}
