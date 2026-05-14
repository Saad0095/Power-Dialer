import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { isManager } from "../utils/roleUtils";
import {
  getMonthlyEarningsHistory,
  getDetailedEarningsHistory,
  getAllAgents,
} from "../services/api";
import { FileDown, Calendar, ListFilter, Users } from "lucide-react";
import MonthlySummaryTable from "../components/earnings/MonthlySummaryTable";
import DetailedLogsTable from "../components/earnings/DetailedLogsTable";
import Leaderboard from "../components/Leaderboard";
import Modal from "../components/common/Modal";

export default function EarningsHistoryPage() {
  const { user } = useAuth();
  const isManagerUser = isManager(user?.role);

  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "detailed" | "leaderboard"
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data states
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [selectedAgentForModal, setSelectedAgentForModal] = useState(null);
  const [modalDetailedData, setModalDetailedData] = useState([]);
  const [modalPagination, setModalPagination] = useState({ page: 1, limit: 10, pages: 1 });
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Fetch agents for manager dropdown
  useEffect(() => {
    if (isManagerUser) {
      const fetchAgents = async () => {
        try {
          const fetchedAgents = await getAllAgents();
          setAgents(fetchedAgents);
        } catch (error) {
          console.error("Failed to fetch agents", error);
        }
      };
      fetchAgents();
    }
  }, [isManagerUser]);

  // Fetch data for Monthly Summary
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "monthly") {
          const data = await getMonthlyEarningsHistory({ agentId: selectedAgentId, month: selectedMonth });
          setMonthlyData(data.data || data || []);
        }
      } catch (error) {
        console.error("Failed to fetch earnings history", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedAgentId, selectedMonth]);

  // Fetch detailed logs when modal is open
  useEffect(() => {
    if (selectedAgentForModal) {
      const fetchModalData = async () => {
        setIsModalLoading(true);
        try {
          const response = await getDetailedEarningsHistory({
            agentId: selectedAgentForModal.agentId,
            month: selectedAgentForModal.month,
            page: modalPagination.page,
            limit: modalPagination.limit,
          });
          setModalDetailedData(response.data || []);
          setModalPagination(response.pagination || { page: 1, limit: 10, pages: 1 });
        } catch (error) {
          console.error("Failed to fetch detailed logs for modal", error);
        } finally {
          setIsModalLoading(false);
        }
      };
      fetchModalData();
    }
  }, [selectedAgentForModal?.agentId, selectedAgentForModal?.month, modalPagination.page, modalPagination.limit]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleAgentClick = (agentId, agentName, month) => {
    setSelectedAgentForModal({ agentId, agentName, month });
    setModalPagination({ page: 1, limit: 10, pages: 1 });
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "monthly") {
      csvContent += isManagerUser 
        ? "Month,Agent Name,Power Hour Earnings,Normal Earnings,Total Earnings (PKR),Total Qualifications\n"
        : "Month,Total Qualifications\n";
      monthlyData.forEach((row) => {
        const month = row.month || row._id;
        const agentName = `"${row.agentName || 'N/A'}"`;
        csvContent += isManagerUser
          ? `${month},${agentName},${row.powerHourEarnings || 0},${row.normalEarnings || 0},${row.totalEarnings},${row.totalQualifications}\n`
          : `${month},${row.totalQualifications}\n`;
      });
    } else if (selectedAgentForModal) {
      csvContent += isManagerUser
        ? "Date,Agent Name,Agent Email,Campaign,Lead Business Name,Lead Status,Amount (PKR)\n"
        : "Date,Campaign,Lead Business Name,Lead Status\n";
      modalDetailedData.forEach((row) => {
        const dateStr = new Date(row.earnedAt).toLocaleString();
        const agentName = `"${row.agent?.name || 'N/A'}"`;
        const agentEmail = `"${row.agent?.email || 'N/A'}"`;
        const campaignName = `"${row.campaign?.name || 'N/A'}"`;
        const leadName = `"${row.lead?.businessName || 'N/A'}"`;
        const leadStatus = `"${row.qualificationLevel || row.lead?.appointmentStatus || 'Qualified'}"`;
        const amount = row.amount;

        csvContent += isManagerUser
          ? `${dateStr},${agentName},${agentEmail},${campaignName},${leadName},${leadStatus},${amount}\n`
          : `${dateStr},${campaignName},${leadName},${leadStatus}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `earnings_history_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isManagerUser ? "Earnings History" : "Qualifications History"}
            </h1>
            <p className=" text-slate-500 dark:text-slate-400">
              {isManagerUser
                ? "Monitor and export earnings metrics across all campaigns."
                : "Review your personal past earnings and qualifications history."}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isManagerUser && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <Users className="h-4 w-4 text-slate-400" />
                <select
                  className="bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                  value={selectedAgentId}
                  onChange={(e) => {
                    setSelectedAgentId(e.target.value);
                  }}
                >
                  <option className="dark:bg-slate-800 dark:text-slate-200" value="">All Agents</option>
                  {agents.map((agent) => (
                    <option className="dark:bg-slate-800 dark:text-slate-200" key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <FileDown className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("monthly")}
            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium ${
              activeTab === "monthly"
                ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Monthly Summary
          </button>
          <button
            onClick={() => handleTabChange("leaderboard")}
            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium ${
              activeTab === "leaderboard"
                ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <Users className="h-4 w-4" />
            Leaderboard
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "leaderboard" ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <Leaderboard
            timeframe="month"
            userId={user?._id}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : activeTab === "monthly" ? (
            <MonthlySummaryTable 
              monthlyData={monthlyData} 
              isManagerUser={isManagerUser} 
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAgentClick={handleAgentClick}
            />
          ) : null}
        </div>
      )}

      {/* Agent Detailed Logs Modal */}
      <Modal
        isOpen={!!selectedAgentForModal}
        onClose={() => setSelectedAgentForModal(null)}
        title={`${selectedAgentForModal?.agentName} - Detailed Logs (${selectedAgentForModal?.month})`}
        maxWidth="max-w-6xl"
      >
        {isModalLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                <FileDown className="h-4 w-4" />
                <span>Export Agent Logs</span>
              </button>
            </div>
            <DetailedLogsTable
              detailedData={modalDetailedData}
              isManagerUser={isManagerUser}
              pagination={modalPagination}
              setPagination={setModalPagination}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
