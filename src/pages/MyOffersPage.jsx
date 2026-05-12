import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Clock3 } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { getClientOffers } from "../services/api";

const STATUS_OPTIONS = ["", "offered", "paid", "expired", "cancelled"];

const statusClassMap = {
  offered: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  expired: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export default function MyOffersPage() {
  const { showNotification } = useOutletContext();
  const [filters, setFilters] = useState({ status: "", page: 1, limit: 8 });
  const [offers, setOffers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClientOffers(filters);
      setOffers(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load client offers", error);
      showNotification("Failed to load your offers", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, showNotification]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white">
              <BriefcaseBusiness className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                My Appointments
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage and track your assigned offers
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Assigned Offers
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {pagination.total}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))
          }
          className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status || "all"} value={status}>
              {status || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Business
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Location
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Price
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Payment
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expires
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading offers...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No offers are assigned to your account right now.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr
                    key={offer._id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      {offer.meta.businessName || "Lead opportunity"}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {offer.meta.city || "Unknown city"}, {offer.meta.state || "Unknown state"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {offer.currency} {Number(offer.price || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 capitalize">
                      {offer.payment?.status || "pending"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[offer.status] || statusClassMap.expired}`}>
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        {offer.expiresAt
                          ? new Date(offer.expiresAt).toLocaleString()
                          : "No expiry"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/client/offers/${offer._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30 px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
                      >
                        View
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Page {pagination.page} of {pagination.pages || 1}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
            }
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={filters.page >= (pagination.pages || 1)}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}