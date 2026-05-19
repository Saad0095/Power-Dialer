import React, { useState, useEffect } from "react";
import { X, LoaderCircle, Save } from "lucide-react";
import { updateScrapeSession } from "../../services/api";

export default function EditSessionModal({ isOpen, session, onClose, onSuccess, showNotification }) {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(100);
  const [skipResults, setSkipResults] = useState(0);
  const [strictLocation, setStrictLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setBusinessType(session.businessType || "");
      setLocation(session.location || "");
      setMaxResults(session.maxResults ?? 100);
      setSkipResults(session.skipResults ?? 0);
      setStrictLocation(session.strictLocation ?? true);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      showNotification?.("Business type and location are required", "error");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        businessType: businessType.trim(),
        location: location.trim(),
        maxResults: Number(maxResults),
        skipResults: Number(skipResults) || 0,
        strictLocation: Boolean(strictLocation),
      };

      const updated = await updateScrapeSession(session._id, payload);
      showNotification?.("Scrape job queue item updated successfully", "success");
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      console.error("Failed to update queued session:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to update queued session";
      showNotification?.(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Edit Queued Scrape Job
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Business Type
              </span>
              <input
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder='e.g. "cleaning company"'
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='e.g. "Houston, Texas"'
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Max Results
              </span>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-sm"
              >
                {[20, 40, 60, 100, 120, 150].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Skip First N Results
              </span>
              <input
                type="number"
                min="0"
                value={skipResults}
                onChange={(e) => setSkipResults(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-sm"
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3">
            <input
              type="checkbox"
              checked={strictLocation}
              onChange={(e) => setStrictLocation(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <div>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                Strict city match
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Exclude nearby areas outside of the target location.
              </span>
            </div>
          </label>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white text-sm font-semibold transition inline-flex items-center gap-2"
            >
              {isSaving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
