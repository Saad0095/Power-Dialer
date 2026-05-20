import { LoaderCircle, Search } from "lucide-react";

export default function ScrapeForm({ form, setForm, isStarting, onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Start New Scrape</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Type</span>
          <input
            value={form.businessType}
            onChange={(event) => setForm((prev) => ({ ...prev, businessType: event.target.value }))}
            placeholder='e.g. "cleaning company"'
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</span>
          <input
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder='e.g. "Houston, Texas"'
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Results</span>
          <select
            value={form.maxResults}
            onChange={(event) => setForm((prev) => ({ ...prev, maxResults: Number(event.target.value) }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          >
            {[20, 40, 60, 100, 120, 150].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skip First N Results</span>
          <input
            type="number"
            min="0"
            value={form.skipResults}
            onChange={(event) => setForm((prev) => ({ ...prev, skipResults: Number(event.target.value) || 0 }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
          />
        </label>
      </div>
      <label className="mt-4 inline-flex items-start gap-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5">
        <input
          type="checkbox"
          checked={Boolean(form.strictLocation)}
          onChange={(event) => setForm((prev) => ({ ...prev, strictLocation: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Strict city match (exclude nearby areas)
        </span>
      </label>
      <div className="mt-5 flex flex-col md:items-center md:justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Scrapes run in the background. You can leave this page open and import available results anytime.
        </p>
        <button
          type="submit"
          disabled={isStarting}
          className="w-full px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-semibold transition inline-flex items-center justify-center gap-2"
        >
          {isStarting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isStarting ? "Starting..." : "Start Scrape"}
        </button>
      </div>
    </form>
  );
}
