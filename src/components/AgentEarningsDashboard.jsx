import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { TrendingUp, Award, Zap } from "lucide-react";
import {
  getAgentEarningsSummary,
  getQualificationBreakdown,
} from "../services/api";
import Leaderboard from "./Leaderboard";
import AgentCampaignStats from "./AgentCampaignStats";

const AgentEarningsDashboard = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [timeframe, setTimeframe] = useState("all");

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const data = await getAgentEarningsSummary({ agentId: user._id, timeframe });
        setEarnings(data);
      } catch (error) {
        console.error("Error fetching earnings:", error);
      }
    };
    if (user?._id) fetchEarnings();
  }, [user?._id, timeframe]);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        const data = await getQualificationBreakdown({ agentId: user._id });
        setBreakdown(data);
      } catch (error) {
        console.error("Error fetching breakdown:", error);
      }
    };
    if (user?._id) fetchBreakdown();
  }, [user?._id]);



  return (
    <div className="space-y-8">
      {/* Campaign Stats */}
      {/* <AgentCampaignStats /> */}

      {/* Timeframe selector */}
      <div className="flex gap-2">
        {["all", "month", "week", "today"].map((frame) => (
          <button
            key={frame}
            onClick={() => setTimeframe(frame)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              timeframe === frame
                ? "bg-primary-600 text-white"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            {frame.charAt(0).toUpperCase() + frame.slice(1)}
          </button>
        ))}
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total earnings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Earnings
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                Rs {earnings?.totalEarnings?.toLocaleString() || 0}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                  ⚡ Rs {earnings?.powerHourEarnings?.toLocaleString() || 0}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Normal Rs {earnings?.normalEarnings?.toLocaleString() || 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {timeframe === "all"
                  ? "All time"
                  : timeframe === "month"
                    ? "This month"
                    : timeframe === "week"
                      ? "This week"
                      : "Today"}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Qualifications count */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Qualifications
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {earnings?.totalQualifications || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                leads qualified
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Leaderboard Rank */}
        <Leaderboard timeframe={timeframe} userId={user?._id} compact />
      </div>

      {/* Qualification breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Breakdown by Level
          </h3>
          <div className="space-y-3">
            {breakdown.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {item._id || "Unqualified"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.count} qualification{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Rs {item.totalEarnings?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rs {(item.totalEarnings / item.count).toFixed(0)} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <Leaderboard timeframe={timeframe} userId={user?._id} />
    </div>
  );
};

export default AgentEarningsDashboard;
