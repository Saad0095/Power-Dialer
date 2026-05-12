import { useState } from "react";
import { Ban, Clock3, CreditCard, Search, Unlock } from "lucide-react";
import { cancelManagerOffer, unlockManagerOffer } from "../services/api";
import ConfirmModal from "./common/ConfirmModal";

const STATUS_OPTIONS = ["offered", "paid", "expired", "cancelled"];

const statusClassMap = {
  offered: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  expired: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export default function OffersManagementTable({
  offers,
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onOfferCancelled,
  showNotification,
  isLoading,
}) {
  const [offerToCancel, setOfferToCancel] = useState(null);
  const [offerToUnlock, setOfferToUnlock] = useState(null);
  const totalPages = pagination?.pages || 1;

  const handleCancel = async () => {
    if (!offerToCancel?._id) return;

    try {
      const cancelled = await cancelManagerOffer(offerToCancel._id);
      showNotification?.("Offer cancelled", "success");
      onOfferCancelled?.(cancelled);
    } catch (error) {
      console.error("Failed to cancel offer", error);
      showNotification?.(
        error.response?.data?.error || "Failed to cancel offer",
        "error",
      );
    } finally {
      setOfferToCancel(null);
    }
  };

  const handleUnlock = async () => {
    if (!offerToUnlock?._id) return;

    try {
      const unlocked = await unlockManagerOffer(offerToUnlock._id);
      showNotification?.("Offer unlocked successfully", "success");
      onOfferCancelled?.(unlocked); // Reuse the callback to update list
    } catch (error) {
      console.error("Failed to unlock offer", error);
      showNotification?.(
        error.response?.data?.error || "Failed to unlock offer",
        "error",
      );
    } finally {
      setOfferToUnlock(null);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Offers Management
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Offered leads are shown first so managers can actively manage live marketplace inventory.
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
              placeholder="Search lead or client"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <select
            value={filters.status}
            onChange={(event) =>
              onFiltersChange((prev) => ({
                ...prev,
                status: event.target.value,
                page: 1,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
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
                {["Lead", "Client", "Status", "Price", "Expiry", "Payment", "Action"].map((label) => (
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
                  <td colSpan="7" className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading offers...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                    No offers found for the current filters.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer._id} className="bg-white dark:bg-slate-800">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {offer.lead.businessName || "Unnamed lead"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {offer.lead.city}, {offer.lead.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {offer.client.name || "Unnamed client"}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {offer.client.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[offer.status] || statusClassMap.expired}`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {offer.currency} {Number(offer.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        {offer.expiresAt
                          ? new Date(offer.expiresAt).toLocaleString()
                          : "No expiry"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        {offer.payment?.status || "pending"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {offer.status === "offered" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOfferToUnlock(offer)}
                            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                          >
                            <Unlock className="h-4 w-4" />
                            Unlock
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfferToCancel(offer)}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200"
                          >
                            <Ban className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
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

      <ConfirmModal
        isOpen={Boolean(offerToCancel)}
        title="Cancel offer"
        message={`Cancel the offer for ${offerToCancel?.lead?.businessName || "this lead"}? The client will no longer be able to pay it.`}
        onConfirm={handleCancel}
        onCancel={() => setOfferToCancel(null)}
        danger
      />

      <ConfirmModal
        isOpen={Boolean(offerToUnlock)}
        title="Unlock offer"
        message={`Unlock the offer for ${offerToUnlock?.lead?.businessName || "this lead"}? The client will be granted full access to the unmasked data immediately.`}
        onConfirm={handleUnlock}
        onCancel={() => setOfferToUnlock(null)}
      />
    </div>
  );
}
