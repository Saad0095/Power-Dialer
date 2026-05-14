import { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  Eye,
  Edit3,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useLeads } from "../hooks/useLeads";
import { useAuth } from "../hooks/useAuth";
import { getTableColumns } from "../utils/leadFieldConfig";
import LeadDetailModal from "./modals/LeadDetailModal.jsx";
import EditLeadModal from "./modals/EditLeadModal.jsx";
import UpdateQualificationModal from "./modals/UpdateQualificationModal.jsx";
import ConfirmModal from "./common/ConfirmModal.jsx";
import { deleteLead } from "../services/api";

import { triggerCelebration } from "../utils/celebration";
const DIALER_STATUSES = [
  "pending",
  "dialing",
  "connected",
  "failed",
  "completed",
];
// For filtering leads by technical state (dialerStatus)
const STATUSES = DIALER_STATUSES;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function LeadsTable({ showNotification, activeCalls = [] }) {
  const {
    leads,
    isLoading,
    pagination,
    filters,
    changePage,
    changePageSize,
    setSearch,
    setStatus,
    setDisposition,
    setInterestLevel,
    setAgentId,
    deleteSingleLead,
    deleteMultipleLeads,
    updateLead,
  } = useLeads();

  const { user } = useAuth();
  const tableColumns = getTableColumns(user?.role);
  const canExport = ["admin", "manager"].includes(user?.role);

  const [searchInput, setSearchInput] = useState("");
  const [agents, setAgents] = useState([]);

  // Local state for modals
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const canUpdateQualification = ["admin", "manager"].includes(user?.role);
  const canEditDisposition = user?.role === "caller-agent";

  // Modal handlers
  const handleViewLead = (leadId) => {
    setSelectedLeadId(leadId);
    setShowDetailModal(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLeadForEdit(lead);
    setShowEditModal(true);
  };

  const handleEditSave = (updated) => {
    updateLead(updated);
    showNotification("Lead updated successfully", "success");

    if (user?.role != "manager" && updated?.disposition === "appointment") {
      triggerCelebration();
    }
    setShowEditModal(false);
    window.dispatchEvent(new CustomEvent("lead:updated", { detail: { leadId: updated._id } }));
  };

  const handleUpdateStatus = (leadId) => {
    const lead = leads.find((l) => l._id === leadId);
    setSelectedLeadForStatus(lead);
    setShowStatusModal(true);
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      await deleteLead(leadToDelete._id);
      deleteSingleLead(leadToDelete._id);
      showNotification("Lead deleted successfully", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to delete lead",
        "error",
      );
    } finally {
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    }
  };

  const handleStatusUpdateSuccess = (updated) => {
    updateLead(updated);
    showNotification("Qualification updated successfully", "success");
    setShowStatusModal(false);
    window.dispatchEvent(new CustomEvent("lead:updated", { detail: { leadId: updated._id } }));
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(leads.map((lead) => lead._id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (leadId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedRows(newSelection);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      showNotification("Please select leads to delete", "error");
      return;
    }
    setLeadToDelete({ _id: "bulk", count: selectedRows.size });
    setShowDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await Promise.all(
        Array.from(selectedRows).map((leadId) => deleteLead(leadId)),
      );
      deleteMultipleLeads(selectedRows);
      setSelectedRows(new Set());
      showNotification(
        `${selectedRows.size} lead(s) deleted successfully`,
        "success",
      );
    } catch {
      showNotification("Failed to delete some leads", "error");
    } finally {
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    }
  };

  const handleExport = async () => {
    if (!canExportLeads) {
      showNotification("You are not allowed to export leads", "error");
      return;
    }

    try {
      const fileName = `caller-leads-${new Date().toISOString().split("T")[0]}.csv`;
      const csvHeaders = [
        "businessName",
        "contactName",
        "phoneNumber",
        "email",
        "city",
        "state",
        "country",
        "dialerStatus",
        "disposition",
        "appointmentStatus",
        "assignedCaller",
      ];

      const csvLines = [
        csvHeaders.join(","),
        ...leads.map((lead) =>
          csvHeaders
            .map((header) => {
              const value =
                header === "assignedCaller"
                  ? lead.assignedCaller?.name ||
                    lead.assignedCaller?.email ||
                    ""
                  : (lead[header] ?? "");
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification("Leads exported successfully", "success");
    } catch (error) {
      showNotification(
        error?.response?.data?.error || "Failed to export leads",
        "error",
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  // Extract unique agents from leads for manager filter
  useEffect(() => {
    const uniqueAgents = new Map();
    leads.forEach((lead) => {
      if (lead.assignedCaller && lead.assignedCaller._id) {
        const agent = lead.assignedCaller;
        uniqueAgents.set(agent._id, {
          _id: agent._id,
          name: agent.name || agent.email,
          email: agent.email,
        });
      }
    });
    setAgents(
      Array.from(uniqueAgents.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
  }, [leads]);

  // Pagination calculation
  const totalLeads = pagination.total || leads.length;
  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;
  const pageSize = pagination.limit || 20;
  const startLead = (currentPage - 1) * pageSize + 1;
  const endLead = Math.min(currentPage * pageSize, totalLeads);

  const activeCallLeadIds = new Set(
    activeCalls
      .map((call) => String(call.leadId || call.lead?._id || ""))
      .filter(Boolean),
  );

  const nextPendingLeadId = leads.find(
    (l) => l.dialerStatus === "pending",
  )?._id;

  // Helper function to render cell value based on column key
  const renderCellValue = (lead, columnKey) => {
    switch (columnKey) {
      case "businessName":
        const businessName = lead.businessName || "—";
        const isBeingCalled =
          lead.isAutoDialingCurrent ||
          activeCallLeadIds.has(String(lead._id)) ||
          lead.dialerStatus === "dialing";

        return (
          <div className="flex items-center gap-2 min-w-0" title={businessName}>
            <span className="min-w-0 flex-1 truncate">{businessName}</span>
            {isBeingCalled ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap">
                Calling now
              </span>
            ) : lead._id === nextPendingLeadId ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                Next up
              </span>
            ) : null}
          </div>
        );
      case "businessAddress":
        return (
          <div
            className="min-w-0 truncate"
            title={lead.businessAddress || lead.address || ""}
          >
            {lead.businessAddress || lead.address || "—"}
          </div>
        );
      case "phoneNumber":
        return (
          <div
            className="font-mono text-xs truncate"
            title={lead.phoneNumber || ""}
          >
            {lead.phoneNumber || "—"}
          </div>
        );
      case "dialerStatus":
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize inline-block cursor-pointer transition hover:opacity-80 ${
              lead.dialerStatus === "pending"
                ? "bg-slate-200 dark:bg-slate-700 text-cyan-700 dark:text-cyan-400"
                : lead.dialerStatus === "dialing"
                  ? "bg-yellow-900/50 text-yellow-400"
                  : lead.dialerStatus === "connected"
                    ? "bg-emerald-900/50 text-emerald-400"
                    : lead.dialerStatus === "failed"
                      ? "bg-rose-900/50 text-rose-400"
                      : lead.dialerStatus === "completed"
                        ? "bg-blue-900/50 text-blue-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-400"
            }`}
            onClick={
              canUpdateQualification
                ? () => handleUpdateStatus(lead._id)
                : undefined
            }
            title={
              canUpdateQualification
                ? "Click to update qualification"
                : "Dialer status"
            }
          >
            {lead.dialerStatus || "—"}
          </span>
        );
      case "appointmentStatus": {
        const statusColors = {
          qualified: "bg-emerald-900/50 text-emerald-400",
          disqualified: "bg-rose-900/50 text-rose-400",
          "in-process": "bg-cyan-900/50 text-cyan-400",
          reschedule: "bg-yellow-900/50 text-yellow-400",
          onhold: "bg-slate-900/50 text-slate-400",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize inline-block ${statusColors[lead.appointmentStatus] || "bg-slate-700 text-slate-400"}`}
          >
            {lead.appointmentStatus?.replace("_", " ") || "—"}
          </span>
        );
      }
      case "assignedAgentName":
        return (
          <span className="text-xs">
            {lead.assignedCallerName ||
              lead.assignedCaller?.name ||
              lead.assignedCaller?.email ||
              "—"}
          </span>
        );
      case "interestLevel": {
        const levelColors = {
          cold: "text-slate-700 dark:text-slate-400",
          warm: "text-yellow-400",
          hot: "text-red-400",
        };
        return (
          <span
            className={`text-xs font-semibold capitalize ${levelColors[lead.interestLevel] || "text-slate-400"}`}
          >
            {lead.interestLevel || "—"}
          </span>
        );
      }
      case "appointmentDate":
        return (
          <div
            className="text-xs truncate"
            title={
              lead.appointmentDate
                ? new Date(lead.appointmentDate).toLocaleDateString()
                : ""
            }
          >
            {lead.appointmentDate
              ? new Date(lead.appointmentDate).toLocaleDateString()
              : "—"}
          </div>
        );
      case "typeOfCleaning":
        return (
          <div className="text-xs truncate" title={lead.typeOfCleaning || ""}>
            {lead.typeOfCleaning || "—"}
          </div>
        );
      case "onboardingStatus":
        return (
          <div className="text-xs truncate" title={lead.onboardingStatus || ""}>
            {lead.onboardingStatus || "—"}
          </div>
        );
      default:
        return (
          <div className="text-xs truncate" title={lead[columnKey] || ""}>
            {lead[columnKey] || "—"}
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 mt-6 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Leads
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mt-1 truncate">
              {selectedRows.size > 0
                ? `${selectedRows.size} selected of ${totalLeads} total`
                : `Showing ${startLead}-${endLead} of ${totalLeads} leads`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canExport && (
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="px-3 md:px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 whitespace-nowrap"
              >
                <Download className="w-3 h-3 md:w-4 md:h-4" />
                Export CSV
              </button>
            )}
            {selectedRows.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="px-3 md:px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">
                  Delete ({selectedRows.size})
                </span>
                <span className="sm:hidden">({selectedRows.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 text-xs md:text-sm"
            />
          </div>

          {user?.role === "manager" || user?.role == "admin" && (
            <div>
              <select
                value={filters.agentId || ""}
                onChange={(e) => setAgentId(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 appearance-none cursor-pointer text-xs md:text-sm"
              >
                <option value="">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name || agent.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Page Size */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="pageSize"
              className="text-slate-600 dark:text-slate-400 text-sm"
            >
              Show
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => changePageSize(parseInt(e.target.value))}
              disabled={isLoading}
              className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              per page
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full table-fixed text-sm select-none border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 ">
                {user?.role !== "caller-agent" && (
                  <th className="text-left py-3 px-2 text-cyan-700 dark:text-cyan-400 font-semibold w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.size === leads.length && leads.length > 0
                      }
                      onChange={handleSelectAll}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-600 text-cyan-600 dark:text-cyan-500 cursor-pointer"
                    />
                  </th>
                )}
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left py-3 px-3 text-cyan-700 dark:text-cyan-400 font-semibold ${col.width || ""}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-center py-3 px-2 text-cyan-700 dark:text-cyan-400 font-semibold w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) =>
                (() => {
                  const isBeingCalled =
                    lead.isAutoDialingCurrent ||
                    activeCallLeadIds.has(String(lead._id)) ||
                    lead.dialerStatus === "dialing";

                  return (
                    <tr
                      key={lead._id}
                      className={`border-b transition ${
                        selectedRows.has(lead._id)
                          ? "bg-cyan-100 dark:bg-cyan-900/30 border-slate-200 dark:border-slate-700/50"
                          : isBeingCalled
                            ? "bg-amber-100 dark:bg-amber-900/20 border-l-off border-amber-400/60 dark:border-amber-500/50 shadow-[inset_4px_0_0_0_rgba(245,158,11,0.6)]"
                            : lead._id === nextPendingLeadId
                              ? "bg-emerald-100 dark:bg-emerald-900/20 border-l-off border-emerald-400/60 dark:border-emerald-500/50 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.5)]"
                              : "hover:bg-slate-100 dark:hover:bg-slate-700/30 border-slate-200 dark:border-slate-700/50"
                      }`}
                    >
                      {user?.role !== "caller-agent" && (
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(lead._id)}
                            onChange={() => handleSelectRow(lead._id)}
                            disabled={isLoading}
                            className="w-4 h-4 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-600 text-cyan-600 dark:text-cyan-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {tableColumns.map((col) => (
                        <td
                          key={`${lead._id}-${col.key}`}
                          className={`py-3 px-3 text-slate-900 dark:text-slate-200 max-w-xs truncate ${col.width || ""}`}
                        >
                          {renderCellValue(lead, col.key)}
                        </td>
                      ))}
                      <td className="py-3 px-2">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <button
                            onClick={() => handleViewLead(lead._id)}
                            disabled={isLoading}
                            className="text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 disabled:text-slate-400 dark:disabled:text-slate-600 transition cursor-pointer p-1 hover:bg-slate-200 dark:hover:bg-slate-600/30 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Zoom Phone Integration */}
                          <button
                            onClick={() => {
                              const cleanNumber = String(
                                lead.phoneNumber,
                              ).replace(/[^\d+]/g, "");
                              window.open(
                                `zoomphonecall://${cleanNumber}`,
                                "_self",
                              );
                              showNotification(
                                `Calling ${lead.phoneNumber} via Zoom`,
                                "success",
                              );
                              // Immediately open disposition modal for manual calls
                              handleEditLead(lead);
                            }}
                            disabled={isLoading || !lead.phoneNumber}
                            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 disabled:text-slate-400 dark:disabled:text-slate-600 transition cursor-pointer p-1 hover:bg-slate-200 dark:hover:bg-slate-600/30 rounded"
                            title="Direct Call (Zoom)"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              handleEditLead(lead);
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 text-[11px]"
                            title={
                              user?.role == "manager" || user?.role == "admin"
                                ? "Edit details"
                                : "Edit disposition"
                            }
                          >
                            <Edit3 className="w-3 h-3" />
                            {user?.role == "manager" || user?.role == "admin"
                              ? "Edit Details"
                              : "Edit Disposition"}
                          </button>
                          {user?.role !== "caller-agent" && (
                            <button
                              onClick={() => handleDeleteClick(lead)}
                              disabled={isLoading}
                              className="text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 disabled:text-slate-400 dark:disabled:text-slate-600 transition cursor-pointer p-1 hover:bg-slate-200 dark:hover:bg-slate-600/30 rounded"
                              title="Delete lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })(),
              )}
            </tbody>
          </table>

          {leads.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 text-base">
                No leads found
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={isLoading || currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:text-slate-400 dark:disabled:text-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - currentPage);
                  return distance <= 1 || page === 1 || page === totalPages;
                })
                .map((page, idx, arr) => (
                  <div key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-slate-500">...</span>
                    )}
                    <button
                      onClick={() => changePage(page)}
                      disabled={isLoading}
                      className={`px-3 py-1 rounded transition ${
                        page === currentPage
                          ? "bg-cyan-600 text-white font-semibold"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={isLoading || currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:text-slate-400 dark:disabled:text-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadDetailModal
        isOpen={showDetailModal}
        leadId={selectedLeadId}
        onClose={() => setShowDetailModal(false)}
        onStatusUpdate={handleUpdateStatus}
        onEditLead={(lead) => {
          setShowDetailModal(false);
          handleEditLead(lead);
        }}
        onLeadDeleted={() => {
          deleteSingleLead(selectedLeadId);
          setShowDetailModal(false);
        }}
      />

      <EditLeadModal
        isOpen={showEditModal}
        lead={selectedLeadForEdit}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLeadForEdit(null);
        }}
        onSave={handleEditSave}
        onLeadDeleted={() => {
          deleteSingleLead(selectedLeadForEdit?._id);
          setShowEditModal(false);
          setSelectedLeadForEdit(null);
        }}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={leadToDelete?._id === "bulk" ? "Delete Leads" : "Delete Lead"}
        message={
          leadToDelete?._id === "bulk"
            ? `Are you sure you want to delete ${leadToDelete?.count} selected lead(s)? This action cannot be undone.`
            : `Are you sure you want to delete ${leadToDelete?.businessName || leadToDelete?.phoneNumber}?`
        }
        onConfirm={
          leadToDelete?._id === "bulk"
            ? handleBulkDeleteConfirm
            : handleDeleteConfirm
        }
        onCancel={() => {
          setShowDeleteConfirm(false);
          setLeadToDelete(null);
        }}
        danger
      />
    </>
  );
}
