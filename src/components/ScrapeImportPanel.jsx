import { LoaderCircle, Upload } from "lucide-react";
import SmartCampaignSelector from "./SmartCampaignSelector";

export default function ScrapeImportPanel({
  agents,
  selectedCampaignId,
  setSelectedCampaignId,
  selectedAgentId,
  setSelectedAgentId,
  selectedImportSessionIds,
  canImport,
  isImporting,
  selectedSession,
  handleImport,
}) {
  return (
    <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Into CRM</h2>
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Campaign</span>
          <SmartCampaignSelector value={selectedCampaignId} onChange={setSelectedCampaignId} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Imported Leads To <span className="text-xs text-slate-400">(optional)</span></span>
          <select
            value={selectedAgentId}
            onChange={(event) => setSelectedAgentId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          >
            <option value="">Select agent (optional)</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {selectedImportSessionIds.length > 0
            ? `${selectedImportSessionIds.length} session${selectedImportSessionIds.length === 1 ? "" : "s"} selected for import into the chosen campaign.`
            : "Select one or more scrape sessions from the list below to import them together."}
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4 text-sm text-slate-600 dark:text-slate-300">
          Imports skip rows without a business name or phone number, and they also skip duplicates already present in the selected campaign by phone number.
        </div>
        {selectedSession?.status === "running" ? (
          <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300">
            This session is still running. Import will include only results discovered so far.
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleImport}
          disabled={!canImport || isImporting || !selectedCampaignId}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-semibold transition inline-flex items-center justify-center gap-2"
        >
          {isImporting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isImporting ? "Importing..." : "Import Available Results"}
        </button>
      </div>
    </div>
  );
}
