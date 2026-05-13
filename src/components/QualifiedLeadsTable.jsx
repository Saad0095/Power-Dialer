import { Search, BadgeDollarSign, User, MapPin, Eye } from "lucide-react";

const QUALIFIED_OPTIONS = [
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
];

const statusClassMap = {
  "qualified-level-1": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "qualified-level-2": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  "qualified-level-3": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

export default function QualifiedLeadsTable({
  leads,
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onCreateOffer,
  onViewLead,
  isLoading,
}) {
  const totalPages = pagination?.pages || 1;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Qualified Leads Pool
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Leads ready to be offered to clients.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  search: event.target.value,
                  page: 1,
                }))
              }
              placeholder="Search leads"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <select
            value={filters.appointmentStatus}
            onChange={(event) =>
              onFiltersChange((prev) => ({
                ...prev,
                appointmentStatus: event.target.value,
                page: 1,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All Qualifications</option>
            {QUALIFIED_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("-", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                {["Business", "Location", "Qualification", "Action"].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No qualified leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const hasOffer = Boolean(lead.currentOffer);
                  const isUnlocked = Boolean(lead.currentOffer?.isUnlocked);
                  const isPaid = lead.currentOffer?.payment?.status === "paid";
                  const hasPaidOffer = Boolean(lead.hasPaidOffer);
                  const allowReplace = hasOffer && !isUnlocked && !isPaid && !hasPaidOffer;
                  const canCreateOffer = (!hasOffer && !hasPaidOffer) || allowReplace;

                  return (
                  <tr key={lead._id} className="bg-white dark:bg-slate-800">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {lead.businessName || "Unnamed lead"}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <User className="h-3 w-3" />
                          <span>{lead.contactName || "No contact name"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{lead.city}, {lead.state}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[lead.appointmentStatus] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"}`}
                      >
                        {lead.appointmentStatus?.replace("-", " ").toUpperCase() || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewLead?.(lead)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          type="button"
                          disabled={!canCreateOffer}
                          onClick={() => onCreateOffer?.(lead, { allowReplace })}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none ${
                            allowReplace
                              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/30"
                              : "bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-500/20"
                          }`}
                        >
                          <BadgeDollarSign className="h-4 w-4" />
                          {allowReplace
                            ? "Reassign Offer"
                            : hasPaidOffer
                              ? "Paid - locked"
                              : "Create Offer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing page {pagination?.page || 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={(pagination?.page || 1) <= 1}
            onClick={() => onPageChange((pagination?.page || 1) - 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={(pagination?.page || 1) >= totalPages}
            onClick={() => onPageChange((pagination?.page || 1) + 1)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
