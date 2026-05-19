import { useEffect, useState } from "react";
import { getClientProfileStats } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers
} from "lucide-react";

export default function ClientProfilePerformanceCard({ clientId }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine active client ID (either passed as prop, or logged in user's ID if role is client)
  const activeClientId = clientId || (user?.role === "client" ? user?._id : null);

  useEffect(() => {
    if (!activeClientId) return;

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getClientProfileStats(activeClientId);
        setStats(data);
      } catch (err) {
        console.error("Failed to load client performance profile:", err);
        setError("Unable to load performance stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [activeClientId]);

  if (!activeClientId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 dark:border-rose-950/20 dark:bg-rose-950/10 p-5 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm font-medium">
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (!stats) return null;

  const client = stats.client || {};
  const offerStats = stats.stats || {};

  const pricingType = client.pricingType || "per-lead";
  const payPerLead = client.payPerLead ?? 150;
  const packageQuantity = client.packageQuantity ?? 0;
  const packageCost = client.packageCost ?? 0;

  const isPackage = pricingType === "package";
  const delivered = offerStats.deliveredCount || 0;
  const packageTotal = packageQuantity;
  const progressPercent = isPackage && packageTotal > 0 
    ? Math.min(100, Math.round((delivered / packageTotal) * 100))
    : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 p-6 shadow-md dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/30">
      
      {/* Decorative Blur Background */}
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-primary-500/10 to-indigo-500/10 blur-2xl"></div>

      {/* Header Info */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/25 text-white">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {client.companyName || client.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Client Account Overview & Delivery Metrics
            </p>
          </div>
        </div>

        {/* Pricing Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm capitalize ${
            isPackage 
              ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/35'
              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/35'
          }`}>
            {isPackage ? <Package size={13} /> : <TrendingUp size={13} />}
            {pricingType === "per-lead" ? "Pay Per Lead" : "Package Plan"}
          </span>

          <span className="inline-flex items-center text-sm font-bold text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-700/40">
            <DollarSign size={14} className="text-slate-400 mr-0.5" />
            {isPackage ? `${packageCost} Total` : `${payPerLead} / Lead`}
          </span>
        </div>
      </div>

      {/* Main Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric: Total Offered / Given */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Offered
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center">
              <Layers size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.leadsGiven || 0}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Leads pushed to queue</p>
          </div>
        </div>

        {/* Metric: Delivered (Paid/Unlocked) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Delivered
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {delivered}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Accepted/unlocked leads</p>
          </div>
        </div>

        {/* Metric: Pending Review */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pending
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.leadsPending || 0}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting unlock decision</p>
          </div>
        </div>

        {/* Metric: Rejected / Not Qualified */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Disqualified
            </span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.leadsRejected || 0}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Rejected or expired offers</p>
          </div>
        </div>

      </div>

      {/* Package Progress Bar */}
      {isPackage && packageTotal > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/10 dark:border-purple-900/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <Package size={14} />
              Package Delivery Progress
            </span>
            <span className="font-bold text-purple-800 dark:text-purple-200">
              {delivered} / {packageTotal} Leads ({progressPercent}%)
            </span>
          </div>
          
          <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div 
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md transition-all duration-500"
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>{packageTotal - delivered} Leads Remaining</span>
            <span>Plan Target: {packageTotal} Leads</span>
          </div>
        </div>
      )}

    </div>
  );
}
