import { useState, useEffect, Fragment } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Megaphone,
} from "lucide-react";
import api, { getCampaigns } from "../services/api";
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [expandedRootIds, setExpandedRootIds] = useState(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadParentCampaign, setUploadParentCampaign] = useState(null);
const [uploadFailedRows, setUploadFailedRows] = useState([]);

  const getParentName = (campaign) => {
    if (!campaign?.parentCampaign) return "None";
    if (typeof campaign.parentCampaign === "object") {
      const parent = campaign.parentCampaign;
      return parent.name
        ? `${parent.name} [${parent.pipelineType || "?"}]`
        : "Parent campaign";
    }
    return "Parent campaign";
  };

  const getAssignmentLabel = (campaign) => {
    if (campaign?.dialerType === "auto") {
      const assigned = campaign?.assignedAgent;
      if (!assigned) return "Unassigned";
      if (typeof assigned === "object")
        return assigned.name || assigned.email || "Assigned";
      return "Assigned";
    }

    if (campaign?.dialerType === "parallel") {
      const agents = Array.isArray(campaign?.assignedAgents)
        ? campaign.assignedAgents
        : [];
      if (!agents.length) return "Unassigned";

      const names = agents
        .map((agent) => {
          if (!agent) return null;
          if (typeof agent === "object")
            return agent.name || agent.email || null;
          return null;
        })
        .filter(Boolean);

      if (names.length > 0) return names.join(", ");
      return `${agents.length} agents`;
    }

    return "N/A";
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (user && !checkIsManager(user?.role)) {
      showNotification(
        "You do not have permission to access this page",
        "error",
      );
      const roleHome = getRoleHomeRoute(user?.role);
      navigate(roleHome);
    }
  }, [user, navigate, showNotification]);

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

  const handleEditClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  // Remove Agent(s) handler
  const handleRemoveAgents = async (campaign) => {
    if (!campaign) return;
    const confirmRemove = window.confirm(
      "Are you sure you want to remove all agent assignments from this campaign? This will unassign all agents from remaining leads.",
    );
    if (!confirmRemove) return;
    try {
      // PATCH request to update campaign: clear assignedAgent and assignedAgents
      await api.put(`/campaigns/${campaign._id}`, {
        assignedAgent: null,
        assignedAgents: [],
      });
      showNotification("Agent(s) removed successfully", "success");
      loadCampaigns();
    } catch (error) {
      showNotification("Failed to remove agent(s)", "error");
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    showNotification("Campaign updated successfully", "success");
    loadCampaigns();
  };

  const openUploadModal = (parentCampaign) => {
    setUploadParentCampaign(parentCampaign);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
  setShowUploadModal(false);
  setUploadParentCampaign(null);
  setUploadFailedRows([]);
  loadCampaigns();
};

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this campaign?",
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await api.delete(`/campaigns/${id}`);

      await loadCampaigns();

      showNotification("Campaign deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showNotification("Failed to delete campaign", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleChildren = (rootId) => {
    setExpandedRootIds((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  };

  const handleOpenLeads = (campaignId) => {
    navigate(`/manager/leads?campaignId=${campaignId}`);
  };

  // Filtering logic
  const filteredCampaigns = campaigns
    .map((root) => {
      const rootMatches =
        !searchTerm ||
        root.name.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredChildren = Array.isArray(root.children)
        ? root.children.filter(
            (child) =>
              !searchTerm ||
              child.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : [];

      if (rootMatches) {
        return {
          ...root,
          children: root.children || [],
        };
      }

      if (filteredChildren.length > 0) {
        return {
          ...root,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter(Boolean)
    .filter((root) => {
      if (pipelineTypeFilter && root.pipelineType !== pipelineTypeFilter)
        return false;
      return true;
    });

  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Campaigns
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your calling campaigns
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center">
            {/* Pipeline Type Filter */}
            <select
              value={pipelineTypeFilter}
              onChange={(e) => setPipelineTypeFilter(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value="">All Pipelines</option>
              <option value="caller">Caller</option>
              <option value="closer">Closer</option>
            </select>
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns..."
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold w-12"></th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Campaign
                </th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Dialer
                </th>
                <th className="text-left py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Assigned
                </th>
                <th className="text-right py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((root) => {
                const children = Array.isArray(root.children)
                  ? root.children
                  : [];
                const isExpanded = expandedRootIds.has(root._id);

                return (
                  <Fragment key={root._id}>
                    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4">
                        {children.length > 0 ? (
                          <button
                            onClick={() => toggleChildren(root._id)}
                            className="text-slate-600 dark:text-slate-300 hover:text-primary-500 transition cursor-pointer"
                            title={
                              isExpanded
                                ? "Hide child campaigns"
                                : "Show child campaigns"
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {root.name}{" "}
                        <span className="text-xs text-slate-500">
                          [{root.pipelineType || "?"}]
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        Parent
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300"></td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300"></td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openUploadModal(root)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded transition text-xs cursor-pointer"
                            title="Upload files to this parent campaign"
                          >
                            Upload Files
                          </button>
                          <button
                            onClick={() => handleEditClick(root)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded transition text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            disabled={deletingId === root._id}
                            onClick={() => handleDelete(root._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition text-xs disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingId === root._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded &&
                      children.map((child) => (
                        <tr
                          key={child._id}
                          className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                        >
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4 pl-8 text-slate-900 dark:text-slate-100">
                            <button
                              onClick={() => handleOpenLeads(child._id)}
                              className="hover:text-primary-500 transition cursor-pointer text-left"
                              title="Open this campaign in Leads"
                            >
                              {child.name}
                              {child.pipelineType && (
                                <span className="text-xs text-slate-500">
                                  {" "}
                                  [{child.pipelineType}]
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            Child
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 uppercase">
                            {child.dialerType || "N/A"}
                          </td>
                          <td
                            className="py-3 px-4 text-slate-700 dark:text-slate-300"
                            title={getAssignmentLabel(child)}
                          >
                            {getAssignmentLabel(child)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenLeads(child._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded transition text-xs cursor-pointer"
                              >
                                Open Leads
                              </button>
                              <button
                                onClick={() => handleEditClick(child)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded transition text-xs cursor-pointer"
                                title="Assign or change the campaign agent"
                              >
                                Assign Agent
                              </button>
                              <button
                                onClick={() => handleRemoveAgents(child)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-700 text-white rounded transition text-xs cursor-pointer"
                                title="Remove all agent assignments from this campaign"
                              >
                                Remove Agent(s)
                              </button>
                              <button
                                onClick={() => handleEditClick(child)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded transition text-xs cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                disabled={deletingId === child._id}
                                onClick={() => handleDelete(child._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded transition text-xs disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingId === child._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredCampaigns.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No campaigns yet
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Campaign
          </button>
        </div>
      )}

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
      {/* {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload files to {uploadParentCampaign?.name}</h3>
              <button onClick={closeUploadModal} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <FileUpload
              campaignId={uploadParentCampaign?._id}
              forceParentUpload={true}
              disableParentSelect={true}
              onSuccess={(msg) => showNotification(msg || 'Upload complete', 'success')}
              onError={(msg) => showNotification(msg || 'Upload failed', 'error')}
              onUploadComplete={() => loadCampaigns()}
            />
          </div>
        </div>
      )} */}
      {showUploadModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Upload files to {uploadParentCampaign?.name}
        </h3>
        <button
          onClick={closeUploadModal}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Close
        </button>
      </div>

      <FileUpload
        campaignId={uploadParentCampaign?._id}
        forceParentUpload={true}
        disableParentSelect={true}
        onSuccess={(msg, responseData) => {
          showNotification(msg || "Upload complete", "success");
          if (responseData?.failedRows?.length) {
            setUploadFailedRows(responseData.failedRows);
          } else {
            setUploadFailedRows([]);
          }
        }}
        onError={(msg) => showNotification(msg || "Upload failed", "error")}
        onUploadComplete={() => loadCampaigns()}
      />

      {/* Failed rows panel */}
      {uploadFailedRows.length > 0 && (
        <div className="mt-5 border border-amber-300 dark:border-amber-600 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/30 px-4 py-2 border-b border-amber-300 dark:border-amber-600">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              ⚠ {uploadFailedRows.length} row{uploadFailedRows.length !== 1 ? "s" : ""} skipped
            </span>
            <button
              onClick={() => setUploadFailedRows([])}
              className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400"
            >
              Dismiss
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 dark:bg-amber-900/20 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-amber-700 dark:text-amber-400 font-semibold w-16">
                    Row #
                  </th>
                  <th className="text-left px-4 py-2 text-amber-700 dark:text-amber-400 font-semibold">
                    Preview
                  </th>
                  <th className="text-left px-4 py-2 text-amber-700 dark:text-amber-400 font-semibold">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {uploadFailedRows.map((fr, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-amber-100 dark:border-amber-800 odd:bg-white dark:odd:bg-slate-800 even:bg-amber-50/40 dark:even:bg-amber-900/10"
                  >
                    <td className="px-4 py-1.5 text-slate-600 dark:text-slate-400">
                      {fr.row}
                    </td>
                    <td className="px-4 py-1.5 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                      {fr.preview || "—"}
                    </td>
                    <td className="px-4 py-1.5 text-rose-600 dark:text-rose-400">
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
  </div>
)}
    </div>
  );
}
