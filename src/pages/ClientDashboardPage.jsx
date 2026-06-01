import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Clock3,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { getClientOffers } from "../services/api";
import ClientProfilePerformanceCard from "../components/ClientProfilePerformanceCard";

const statusClassMap = {
  offered:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  expired: "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

const summaryCards = [
  { key: "offered", label: "Open Leads", icon: BriefcaseBusiness },
  { key: "paid", label: "Unlocked Leads", icon: BadgeDollarSign },
  { key: "expired", label: "Expired", icon: Clock3 },
];

export default function ClientDashboardPage() {
  const { showNotification } = useOutletContext();
  const [summary, setSummary] = useState({});
  const [recentOffers, setRecentOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recent, ...totals] = await Promise.all([
        getClientOffers({ page: 1, limit: 4 }),
        ...summaryCards.map((card) =>
          getClientOffers({ status: card.key, page: 1, limit: 1 }),
        ),
      ]);

      const nextSummary = {};
      totals.forEach((data, index) => {
        nextSummary[summaryCards[index].key] = data.pagination?.total || 0;
      });

      setSummary(nextSummary);
      setRecentOffers(recent.items || []);
    } catch (error) {
      console.error("Failed to load client dashboard", error);
      showNotification("Failed to load dashboard", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-8 shadow-lg dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white">
              <BriefcaseBusiness className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Client Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track your leads, payment status, and lead activity at
                a glance.
              </p>
            </div>
          </div>
          <Link
            to="/client/leads"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30 px-3.5 py-2 font-semibold text-white transition hover:opacity-90 cursor-pointer"
          >
            View all leads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ClientProfilePerformanceCard />

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {summary[card.key] ?? (isLoading ? "..." : 0)}
                  </p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Recent Leads
          </h2>
          <Link
            to="/client/leads"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-200"
          >
            See all
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {isLoading ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading leads...
            </div>
          ) : recentOffers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No leads yet. New leads will appear here when assigned.
            </div>
          ) : (
            recentOffers.map((offer) => (
              <article
                key={offer._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {offer.meta.businessName || "Lead opportunity"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {offer.meta.city || "Unknown city"},{" "}
                      {offer.meta.state || "Unknown state"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusClassMap[offer.status] || statusClassMap.expired
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    {offer.expiresAt
                      ? new Date(offer.expiresAt).toLocaleString()
                      : "No expiry"}
                  </div>
                  <Link
                    to={`/client/leads/${offer._id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    View
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
