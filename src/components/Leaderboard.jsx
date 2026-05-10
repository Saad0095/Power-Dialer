import { useState, useEffect } from "react";
import { Zap, Users } from "lucide-react";
import { getAgentEarningsLeaderboard } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { isManager } from "../utils/roleUtils";

// Props:
// timeframe: string ("all", "month", "week", "today")
// userId: string (current user id)
// compact: boolean (if true, show only rank card)
const Leaderboard = ({ timeframe = "all", userId, compact = false }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isManagerUser = isManager(user?.role);

  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM format

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await getAgentEarningsLeaderboard({ timeframe, limit: 10, month: selectedMonth });
        setLeaderboard(data.data || data); // ensure we access the array
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe, selectedMonth]);

  const currentRank =
    leaderboard.findIndex((agent) => agent.agentId === userId) + 1 || "N/A";

  if (compact) {
    // Only show the rank card
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Leaderboard Rank</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">#{currentRank}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">in top qualifiers</p>
        </div>
        <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
          <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 mt-6">
      <div className="border-b border-slate-200 p-6 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Top Qualifiers {selectedMonth ? `(${selectedMonth})` : (timeframe === "month" ? "This Month" : timeframe === "week" ? "This Week" : "Period")}
          </h3>
        </div>
        
        {!compact && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors cursor-pointer"
            title="Filter Leaderboard by Month"
          />
        )}
      </div>
      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {leaderboard.map((agent, index) => (
            <div
              key={agent.agentId}
              className={`flex items-center justify-between p-4 ${
                agent.agentId === userId
                  ? "bg-primary-50 dark:bg-primary-900/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    index === 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : index === 1
                        ? "bg-slate-400 text-white dark:bg-slate-600"
                        : index === 2
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <div
                    className={`font-medium flex items-center flex-wrap gap-2 ${
                      agent.agentId === userId
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    <span>
                      {agent.agentName || agent.agentEmail}
                      {agent.agentId === userId && " (You)"}
                    </span>
                    {agent.monthQuals >= 35 && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" title="Monthly Performer (35+ quals this month)">
                        🌟 Monthly Star
                      </span>
                    )}
                    {agent.weekQuals >= 10 && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" title="Weekly Performer (10+ quals this week)">
                        🚀 Weekly Pro
                      </span>
                    )}
                    {agent.todayQuals >= 3 && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" title="Performer of the Day (3+ quals today)">
                        🔥 Daily Hero
                      </span>
                    )}
                  </div>
                  {isManagerUser && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Rs {agent.totalEarnings?.toLocaleString()} earned
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {agent.totalQualifications}
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quals
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;