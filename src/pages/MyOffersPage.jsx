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
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
              <BriefcaseBusiness className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              My Lead Offers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review your assigned lead offers, inspect the masked business details, and
              decide whether to accept or reject before the expiry window closes. Once paid, you can qualify a lead to level 3 from its detail page.
            </p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Assigned Offers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {pagination.total}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value,
              page: 1,
            }))
          }
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status || "all"} value={status}>
              {status || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No offers are assigned to your account right now.
          </div>
        ) : (
          offers.map((offer) => (
            <article
              key={offer._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {offer.meta.businessName || "Lead opportunity"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {offer.meta.city || "Unknown city"}, {offer.meta.state || "Unknown state"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[offer.status] || statusClassMap.expired}`}
                >
                  {offer.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Price</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {offer.currency} {Number(offer.price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Qualification</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {offer.meta.appointmentStatus || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {offer.payment?.status || "pending"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  {offer.expiresAt
                    ? new Date(offer.expiresAt).toLocaleString()
                    : "No expiry"}
                </div>
                <Link
                  to={`/client/offers/${offer._id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-cyan-700"
                >
                  View offer
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={filters.page >= (pagination.pages || 1)}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
