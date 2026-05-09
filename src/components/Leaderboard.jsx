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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await getAgentEarningsLeaderboard({ timeframe, limit: 5 });
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe]);

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
      <div className="border-b border-slate-200 p-6 dark:border-slate-700 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Top Qualifiers This {timeframe === "month" ? "Month" : timeframe === "week" ? "Week" : "Period"}
        </h3>
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
                  <p
                    className={`font-medium ${
                      agent.agentId === userId
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {agent.agentName || agent.agentEmail}
                    {agent.agentId === userId && " (You)"}
                  </p>
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