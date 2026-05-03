import { useState, useEffect, Fragment, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Megaphone,
  Users,
  User as UserIcon,
  Search,
  Filter,
  Upload,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Layers,
  ArrowRight,
  Check,
  Minus,
  Layers3,
} from "lucide-react";
import api, {
  getCampaigns,
  bulkAssignSingleAgentToCampaigns,
  bulkAssignAgentPoolToCampaigns,
  bulkClearCampaignAssignments,
  getAllAgents,
} from "../services/api";
import {
  isManager as checkIsManager,
  getRoleHomeRoute,
} from "../utils/roleUtils";
import CreateCampaignModal from "../components/modals/CreateCampaignModal";
import EditCampaignModal from "../components/modals/EditCampaignModal";
import FileUpload from "../components/FileUpload";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CampaignsPage() {
  const { showNotification } = useOutletContext();
  const { user, theme } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filters & UI State
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agents, setAgents] = useState([]);
  const [expandedRootIds, setExpandedRootIds] = useState(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadParentCampaign, setUploadParentCampaign] = useState(null);
  const [uploadFailedRows, setUploadFailedRows] = useState([]);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [dialerTypeFilter, setDialerTypeFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    loadCampaigns();
    loadAgents();
  }, []);

  useEffect(() => {
    if (user && !checkIsManager(user?.role)) {
      showNotification("Access denied", "error");
      navigate(getRoleHomeRoute(user?.role));
    }
  }, [user, navigate]);

  const loadAgents = async () => {
    try {
      const res = await getAllAgents();
      const all = res.data || res;
      // Only show assignable agents
      setAgents(
        all.filter(
          (a) => a.role === "caller-agent" || a.role === "closer-agent",
        ),
      );
    } catch (err) {
      showNotification("Failed to load agents", "error");
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await getCampaigns();
      const allRoots = (Array.isArray(response) ? response : [])
        .map((campaign) => ({
          ...campaign,
          children: Array.isArray(campaign.children) ? campaign.children : [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      allRoots.forEach((root) => {
        root.children.sort((a, b) => a.name.localeCompare(b.name));
      });

      setCampaigns(allRoots);
    } catch (error) {
      showNotification("Failed to load campaigns", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    showNotification("Campaign created successfully", "success");
    loadCampaigns();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    showNotification("Campaign updated successfully", "success");
    loadCampaigns();
  };

  const handleEditClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  const openUploadModal = (campaign) => {
    setUploadParentCampaign(campaign);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadParentCampaign(null);
    setUploadFailedRows([]);
    loadCampaigns();
  };
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .map((root) => {
        const rootMatches =
          !searchTerm ||
          root.name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = root.children.filter((child) => {
          const matchesSearch =
            !searchTerm ||
            child.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesDialer =
            !dialerTypeFilter || child.dialerType === dialerTypeFilter;
          const isAssigned =
            child.assignedAgent ||
            (child.assignedAgents && child.assignedAgents.length > 0);
          const matchesAssignment =
            !assignmentFilter ||
            (assignmentFilter === "assigned" ? isAssigned : !isAssigned);

          let matchesDate = true;
          if (dateRange.start)
            matchesDate =
              matchesDate &&
              new Date(child.createdAt) >= new Date(dateRange.start);
          if (dateRange.end)
            matchesDate =
              matchesDate &&
              new Date(child.createdAt) <=
                new Date(dateRange.end + "T23:59:59");

          return (
            matchesSearch && matchesDialer && matchesAssignment && matchesDate
          );
        });

        if (
          rootMatches &&
          !dialerTypeFilter &&
          !assignmentFilter &&
          !dateRange.start &&
          !dateRange.end
        )
          return { ...root, children: root.children };
        if (filteredChildren.length > 0)
          return { ...root, children: filteredChildren };
        return null;
      })
      .filter(Boolean)
      .filter((root) => {
        const matchesPipeline =
          !pipelineTypeFilter || root.pipelineType === pipelineTypeFilter;
        let matchesDate = true;
        if (dateRange.start)
          matchesDate =
            matchesDate &&
            new Date(root.createdAt) >= new Date(dateRange.start);
        if (dateRange.end)
          matchesDate =
            matchesDate &&
            new Date(root.createdAt) <= new Date(dateRange.end + "T23:59:59");
        return matchesPipeline && matchesDate;
      });
  }, [
    campaigns,
    searchTerm,
    pipelineTypeFilter,
    dialerTypeFilter,
    assignmentFilter,
    dateRange,
  ]);

  const toggleSelectCampaign = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectParent = (root, e) => {
    if (e) e.stopPropagation();
    const childIds = root.children.map((c) => c._id);
    const allIds = [root._id, ...childIds];
    const allSelected = allIds.every((id) => selectedCampaignIds.includes(id));

    if (allSelected) {
      setSelectedCampaignIds((prev) =>
        prev.filter((id) => !allIds.includes(id)),
      );
    } else {
      setSelectedCampaignIds((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAgentId || !selectedCampaignIds.length) return;
    setIsBulkAssigning(true);
    try {
      // Filter out parents from bulk assignment to avoid "not a child" error
      const childIdsOnly = (
        await Promise.all(
          selectedCampaignIds.map(async (id) => {
            // Optimization: usually parents don't have a dialerType or have certain props
            // For now, find them in our state
            let found = null;
            for (const root of campaigns) {
              if (root._id === id) {
                found = root;
                break;
              }
              for (const child of root.children) {
                if (child._id === id) {
                  found = child;
                  break;
                }
              }
              if (found) break;
            }
            return found && found.parentCampaign ? id : null;
          }),
        )
      ).filter(Boolean);

      if (childIdsOnly.length === 0) {
        showNotification(
          "Please select child campaigns to assign agents",
          "warning",
        );
        setIsBulkAssigning(false);
        return;
      }

      await bulkAssignSingleAgentToCampaigns({
        campaignIds: childIdsOnly,
        agentId: selectedAgentId,
      });
      showNotification("Assignments updated successfully", "success");
      setSelectedCampaignIds([]);
      setSelectedAgentId("");
      loadCampaigns();
    } catch (err) {
      showNotification(
        err.response?.data?.error || "Failed to assign agent",
        "error",
      );
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleClearSelected = async () => {
    if (!selectedCampaignIds.length) return;
    if (
      !window.confirm(
        `Clear assignments for ${selectedCampaignIds.length} campaigns?`,
      )
    )
      return;

    try {
      await bulkClearCampaignAssignments({ campaignIds: selectedCampaignIds });
      showNotification("Assignments cleared", "success");
      setSelectedCampaignIds([]);
      loadCampaigns();
    } catch (err) {
      showNotification("Failed to clear assignments", "error");
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this campaign? All children and leads will be removed.",
      )
    )
      return;

    try {
      setDeletingId(id);
      await api.delete(`/campaigns/${id}`);
      showNotification("Campaign deleted", "success");
      loadCampaigns();
    } catch (error) {
      showNotification("Failed to delete campaign", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveAgents = async (campaign, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Unassign all agents from this campaign?")) return;
    try {
      await api.put(`/campaigns/${campaign._id}`, {
        assignedAgent: null,
        assignedAgents: [],
      });
      showNotification("Agents unassigned", "success");
      loadCampaigns();
    } catch (error) {
      showNotification("Failed to unassign agents", "error");
    }
  };

  if (isLoading && campaigns.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-8 shadow-lg dark:border-slate-700/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
            <Layers3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Campaign Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Organize and assign your calling efforts
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Filters and Search Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 w-full lg:w-auto gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition text-sm"
                />
              </div>
              <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                <button
                  onClick={() => setPipelineTypeFilter("")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${!pipelineTypeFilter ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setPipelineTypeFilter("caller")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${pipelineTypeFilter === "caller" ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Caller
                </button>
                <button
                  onClick={() => setPipelineTypeFilter("closer")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition ${pipelineTypeFilter === "closer" ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Closer
                </button>
              </div>
            </div>

            {/* Integrated Bulk Actions - Only visible when items selected */}
            {selectedCampaignIds.length > 0 && (
              <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 px-4 py-1.5 rounded-lg animate-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-primary-700 dark:text-primary-400">
                  {selectedCampaignIds.length} Selected
                </span>
                <div className="h-4 w-px bg-primary-200 dark:bg-primary-800"></div>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer dark:bg-slate-900 focus:ring-primary-500/20 outline-none p-2 rounded-lg"
                >
                  <option value="">Assign Agent...</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!selectedAgentId || isBulkAssigning}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearSelected}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Advanced:
              </span>
            </div>

            <select
              value={dialerTypeFilter}
              onChange={(e) => setDialerTypeFilter(e.target.value)}
              className="text-[11px] font-bold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-primary-500/20 outline-hidden transition text-slate-700 dark:text-slate-300"
            >
              <option value="">All Dialers</option>
              <option value="auto">Auto</option>
              <option value="parallel">Parallel</option>
            </select>

            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="text-[11px] font-bold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-primary-500/20 outline-hidden transition text-slate-700 dark:text-slate-300"
            >
              <option value="">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-2 ml-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300"
              />
              <span className="text-slate-400 text-[10px] font-bold">TO</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: "", end: "" })}
                  className="ml-1 p-0.5 text-slate-400 hover:text-rose-500 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 w-10">
                  <div
                    onClick={() => {
                      const allIds = filteredCampaigns.flatMap((r) => [
                        r._id,
                        ...r.children.map((c) => c._id),
                      ]);
                      const allSelected = allIds.every((id) =>
                        selectedCampaignIds.includes(id),
                      );
                      setSelectedCampaignIds(allSelected ? [] : allIds);
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      selectedCampaignIds.length > 0
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {selectedCampaignIds.length > 0 &&
                      (filteredCampaigns
                        .flatMap((r) => [
                          r._id,
                          ...r.children.map((c) => c._id),
                        ])
                        .every((id) => selectedCampaignIds.includes(id)) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      ))}
                  </div>
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Campaign Name
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Type
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Dialer
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Assignment
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Leads
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Dialed
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredCampaigns.map((root) => {
                const isExpanded = expandedRootIds.has(root._id);
                const isSelected = selectedCampaignIds.includes(root._id);

                return (
                  <Fragment key={root._id}>
                    <tr
                      className={`group transition-colors ${isSelected ? "bg-primary-50/30 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}
                    >
                      <td className="px-4 py-3">
                        <div
                          onClick={(e) => toggleSelectParent(root, e)}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary-600 border-primary-600 text-white"
                              : "border-slate-300 dark:border-slate-600 group-hover:border-primary-400"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedRootIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(root._id)) next.delete(root._id);
                                else next.add(root._id);
                                return next;
                              })
                            }
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                          >
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                          <span>{root.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            root.pipelineType === "caller"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}
                        >
                          {root.pipelineType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openUploadModal(root)}
                            className="p-2 text-slate-400 hover:text-primary-600 transition"
                            title="Upload Leads"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(root)}
                            className="p-2 text-slate-400 hover:text-amber-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(root._id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded &&
                      root.children.map((child, idx) => {
                        const isChildSelected = selectedCampaignIds.includes(
                          child._id,
                        );
                        const isLast = idx === root.children.length - 1;

                        return (
                          <tr
                            key={child._id}
                            className={`group transition-colors border-l-2 border-slate-200 dark:border-slate-700 ml-4 ${isChildSelected ? "bg-primary-50/30 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}
                          >
                            <td className="px-4 py-2.5 pl-8 relative">
                              {/* Connector line */}
                              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                              <div className="absolute left-4 top-1/2 w-4 h-px bg-slate-200 dark:bg-slate-700"></div>

                              <div
                                onClick={(e) =>
                                  toggleSelectCampaign(child._id, e)
                                }
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition-colors relative z-10 ${
                                  isChildSelected
                                    ? "bg-primary-600 border-primary-600 text-white"
                                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-primary-400"
                                }`}
                              >
                                {isChildSelected && (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 pl-4">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/manager/leads?campaignId=${child._id}`,
                                  )
                                }
                                className="text-slate-700 dark:text-slate-200 hover:text-primary-600 font-medium transition"
                              >
                                {child.name}
                              </button>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs text-slate-500 font-medium capitalize">
                                {child.pipelineType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  child.dialerType === "auto"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-orange-600 dark:text-orange-400"
                                }`}
                              >
                                {child.dialerType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {child.dialerType === "auto" ? (
                                  <>
                                    <UserIcon className="w-3.5 h-3.5" />
                                    {child.assignedAgent?.name || "Unassigned"}
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-3.5 h-3.5" />
                                    {child.assignedAgents?.length || 0} Agents
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {child.stats?.totalLeads || 0} Total
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {child.stats?.pendingLeads || 0} Pending
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                                  {child.stats?.dialedToday || 0}
                                </span>
                                {child.stats?.isCompleted && (
                                  <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                    Done
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/manager/leads?campaignId=${child._id}`,
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-primary-600 transition"
                                  title="View Leads"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(child)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                                  title="Assign/Edit"
                                >
                                  <UserIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleRemoveAgents(child, e)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                                  title="Unassign"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(child._id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && !isLoading && (
          <div className="p-20 text-center">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No campaigns found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
              Create your first campaign to start organizing your leads and
              agents.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCampaignModal
        isOpen={showEditModal}
        campaign={selectedCampaign}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCampaign(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upload Leads: {uploadParentCampaign?.name}
                </h3>
              </div>
              <button
                onClick={closeUploadModal}
                className="p-2 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <FileUpload
                campaignId={uploadParentCampaign?._id}
                forceParentUpload={true}
                disableParentSelect={true}
                onSuccess={(msg, responseData) => {
                  showNotification(msg || "Upload complete", "success");
                  if (responseData?.failedRows?.length)
                    setUploadFailedRows(responseData.failedRows);
                  else setUploadFailedRows([]);
                }}
                onError={(msg) =>
                  showNotification(msg || "Upload failed", "error")
                }
                onUploadComplete={() => loadCampaigns()}
              />

              {uploadFailedRows.length > 0 && (
                <div className="mt-6 border border-amber-200 dark:border-amber-900/50 rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-900/10">
                  <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {uploadFailedRows.length} Rows Skipped
                    </span>
                    <button
                      onClick={() => setUploadFailedRows([])}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-800 uppercase tracking-widest"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-amber-50/50 dark:bg-slate-800/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-bold text-amber-900/50 dark:text-amber-500/50 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-4 py-2 font-bold text-amber-900/50 dark:text-amber-500/50 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 dark:divide-amber-900/10">
                        {uploadFailedRows.map((fr, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-white dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-2 font-bold text-slate-500">
                              {fr.row}
                            </td>
                            <td className="px-4 py-2 text-rose-500 font-medium">
                              {fr.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={closeUploadModal}
                className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
