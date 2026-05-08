import { Layers3, Plus, RotateCcw } from "lucide-react";

export default function CampaignsPageHeader({ onCreateCampaign, onRefresh }) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-8 shadow-lg dark:border-slate-700/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 md:flex-row md:items-center md:justify-between">
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Layers3 className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Campaign Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize and assign your calling efforts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </button>
        <button
          onClick={onCreateCampaign}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>
    </div>
  );
}
