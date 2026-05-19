import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { getCallerVisibleFields } from "../../utils/leadFieldConfig.js";
import Modal from "../common/Modal.jsx";
import { getLead, unlockManagerOffer } from "../../services/api.js";
import {
  Edit3,
  ListChecks,
  User2,
  BadgeDollarSign,
  Unlock,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  dialing: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  connected: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  failed: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  completed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  new: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  contacted: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  interested: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  not_interested: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  callback: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  converted: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
  closed: "bg-slate-600/20 text-slate-700 dark:text-slate-300",
  qualified: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  disqualified: "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  "in-process": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  reschedule: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  onhold: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
};

const DISPOSITION_COLORS = {
  voicemail: "bg-slate-500/20 text-slate-700 dark:text-slate-400",
  followup: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  "not-interested": "bg-rose-500/20 text-rose-700 dark:text-rose-400",
  appointment: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  "wrong-number": "bg-orange-500/20 text-orange-700 dark:text-orange-400",
};

const QUALIFIED_STATUSES = new Set([
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
]);

export default function LeadDetailModal({
  isOpen,
  leadId,
  onClose,
  onStatusUpdate,
  onEditLead,
  onCreateOffer,
}) {
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const { user } = useAuth();
  const visibleFields = getCallerVisibleFields(user?.role);
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const loadLead = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLead(leadId);
      setLead(data);
    } catch (error) {
      console.error("Failed to load lead:", error);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isOpen && leadId) {
      loadLead();
    }
  }, [isOpen, leadId, loadLead]);

  useEffect(() => {
    const handleUpdate = (event) => {
      // Refresh if the modal is open and either no specific ID was provided or it matches our lead
      if (isOpen && leadId && (!event.detail?.leadId || event.detail.leadId === leadId)) {
        loadLead();
      }
    };

    window.addEventListener("lead:updated", handleUpdate);
    return () => window.removeEventListener("lead:updated", handleUpdate);
  }, [isOpen, leadId, loadLead]);

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Lead Details">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-400 border-b-2"></div>
        </div>
      </Modal>
    );
  }

  if (!lead) return null;

  const isManager = user?.role === "manager";
  const hasOffer = Boolean(lead.currentOffer);
  const hasEverBeenOffered = Boolean(lead.hasEverBeenOffered);
  const canCreateOffer =
    !hasOffer &&
    !hasEverBeenOffered &&
    onCreateOffer &&
    QUALIFIED_STATUSES.has(lead.appointmentStatus);
  const canUnlockOffer =
    hasOffer &&
    lead.currentOffer.status === "offered" &&
    !lead.currentOffer.isUnlocked &&
    (user?.role === "admin" || user?.role === "manager");

  const handleUnlockOffer = async () => {
    if (
      !window.confirm(
        "Unlock this offer? The client will be granted full access immediately.",
      )
    )
      return;
    setIsActioning(true);
    try {
      await unlockManagerOffer(lead.currentOffer._id);
      await loadLead(); // Refresh the lead data
      window.dispatchEvent(new CustomEvent("lead:updated", { detail: { leadId: lead._id } }));
    } catch (error) {
      console.error("Failed to unlock offer", error);
      alert(error.response?.data?.error || "Failed to unlock offer");
    } finally {
      setIsActioning(false);
    }
  };

  const renderFieldValue = (key, value) => {
    if (!value) return "—";
    if (key === "lastDialedAt" || key.endsWith("At")) {
      const d = new Date(value);
      return !isNaN(d.getTime())
        ? d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
    }
    if (key.includes("Date") || key.includes("date")) {
      const d = new Date(value);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString()
        : "—";
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (key === "recordingLink") {
      try {
        const url = String(value).trim();
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 hover:underline"
          >
            {url}
          </a>
        );
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      {/* Modal Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="bg-cyan-100 dark:bg-cyan-900/40 rounded-full p-2 shadow-sm">
          <User2 className="w-7 h-7 text-cyan-600 dark:text-cyan-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {lead.businessName || "Lead Details"}
          </h2>
          {lead.contactName && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Contact:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {lead.contactName}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Status & Disposition Badges */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-start">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border border-slate-200 dark:border-slate-700 mb-1 ${STATUS_COLORS[lead.dialerStatus] || "bg-slate-600/20 text-slate-700 dark:text-slate-300"}`}
          >
            {lead.dialerStatus}
          </span>
          <span className="text-xs text-slate-500">Dialer Status</span>
        </div>
        {lead.appointmentStatus && (
          <div className="flex flex-col items-start">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border border-slate-200 dark:border-slate-700 mb-1 ${STATUS_COLORS[lead.appointmentStatus] || "bg-slate-600/20 text-slate-700 dark:text-slate-300"}`}
            >
              {lead.appointmentStatus}
            </span>
            <span className="text-xs text-slate-500">Appointment Status</span>
          </div>
        )}
        {lead.disposition && (
          <div className="flex flex-col items-start">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border border-slate-200 dark:border-slate-700 mb-1 ${DISPOSITION_COLORS[lead.disposition] || "bg-slate-600/20 text-slate-700 dark:text-slate-300"}`}
            >
              {lead.disposition}
            </span>
            <span className="text-xs text-slate-500">Disposition</span>
          </div>
        )}
        {isManager && (
          <div className="flex flex-col items-start">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border border-slate-200 dark:border-slate-700 mb-1 ${lead.wasPowerHour ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-slate-500/20 text-slate-700 dark:text-slate-300"}`}
            >
              {lead.wasPowerHour ? "Power Hour" : "Normal Call"}
            </span>
            <span className="text-xs text-slate-500">
              Qualification Scenario
            </span>
          </div>
        )}
        {hasOffer && (
          <div className="flex flex-col items-start">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border border-slate-200 dark:border-slate-700 mb-1 ${lead.currentOffer.isUnlocked ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/20 text-rose-700 dark:text-rose-400"}`}
            >
              {lead.currentOffer.isUnlocked ? "Unlocked" : "Locked"}
            </span>
            <span className="text-xs text-slate-500">Client Access</span>
          </div>
        )}
      </div>

      {/* Fields Grid - Role-based */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pr-1 mb-8">
        {visibleFields.map((field, idx) => {
          // Always show manager-only fields for managers even if empty
          const value = lead[field.key];
          if (
            user?.role !== "manager" &&
            (!value || (typeof value === "string" && value.trim() === ""))
          )
            return null;
          return (
            <div
              key={field.key}
              className="space-y-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">
                {field.label}
              </p>
              {field.type === "textarea" ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {renderFieldValue(field.key, value)}
                </p>
              ) : (
                <p className="text-base font-medium text-slate-900 dark:text-white">
                  {renderFieldValue(field.key, value)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end mt-2 pt-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 rounded-b-lg">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          Close
        </button>
        {onEditLead && (
          <button
            onClick={() => onEditLead(lead)}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {onStatusUpdate &&
          (user?.role === "manager" || user?.role === "admin" || user?.role === "team-lead") && (
            <button
              onClick={() => onStatusUpdate?.(lead)}
              className="px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <ListChecks className="w-4 h-4" />
              Update Qualification
            </button>
          )}
        {canCreateOffer && (
          <button
            onClick={() => onCreateOffer?.(lead)}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <BadgeDollarSign className="w-4 h-4" />
            Create Offer
          </button>
        )}
        {canUnlockOffer && (
          <button
            onClick={handleUnlockOffer}
            disabled={isActioning}
            className="px-5 py-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-emerald-300 disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            {isActioning ? "Unlocking..." : "Unlock Offer"}
          </button>
        )}
      </div>
    </Modal>
  );
}
