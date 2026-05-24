import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  X,
  Download,
  Clock3,
  Layers3,
  Users,
  CheckCircle2,
  TrendingUp,
  Trash2,
} from "lucide-react";
import {
  getAllAgents,
  getLeads,
  bulkDeleteLeads,
  deleteLead,
} from "../services/api";
import SmartCampaignSelector from "../components/SmartCampaignSelector";
import LeadDetailModal from "../components/modals/LeadDetailModal";
import EditLeadModal from "../components/modals/EditLeadModal";
import UpdateQualificationModal from "../components/modals/UpdateQualificationModal";
import SelectCampaignMsg from "../components/common/SelectCampaignMsg";
import CreateOfferModal from "../components/CreateOfferModal";
// ─── NEW ────────────────────────────────────────────────────────────────────────
import AgentFunnelAnalytics from "../components/AgentFunnelAnalytics";
// ────────────────────────────────────────────────────────────────────────────────

const DIALER_STATUSES = [
  "pending",
  "dialing",
  "connected",
  "failed",
  "completed",
];

const DISPOSITIONS = [
  "voicemail",
  "followup",
  "not-interested",
  "appointment",
  "wrong-number",
];

const APPOINTMENT_STATUSES = [
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
  "disqualified",
  "in-process",
  "reschedule",
  "onhold",
];

const CONFIRMATION_FILTERS = [
  { value: "", label: "All Appointments" },
  { value: "confirmed", label: "Confirmed" },
  { value: "not-confirmed", label: "Not Confirmed" },
];

const QUALIFIED_STATUSES = new Set([
  "qualified-level-1",
  "qualified-level-2",
  "qualified-level-3",
]);

export default function ManageCallerLeads() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const canExport = ["admin", "manager"].includes(user?.role);
  const canManageLeads = ["admin", "manager"].includes(user?.role);
  const canQualifyAppointments = ["admin", "manager", "team-lead", "caller-agent"].includes(
    user?.role,
  );
  const [dateFilterType, setDateFilterType] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [dateField, setDateField] = useState("lastDialedAt");
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedDialerStatus, setSelectedDialerStatus] = useState("");
  const [selectedDisposition, setSelectedDisposition] = useState("");
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] =
    useState("");
  const [selectedConfirmationStatus, setSelectedConfirmationStatus] =
    useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLeadForOffer, setSelectedLeadForOffer] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    total: null,
    inProcess: null,
    qa1: null,
    qa2: null,
    qa3: null,
    byDisposition: {},
  });
  const tableRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Auto-open lead detail modal if ?leadId= is in the URL (from notification click)
  useEffect(() => {
    const leadIdFromParam = searchParams.get('leadId');
    if (leadIdFromParam) {
      setSelectedLeadId(leadIdFromParam);
      setShowDetailModal(true);
    }
  }, [searchParams]);


  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const allSelected =
    leads.length > 0 && selectedLeadIds.length === leads.length;
  const someSelected =
    selectedLeadIds.length > 0 && selectedLeadIds.length < leads.length;

  const handleSelectLead = (leadId) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId],
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((lead) => lead._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedLeadIds.length) return;
    if (
      !window.confirm(
        `Delete ${selectedLeadIds.length} selected lead${selectedLeadIds.length > 1 ? "s" : ""}? This cannot be undone.`,
      )
    )
      return;

    try {
      setIsLoading(true);
      await bulkDeleteLeads(selectedLeadIds);
      showNotification(
        `Deleted ${selectedLeadIds.length} lead${selectedLeadIds.length > 1 ? "s" : ""}`,
        "success",
      );
      setSelectedLeadIds([]);
      loadFollowupLeads();
    } catch (e) {
      showNotification(
        e.response?.data?.error || "Bulk delete failed",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSingle = async (leadId) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;

    try {
      setIsLoading(true);
      await deleteLead(leadId);
      showNotification("Lead deleted successfully", "success");
      loadFollowupLeads();
    } catch (e) {
      showNotification(e.response?.data?.error || "Delete failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch followup leads
  const loadFollowupLeads = useCallback(async () => {
    const campaignId = selectedCampaignId || undefined;
    setIsLoading(true);
    try {
      const response = await getLeads(campaignId || undefined, {
        page: currentPage,
        limit: pageSize,
        search: searchInput || null,
        status: selectedDialerStatus || null,
        disposition: selectedDisposition || null,
        appointmentStatus: selectedAppointmentStatus || null,
        confirmationStatus: selectedConfirmationStatus || null,
        agentId: selectedAgent || null,
        clientId: selectedClient || null,
        assignedOnly: true,
        filterType: dateFilterType || null,
        startDate: customStartDate || null,
        endDate: customEndDate || null,
        dateField: dateField || null,
      });

      console.log("Response: ", response.leads);

      setLeads(Array.isArray(response?.leads) ? response.leads : []);
      setTotal(response?.pagination?.total || 0);
      setStats({
        total: response?.stats?.total || 0,
        inProcess: response?.stats?.inProcess || 0,
        qa1: response?.stats?.qa1 || 0,
        qa2: response?.stats?.qa2 || 0,
        qa3: response?.stats?.qa3 || 0,
        byDisposition: response?.stats?.byDisposition || {},
      });
    } catch (error) {
      console.error("Error fetching followup leads:", error);
      showNotification("Error fetching followup leads", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedCampaignId,
    showNotification,
    dateField,
    pageSize,
    currentPage,
    searchInput,
    selectedDialerStatus,
    selectedDisposition,
    selectedAppointmentStatus,
    selectedConfirmationStatus,
    selectedAgent,
    selectedClient,
    dateFilterType,
    customStartDate,
    customEndDate,
  ]);

  useEffect(() => {
    loadFollowupLeads();
  }, [loadFollowupLeads]);

  // Reset selection if leads change
  useEffect(() => {
    setSelectedLeadIds([]);
  }, [leads]);

  // Reset page when switching campaigns
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampaignId]);

  // Clamp current page when total or pageSize changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [total, pageSize, currentPage]);

  useEffect(() => {
    const scrollToTarget = () => {
      if (currentPage === 1) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth",
        });
        return;
      }

      if (!tableRef.current) return;

      const rect = tableRef.current.getBoundingClientRect();
      const offset = 300;
      const targetY = window.scrollY + rect.top - offset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    };

    requestAnimationFrame(scrollToTarget);
  }, [currentPage]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const users = await getAllAgents({ includeClients: true });
        const allUsers = Array.isArray(users) ? users : [];
        const callerOnly = allUsers
          .filter((user) => user.role === "caller-agent")
          .map((user) => ({
            _id: user._id,
            name: user.name || user.email,
            email: user.email,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        const clientOnly = allUsers
          .filter((user) => user.role === "client")
          .map((user) => ({
            _id: user._id,
            name: user.companyName || user.name || user.email,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAgents(callerOnly);
        setClients(clientOnly);
      } catch (error) {
        console.error("Error loading caller agents:", error);
      }
    };

    fetchAgents();
  }, []);

  const handleViewLead = (leadId) => {
    setSelectedLeadId(leadId);
    setShowDetailModal(true);
  };

  const handleEditLead = (lead) => {
    setSelectedLeadForEdit(lead);
    setShowEditModal(true);
  };

  const handleEditSave = (updated) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead._id === updated._id ? updated : lead)),
    );
    showNotification("Lead updated successfully", "success");
    setShowEditModal(false);
    loadFollowupLeads();
    window.dispatchEvent(new CustomEvent("lead:updated", { detail: { leadId: updated._id } }));
  };

  const handleUpdateStatus = (lead) => {
    // Accept either a full lead object (from LeadDetailModal) or fall back to lookup in the current list
    const resolvedLead = lead && typeof lead === 'object' && lead._id
      ? lead
      : leads.find((item) => item._id === lead) || null;
    setSelectedLeadForStatus(resolvedLead);
    setShowStatusModal(true);
  };

  const handleStatusUpdateSuccess = (updated) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead._id === updated._id ? updated : lead)),
    );
    showNotification("Qualification updated successfully", "success");
    setShowStatusModal(false);
    loadFollowupLeads();
    window.dispatchEvent(new CustomEvent("lead:updated", { detail: { leadId: updated._id } }));
  };

  const handleCreateOffer = (lead) => {
    if (!QUALIFIED_STATUSES.has(lead?.appointmentStatus)) {
      showNotification(
        "Only qualified leads can be offered to clients",
        "error",
      );
      return;
    }
    setSelectedLeadForOffer(lead || null);
  };

  const handleOfferCreated = (data) => {
    loadFollowupLeads();
    if (data?.lead?._id || data?.callerLead) {
      window.dispatchEvent(new CustomEvent("lead:updated", { 
        detail: { leadId: data?.lead?._id || data?.callerLead } 
      }));
    }
  };

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedDialerStatus("");
    setSelectedDisposition("");
    setSelectedAppointmentStatus("");
    setSelectedConfirmationStatus("");
    setSelectedAgent("");
    setSelectedClient("");
    setDateFilterType("");
    setCustomStartDate("");
    setCustomEndDate("");
    setDateField("lastDialedAt");
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (leads.length === 0) {
      showNotification("No leads to export", "error");
      return;
    }

    const headers = [
      "Business Name",
      "Phone",
      "Email",
      "Dialer Status",
      "Disposition",
      "Appointment Status",
      "Agent Assigned",
      "Last Contacted",
      "Notes",
    ];
    const rows = leads.map((lead) => [
      lead.businessName || "",
      lead.phoneNumber || "",
      lead.email || "",
      lead.dialerStatus || "",
      lead.disposition || "",
      lead.appointmentStatus || "",
      getAssignedAgentLabel(lead) || "",
      formatDate(lead.lastDialedAt) || "",
      lead.agentNotes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `followup-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification("Followup leads exported successfully", "success");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-slate-800 text-slate-50",
      dialing: "bg-blue-800 text-blue-50",
      connected: "bg-emerald-800 text-emerald-50",
      failed: "bg-rose-800 text-rose-50",
      completed: "bg-indigo-800 text-indigo-50",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getDispositionColor = (disposition) => {
    const colors = {
      voicemail: "bg-gray-600 text-white",
      followup: "bg-amber-600 text-white",
      "not-interested": "bg-red-600 text-white",
      appointment: "bg-emerald-600 text-white",
      "wrong-number": "bg-orange-600 text-white",
    };
    return colors[disposition] || "bg-gray-200 text-gray-800";
  };

  const getAppointmentColor = (appointmentStatus) => {
    const colors = {
      "in-process":
        "bg-gradient-to-l from-yellow-600 via-yellow-800 to-yellow-900 text-white",
      "qualified-level-1":
        "bg-gradient-to-l from-blue-600 via-blue-800 to-blue-900 text-white",
      "qualified-level-2":
        "bg-gradient-to-l from-indigo-600 via-indigo-800 to-indigo-900 text-white",
      "qualified-level-3":
        "bg-gradient-to-l from-emerald-600 via-emerald-800 to-emerald-900 text-white",
      disqualified:
        "bg-gradient-to-l from-red-600 via-red-800 to-red-900 text-white",
      reschedule:
        "bg-gradient-to-l from-orange-600 via-orange-800 to-orange-900 text-white",
      onhold:
        "bg-gradient-to-l from-gray-600 via-gray-800 to-gray-900 text-white",
    };

    return colors[appointmentStatus] || "bg-gray-200 text-gray-800";
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const getPageNumbers = (totalPages, currentPage) => {
    const pages = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left = Math.max(3, currentPage - 1);
    const right = Math.min(totalPages - 2, currentPage + 1);

    pages.push(1, 2);

    if (left > 3) {
      pages.push("...");
    } else if (left === 3) {
      pages.push(3);
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 2) {
      pages.push("...");
    } else if (right === totalPages - 2) {
      pages.push(totalPages - 2);
    }

    pages.push(totalPages - 1, totalPages);
    return pages.filter((v, i, a) => a.indexOf(v) === i);
  };

  const getAssignedAgentLabel = (lead) => {
    if (lead.assignedCallerName) return lead.assignedCallerName;
    if (lead.assignedCaller && typeof lead.assignedCaller === "object") {
      return lead.assignedCaller.name || lead.assignedCaller.email || "—";
    }
    if (typeof lead.assignedCaller === "string") return lead.assignedCaller;
    return "—";
  };

  const activeFiltersCount = [
    searchInput,
    selectedDialerStatus,
    selectedDisposition,
    selectedAppointmentStatus,
    selectedAgent,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-8 shadow-lg dark:border-slate-700/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-linear-to-br from-cyan-500/10 to-blue-500/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
              <Layers3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Lead Followups
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Track call outcomes, assignments, and next actions in one place.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600/50 dark:bg-slate-900/80 dark:text-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500/20 to-blue-500/20">
              <Layers3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span>{stats.total ?? "—"} total leads</span>
          </div>
        </div>
      </div>

      {/* Campaign Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <SmartCampaignSelector
          value={selectedCampaignId}
          onChange={setSelectedCampaignId}
        />
      </div>

      {(user?.role === "admin" || user?.role === "manager") && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
          Only assigned leads will display here
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-blue-500/5 blur-2xl transition-all group-hover:bg-blue-500/10"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Leads
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {stats.total ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                scoped to selected campaign
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/10 to-blue-600/10">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                In Process
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {stats.inProcess ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                potential clients
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/10 to-purple-600/10">
              <Clock3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-purple-500/5 blur-2xl transition-all group-hover:bg-purple-500/10"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Qualified L1
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {stats.qa1 ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                approved
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/10 to-emerald-600/10">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-pink-500/5 blur-2xl transition-all group-hover:bg-pink-500/10"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Qualified L3
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {stats.qa3 ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                highest qualification
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500/10 to-green-600/10">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SALES FUNNEL ANALYTICS ─────────────────────────────────────────────── */}
      <AgentFunnelAnalytics
        stats={stats}
        leads={leads}
        isLoading={isLoading}
        onRefresh={loadFollowupLeads}
      />
      {/* ──────────────────────────────────────────────────────────────────────────── */}

      {/* Filters Section */}
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Top Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Search */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={searchInput}
              onChange={handleSearch}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          {/* Qualification */}
          <div className="lg:col-span-3">
            <select
              value={selectedAppointmentStatus}
              onChange={(e) => {
                setSelectedAppointmentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All Qualifications</option>
              {APPOINTMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Confirmation */}
          <div className="lg:col-span-2">
            <select
              value={selectedConfirmationStatus}
              onChange={(e) => {
                setSelectedConfirmationStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              {CONFIRMATION_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Disposition */}
          <div className="lg:col-span-2">
            <select
              value={selectedDisposition}
              onChange={(e) => {
                setSelectedDisposition(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All Dispositions</option>
              {DISPOSITIONS.map((d) => (
                <option key={d} value={d}>
                  {d.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Agent */}
          <div className="lg:col-span-1">
            <select
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name || agent.email}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div className="lg:col-span-3">
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Date + Actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-end">
          {/* Date Filter */}
          <div className="lg:col-span-4">
            <select
              value={dateFilterType}
              onChange={(e) => {
                setDateFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">All Time</option>
              <option value="today">Today (7PM - 4AM)</option>
              <option value="last7days">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="range">Custom Range</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="lg:col-span-5 flex items-center gap-3">
            {dateFilterType === "range" && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:bg-slate-900"
                />
                <span className="text-slate-500">—</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:bg-slate-900"
                />
              </>
            )}
          </div>

          {/* Clear */}
          <div className="lg:col-span-3">
            <button
              onClick={clearAllFilters}
              className="h-11 w-full cursor-pointer rounded-lg border border-rose-300 bg-rose-50 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        {canManageLeads && leads.length > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-900">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={handleSelectAll}
              className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-cyan-600 dark:border-slate-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {allSelected
                ? "All leads selected"
                : someSelected
                  ? `${selectedLeadIds.length} selected`
                  : "Select leads to delete"}
            </span>
            {selectedLeadIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="ml-2 flex cursor-pointer items-center gap-2 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </button>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500 dark:border-slate-700 dark:border-t-cyan-400"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading followup leads...
              </p>
            </div>
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <tr>
                  {canManageLeads && (
                    <th className="px-2 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={handleSelectAll}
                        className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-cyan-600 dark:border-slate-600"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Lead
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Agent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Disposition
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Qualification
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Address
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Appointment Date & Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Follow-Up Date & Time
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    {canManageLeads && (
                      <td className="px-2 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead._id)}
                          onChange={() => handleSelectLead(lead._id)}
                          className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-cyan-600 dark:border-slate-600"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {lead.businessName || "N/A"}
                        </span>
                        <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {lead.phoneNumber}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                          <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="font-medium">
                          {getAssignedAgentLabel(lead)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${getDispositionColor(
                          lead.disposition,
                        )}`}
                      >
                        {lead.disposition?.replace("-", " ").toUpperCase() ||
                          "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${getAppointmentColor(
                          lead.appointmentStatus,
                        )}`}
                      >
                        {lead.appointmentStatus
                          ?.replace("-", " ")
                          .toUpperCase() || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="line-clamp-2 max-w-xs">
                        {lead.businessAddress || lead.address || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatDate(lead.appointmentDate)}
                        </span>
                        <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {lead.appointmentTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatDate(lead.followUpDate)}
                        </span>
                        <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {lead.followUpTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewLead(lead._id)}
                          className="cursor-pointer rounded-lg bg-linear-to-r from-cyan-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-blue-700 hover:shadow-cyan-500/30"
                        >
                          View
                        </button>
                        {canManageLeads && (
                          <button
                            onClick={() => handleDeleteSingle(lead._id)}
                            className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-rose-700"
                            title="Delete lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              No followup leads found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
              Try adjusting your filters or search criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {getPageNumbers(totalPages, currentPage).map((page, idx) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-10 items-center justify-center px-3 text-sm text-slate-500"
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 cursor-pointer rounded-lg text-sm font-semibold shadow-sm transition ${
                    currentPage === page
                      ? "bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {!selectedCampaignId && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Layers3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Showing followups across ALL campaigns
          </p>
        </div>
      )}
      {!selectedCampaignId && <SelectCampaignMsg />}

      <LeadDetailModal
        isOpen={showDetailModal}
        leadId={selectedLeadId}
        onClose={() => setShowDetailModal(false)}
        onEditLead={handleEditLead}
        onStatusUpdate={canQualifyAppointments ? handleUpdateStatus : undefined}
        onCreateOffer={canManageLeads ? handleCreateOffer : undefined}
      />

      <EditLeadModal
        isOpen={showEditModal}
        lead={selectedLeadForEdit}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
      />

      {canQualifyAppointments && (
        <>
          <UpdateQualificationModal
            isOpen={showStatusModal}
            lead={selectedLeadForStatus}
            onClose={() => setShowStatusModal(false)}
            onSuccess={handleStatusUpdateSuccess}
            onError={(message) => showNotification(message, "error")}
          />
          {canManageLeads && (
          <CreateOfferModal
            isOpen={Boolean(selectedLeadForOffer)}
            lead={selectedLeadForOffer}
            onClose={() => setSelectedLeadForOffer(null)}
            onCreated={handleOfferCreated}
            showNotification={showNotification}
          />
          )}
        </>
      )}
    </div>
  );
}
