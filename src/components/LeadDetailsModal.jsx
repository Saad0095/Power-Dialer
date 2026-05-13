import { useEffect, useState } from "react";
import Modal from "./common/Modal";

const QUALIFIED_STATUSES = new Set([
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
]);

const FIELD_LABELS = {
  businessName: "Business",
  contactName: "Contact",
  phoneNumber: "Phone",
  email: "Email",
  businessAddress: "Address",
  city: "City",
  state: "State",
  country: "Country",
  appointmentDate: "Appointment Date",
  appointmentTime: "Appointment Time",
  appointmentStatus: "Qualification",
  leadFor: "Lead Type",
  currentSetup: "Current Setup",
  servicesGetting: "Services",
  frequency: "Frequency",
  currentChallenges: "Challenges",
  interestLevel: "Interest Level",
  disposition: "Disposition",
  agentNotes: "Agent Notes",
  managerNotes: "Manager Notes",
};

const FIELD_ORDER = [
  "businessName",
  "contactName",
  "phoneNumber",
  "email",
  "businessAddress",
  "city",
  "state",
  "country",
  "appointmentDate",
  "appointmentTime",
  "appointmentStatus",
  "leadFor",
  "currentSetup",
  "servicesGetting",
  "frequency",
  "currentChallenges",
  "interestLevel",
  "disposition",
  "agentNotes",
  "managerNotes",
];

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not available";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "Not available";
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
};

export default function LeadDetailsModal({
  isOpen,
  lead,
  canManageOffers = false,
  onCreateOffer,
  onClose,
}) {
  if (!isOpen || !lead) return null;

  const [showOfferDetails, setShowOfferDetails] = useState(false);

  const assignedClient = lead.currentOffer?.client;
  const isAssigned = Boolean(assignedClient);
  const assignmentLabel = isAssigned
    ? `${assignedClient.name || "Unnamed client"} (${assignedClient.email || "No email"})`
    : "Not offered yet";
  const assignmentStatus = lead.currentOffer?.status || "not-offered";
  const assignmentUnlocked = lead.currentOffer?.isUnlocked ? "Yes" : "No";
  const assignmentPayment = lead.currentOffer?.payment?.status || "pending";
  const hasOffer = Boolean(lead.currentOffer);
  const isUnlocked = Boolean(lead.currentOffer?.isUnlocked);
  const isPaid = lead.currentOffer?.payment?.status === "paid";
  const hasPaidOffer = Boolean(lead.hasPaidOffer);
  const allowReplace = hasOffer && !isUnlocked && !isPaid && !hasPaidOffer;
  const canCreateOffer = (!hasOffer && !hasPaidOffer) || allowReplace;
  const isQualified = QUALIFIED_STATUSES.has(lead.appointmentStatus);

  useEffect(() => {
    setShowOfferDetails(false);
  }, [lead?._id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lead Details"
      maxWidth="max-w-3xl"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Assignment
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {assignmentLabel}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              Status: {assignmentStatus}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              Unlocked: {assignmentUnlocked}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              Payment: {assignmentPayment}
            </span>
          </div>
        </div>
        {canManageOffers && isQualified && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasOffer && (
              <button
                type="button"
                onClick={() => setShowOfferDetails((prev) => !prev)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {showOfferDetails ? "Hide Offer" : "View Offer"}
              </button>
            )}
            <button
              type="button"
              disabled={!canCreateOffer}
              onClick={() => onCreateOffer?.(lead, { allowReplace })}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
                allowReplace
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-cyan-600 text-white hover:bg-cyan-700"
              }`}
            >
              {allowReplace
                ? "Reassign Offer"
                : hasPaidOffer
                  ? "Paid - locked"
                  : "Create Offer"}
            </button>
          </div>
        )}
      </div>

      {hasOffer && showOfferDetails && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Offer Details
          </p>
          <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              Price: {lead.currentOffer?.currency} {Number(lead.currentOffer?.price || 0).toFixed(2)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              Expires: {lead.currentOffer?.expiresAt ? new Date(lead.currentOffer.expiresAt).toLocaleString() : "No expiry"}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Lead Overview
        </p>
        <div className="mt-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {lead.businessName || "Unnamed lead"}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {lead.city || "Unknown city"}, {lead.state || "Unknown state"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {FIELD_ORDER.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {FIELD_LABELS[key] || key}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
              {formatValue(lead[key])}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}