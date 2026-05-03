import React, { useState, useEffect } from "react";
import { getAgentCampaignStats } from "../services/api";
import { Phone, BarChart2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const AgentCampaignStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAgentCampaignStats();
      setStats(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching campaign stats:", err);
      setError("Failed to load campaign statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin mr-3" />
        <span className="text-slate-600 dark:text-slate-400 font-medium">Loading campaign stats...</span>
      </div>
    );
  }

  if (error && stats.length === 0) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/30 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500" />
        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        <button onClick={fetchStats} className="ml-auto text-xs font-bold text-rose-600 underline">Retry</button>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Phone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Assigned Campaigns</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">You aren't assigned to any active campaigns currently.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary-500" />
          Campaign Performance
        </h3>
        <button onClick={fetchStats} className="text-xs font-bold text-primary-600 hover:text-primary-700">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((campaign) => (
          <div 
            key={campaign._id}
            className={`relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-200 ${
              campaign.isCompleted 
                ? 'border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/5' 
                : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
            }`}
          >
            {campaign.isCompleted && (
              <div className="absolute top-0 right-0">
                <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                  Completed
                </div>
              </div>
            )}

            <h4 className="font-bold text-slate-900 dark:text-white mb-4 line-clamp-1 pr-16">
              {campaign.name}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dialed Today</p>
                <p className="text-xl font-black text-primary-600 dark:text-primary-400">{campaign.dialedToday}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending</p>
                <p className="text-xl font-black text-slate-700 dark:text-slate-300">{campaign.pendingLeads}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 min-w-[80px]">
                  <div 
                    className={`h-1.5 rounded-full ${campaign.isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min(100, (campaign.totalLeads - campaign.pendingLeads) / (campaign.totalLeads || 1) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {Math.round(((campaign.totalLeads - campaign.pendingLeads) / (campaign.totalLeads || 1)) * 100)}%
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                {campaign.totalLeads} Total
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentCampaignStats;
