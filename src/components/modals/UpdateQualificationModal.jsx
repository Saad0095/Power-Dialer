import { useState, useEffect } from "react";
import Modal from "../common/Modal.jsx";
import { updateQualification, getAllowedQualifications } from "../../services/api.js";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";

const ALL_QUALIFICATION_OPTIONS = [
  { value: "qualified-level-1", label: "Qualified - Level 1", level: 1 },
  { value: "qualified-level-2", label: "Qualified - Level 2", level: 2 },
  { value: "qualified-level-3", label: "Qualified - Level 3", level: 3 },
  { value: "disqualified", label: "Disqualified", level: 0 },
  { value: "in-process", label: "In Process", level: 0 },
  { value: "reschedule", label: "Reschedule", level: 0 },
  { value: "onhold", label: "On Hold", level: 0 },
];

export default function UpdateQualificationModal({
  isOpen,
  lead,
  onClose,
  onSuccess,
  onError,
}) {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [managerNotes, setManagerNotes] = useState(lead?.managerNotes || "");
  const [recordingLink, setRecordingLink] = useState(lead?.recordingLink || "");
  const [callQuality, setCallQuality] = useState(lead?.callQuality || "");

  useEffect(() => {
    const fetchAllowedStatuses = async () => {
      if (!lead?._id) return;

      try {
        const data = await getAllowedQualifications(lead._id);
        setAllowedStatuses(data.allowedNextStatuses);
        setCurrentLevel(data.currentStatus);
      } catch (error) {
        console.error("Error fetching allowed qualifications:", error);
        if (onError && typeof onError === 'function') {
          onError("Failed to load allowed qualifications");
        }
      }
    };

    if (isOpen && lead) {
      setStatus(lead.appointmentStatus || "");
      setManagerNotes(lead?.managerNotes || "");
      setRecordingLink(lead?.recordingLink || "");
      setCallQuality(lead?.callQuality || "");
      setValidationError(null);
      fetchAllowedStatuses();
    }
  }, [lead, isOpen]); 

  const filterQualificationOptions = () => {
    const allowed = new Set([...allowedStatuses, lead?.appointmentStatus].filter(Boolean));
    return ALL_QUALIFICATION_OPTIONS.filter((option) => allowed.has(option.value));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);

    if (newStatus === lead?.appointmentStatus || newStatus === "") {
      setValidationError(null);
      return;
    }

    if (!allowedStatuses.includes(newStatus)) {
      setValidationError(
        `You cannot select ${newStatus}. This lead must progress sequentially.`
      );
    } else {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lead) return;

    if (status !== lead?.appointmentStatus && status !== "" && (validationError || !allowedStatuses.includes(status))) {
      onError?.("Cannot update to this status. Qualification must be sequential.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {};
      if (status !== lead?.appointmentStatus) {
        payload.appointmentStatus = status;
      }
      if (managerNotes !== undefined) payload.managerNotes = managerNotes;
      if (recordingLink !== undefined) payload.recordingLink = recordingLink;
      if (callQuality !== undefined) payload.callQuality = callQuality;
      
      const updated = await updateQualification(lead._id, payload);
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || error.message || "Failed to update qualification";
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const availableOptions = filterQualificationOptions();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Qualification - ${lead?.businessName || "N/A"}`}
      maxWidth="max-w-md"
      breakSafe={true}
    >
      <form onSubmit={handleSubmit}>
        {/* Lead info */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Lead Details
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {lead?.businessName}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {lead?.phoneNumber}
          </p>
          {lead?.appointmentStatus && (
            <p className="mt-2 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Current Status:{" "}
              </span>
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                  lead.appointmentStatus.startsWith("qualified")
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {lead.appointmentStatus.replace(/-/g, " ").toUpperCase()}
              </span>
            </p>
          )}
        </div>

        {/* Current level info */}
        {currentLevel && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
              ℹ️ Sequential Qualification Required
            </p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              Leads must progress through levels: L1 → L2 → L3. You cannot skip
              levels.
            </p>
          </div>
        )}

        {/* Status selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Next Status
            {allowedStatuses.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                ({allowedStatuses.length} option{allowedStatuses.length !== 1 ? "s" : ""})
              </span>
            )}
          </label>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={availableOptions.length === 0}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition appearance-none bg-white dark:bg-slate-900 bg-clip-padding pr-10 ${
              validationError
                ? "border-red-300 bg-red-50 text-red-900 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/20 dark:text-red-100"
                : "border-slate-300 text-slate-900 focus:border-primary-500 focus:ring-primary-500/20 dark:border-slate-700 dark:text-slate-100"
            }`}
          >
            <option value="">Select a status...</option>
            {availableOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {availableOptions.length === 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              ⚠️ This lead cannot be further updated.
            </p>
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Invalid Selection
                </p>
                <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                  {validationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {!validationError && status && allowedStatuses.includes(status) && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Valid Update
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Allowed transitions info */}
        {allowedStatuses.length > 0 && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Allowed transitions:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allowedStatuses.map((s) => (
                <span
                  key={s}
                  className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                >
                  {s.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        {/* Manager notes + recording link (admin/manager only) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Manager Notes</label>
          <textarea
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="Internal notes for this qualification"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Recording Link</label>
          <input
            value={recordingLink}
            onChange={(e) => setRecordingLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Call Quality</label>
          <select
            value={callQuality}
            onChange={(e) => setCallQuality(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition appearance-none bg-white dark:bg-slate-900 bg-clip-padding pr-10"
          >
            <option value="">Not Rated</option>
            <option value="average">Average</option>
            <option value="below-average">Below Average</option>
            <option value="best">Best</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition font-medium text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isLoading ||
              validationError ||
              (status !== lead?.appointmentStatus && status !== "" && !allowedStatuses.includes(status)) ||
              (status === lead?.appointmentStatus &&
                managerNotes === (lead?.managerNotes || "") &&
                recordingLink === (lead?.recordingLink || "") &&
                callQuality === (lead?.callQuality || ""))
            }
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 cursor-pointer"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            {isLoading ? "Updating..." : "Confirm Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}