import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  getClientOffer,
  getAllowedQualifications,
  updateQualification,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

const statusClassMap = {
  offered:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  expired: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

const leadFieldOrder = [
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
  "agentNotes",
  "managerNotes",
  "recordingLink",
];

const leadFieldLabels = {
  businessName: "Business Name",
  contactName: "Contact Name",
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
  agentNotes: "Agent Notes",
  managerNotes: "Manager Notes",
  recordingLink: "Recording Link",
};

const formatLeadValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not available";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "Not available";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function LeadDetailPage() {
  const { hydrateAuth } = useAuth();
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useOutletContext();
  const [offer, setOffer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [qualificationOptions, setQualificationOptions] = useState([]);
  const [isUpdatingQualification, setIsUpdatingQualification] = useState(false);

  const loadOffer = async () => {
    setIsLoading(true);
    try {
      const data = await getClientOffer(offerId);
      setOffer(data);

      if (data?.meta?.leadId && data?.isUnlocked) {
        try {
          const qualificationData = await getAllowedQualifications(
            data.meta.leadId,
          );
          setQualificationOptions(qualificationData.allowedNextStatuses || []);
        } catch {
          setQualificationOptions([]);
        }
      } else {
        setQualificationOptions([]);
      }
    } catch (error) {
      console.error("Failed to load lead", error);
      showNotification("Failed to load lead", "error");
      navigate("/client/leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffer();
  }, [offerId, showNotification, navigate]);

  const executeAction = async (handler, successMessage) => {
    setIsActioning(true);
    try {
      const data = await handler(offerId);
      const nextOffer = data.offer || data;
      setOffer(nextOffer);
      showNotification(successMessage, "success");
    } catch (error) {
      console.error("Lead action failed", error);
      showNotification(
        error.response?.data?.error || "Lead action failed",
        "error",
      );
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        Loading lead...
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const canClientQualify =
    offer.isUnlocked && qualificationOptions.includes("qualified-level-3");
  const leadPreview = offer.leadPreview || {};
  const leadEntries = leadFieldOrder
    .map((key) => ({
      key,
      label: leadFieldLabels[key] || key,
      value: leadPreview[key],
    }))
    .filter(({ value }) => value !== undefined && value !== null && value !== "");

  const handleQualificationUpdate = async (
    qualificationStatus = "qualified-level-3",
  ) => {
    setIsUpdatingQualification(true);
    try {
      await updateQualification(offer.meta.leadId, {
        appointmentStatus: qualificationStatus,
      });
      await loadOffer();
      await hydrateAuth?.();
      showNotification("Lead Qualified Successfully!", "success");
    } catch (error) {
      console.error("Failed to update qualification", error);
      showNotification(
        error.response?.data?.error || "Failed to update qualification",
        "error",
      );
    } finally {
      setIsUpdatingQualification(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/client/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[offer.status] || statusClassMap.expired}`}
        >
          {offer.status}
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-emerald-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {offer.meta.businessName || "Lead opportunity"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {offer.isUnlocked
                ? "Full contact details have been unlocked and are visible below."
                : "Complete payment to unlock full details. Only the masked data is visible below."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Price
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {offer.currency} {Number(offer.price || 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Expires
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {offer.expiresAt
                    ? new Date(offer.expiresAt).toLocaleString()
                    : "No expiry"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Qualification
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {offer.meta.appointmentStatus || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Interest level
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {offer.meta.interestLevel || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Payment
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {offer.payment?.status || "pending"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Region
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {offer.meta.city}, {offer.meta.state}, {offer.meta.country}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <p>
                  {offer.isUnlocked
                    ? "Full lead information is now unlocked."
                    : "Only the fields configured in the offer are visible below, with masking still enforced."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Visible Lead Data
          </h2>
          {leadEntries.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No lead details are available yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {leadEntries.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {key === "recordingLink" && typeof value === "string" && value ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
                      >
                        Open recording
                      </a>
                    ) : (
                      formatLeadValue(value)
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Lead Actions
          </h2>
          <div className="mt-5 space-y-3">
            {/* <button
              type="button"
              disabled={!canAct || isActioning}
              onClick={() => executeAction(acceptClientOffer, "Offer accepted")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Accept Offer
            </button>

            <button
              type="button"
              disabled={!canAct || isActioning}
              onClick={() => executeAction(rejectClientOffer, "Offer rejected")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <XCircle className="h-4 w-4" />
              Reject Offer
            </button> */}

            {canClientQualify && (
              <>
                {/* <select
                  value={qualificationStatus}
                  onChange={(event) => setQualificationStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value={offer.meta.appointmentStatus || ""}>
                    {offer.meta.appointmentStatus || "Current qualification"}
                  </option>
                  {qualificationOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select> */}

                <button
                  type="button"
                  onClick={() => handleQualificationUpdate()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl text-lg font-bold bg-emerald-50 px-4 py-3  text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50  dark:bg-green-500 dark:text-white"
                >
                  {isUpdatingQualification
                    ? "Updating..."
                    : "Mark as Qualified"}
                </button>
              </>
            )}
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {offer.expiresAt
                ? `Access expires on ${new Date(offer.expiresAt).toLocaleString()}.`
                : "This lead has no expiry date."}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}