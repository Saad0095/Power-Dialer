import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api, {
  bulkAssignSingleAgentToCampaigns,
  bulkClearCampaignAssignments,
  getAllAgents,
  getCampaigns,
  recycleVoicemails,
} from "../services/api";
import {
  isManager as checkIsManager,
  getRoleHomeRoute,
} from "../utils/roleUtils";
import CampaignsFiltersPanel from "../components/campaigns/CampaignsFiltersPanel";
import CampaignsPageHeader from "../components/campaigns/CampaignsPageHeader";
import CampaignsTable from "../components/campaigns/CampaignsTable";
import CampaignUploadModal from "../components/campaigns/CampaignUploadModal";
import CreateCampaignModal from "../components/modals/CreateCampaignModal";
import EditCampaignModal from "../components/modals/EditCampaignModal";
import HistoricalAgentsModal from "../components/modals/HistoricalAgentsModal";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CampaignsPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineTypeFilter, setPipelineTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCampaign, setHistoryCampaign] = useState(null);
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

  const canBulkAssign = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (user && !checkIsManager(user?.role)) {
      showNotification("Access denied", "error");
      navigate(getRoleHomeRoute(user?.role));
    }
  }, [navigate, showNotification, user]);

  const loadAgents = async () => {
    try {
      const response = await getAllAgents();
      const allAgents = response.data || response;
      let filtered = allAgents.filter(
        (agent) => agent.role === "caller-agent" || agent.role === "closer-agent",
      );

      // If current user is a team-lead, only show their team members
      if (user?.role === 'team-lead') {
        filtered = filtered.filter(a => (a.teamLead?._id || a.teamLead) === user._id);
      }

      setAgents(filtered);
    } catch (error) {
      showNotification("Failed to load agents", "error");
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await getCampaigns();
      const normalizedCampaigns = (Array.isArray(response) ? response : [])
        .map((campaign) => ({
          ...campaign,
          children: Array.isArray(campaign.children) ? campaign.children : [],
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      normalizedCampaigns.forEach((rootCampaign) => {
        rootCampaign.children.sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      });

      setCampaigns(normalizedCampaigns);
    } catch (error) {
      showNotification("Failed to load campaigns", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .map((rootCampaign) => {
        const rootMatchesSearch =
          !searchTerm ||
          rootCampaign.name.toLowerCase().includes(searchTerm.toLowerCase());

        const filteredChildren = rootCampaign.children.filter((childCampaign) => {
          const childMatchesSearch =
            !searchTerm ||
            childCampaign.name.toLowerCase().includes(searchTerm.toLowerCase());
          const childMatchesDialer =
            !dialerTypeFilter || childCampaign.dialerType === dialerTypeFilter;
          const isAssigned =
            childCampaign.assignedAgent ||
            (childCampaign.assignedAgents &&
              childCampaign.assignedAgents.length > 0);
          const childMatchesAssignment =
            !assignmentFilter ||
            (assignmentFilter === "assigned" ? isAssigned : !isAssigned);

          let childMatchesDate = true;
          if (dateRange.start) {
            childMatchesDate =
              childMatchesDate &&
              new Date(childCampaign.createdAt) >= new Date(dateRange.start);
          }
          if (dateRange.end) {
            childMatchesDate =
              childMatchesDate &&
              new Date(childCampaign.createdAt) <=
                new Date(`${dateRange.end}T23:59:59`);
          }

          return (
            childMatchesSearch &&
            childMatchesDialer &&
            childMatchesAssignment &&
            childMatchesDate
          );
        });

        if (
          rootMatchesSearch &&
          !dialerTypeFilter &&
          !assignmentFilter &&
          !dateRange.start &&
          !dateRange.end
        ) {
          return { ...rootCampaign, children: rootCampaign.children };
        }

        if (filteredChildren.length > 0) {
          return { ...rootCampaign, children: filteredChildren };
        }

        return null;
      })
      .filter(Boolean)
      .filter((rootCampaign) => {
        const rootMatchesPipeline =
          !pipelineTypeFilter ||
          rootCampaign.pipelineType === pipelineTypeFilter;

        let rootMatchesDate = true;
        if (dateRange.start) {
          rootMatchesDate =
            rootMatchesDate &&
            new Date(rootCampaign.createdAt) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
          rootMatchesDate =
            rootMatchesDate &&
            new Date(rootCampaign.createdAt) <=
              new Date(`${dateRange.end}T23:59:59`);
        }

        return rootMatchesPipeline && rootMatchesDate;
      });
  }, [
    assignmentFilter,
    campaigns,
    dateRange,
    dialerTypeFilter,
    pipelineTypeFilter,
    searchTerm,
  ]);

  const visibleCampaignIds = useMemo(
    () =>
      filteredCampaigns.flatMap((rootCampaign) => [
        rootCampaign._id,
        ...rootCampaign.children.map((childCampaign) => childCampaign._id),
      ]),
    [filteredCampaigns],
  );

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

  const toggleSelectCampaign = (campaignId, event) => {
    if (event) event.stopPropagation();

    setSelectedCampaignIds((previousIds) =>
      previousIds.includes(campaignId)
        ? previousIds.filter((id) => id !== campaignId)
        : [...previousIds, campaignId],
    );
  };

  const toggleSelectParent = (rootCampaign, event) => {
    if (event) event.stopPropagation();

    const childIds = rootCampaign.children.map((childCampaign) => childCampaign._id);
    const relatedIds = [rootCampaign._id, ...childIds];
    const areAllSelected = relatedIds.every((id) =>
      selectedCampaignIds.includes(id),
    );

    if (areAllSelected) {
      setSelectedCampaignIds((previousIds) =>
        previousIds.filter((id) => !relatedIds.includes(id)),
      );
      return;
    }

    setSelectedCampaignIds((previousIds) => [
      ...new Set([...previousIds, ...relatedIds]),
    ]);
  };

  const toggleExpandedRoot = (rootId) => {
    setExpandedRootIds((previousIds) => {
      const nextIds = new Set(previousIds);
      if (nextIds.has(rootId)) nextIds.delete(rootId);
      else nextIds.add(rootId);
      return nextIds;
    });
  };

  const toggleSelectAllVisible = () => {
    const areAllVisibleSelected =
      visibleCampaignIds.length > 0 &&
      visibleCampaignIds.every((id) => selectedCampaignIds.includes(id));

    setSelectedCampaignIds(areAllVisibleSelected ? [] : visibleCampaignIds);
  };

  const handleViewHistory = (campaign) => {
    setHistoryCampaign(campaign);
    setShowHistoryModal(true);
  };

  const goToCampaignLeads = (campaignId) => {
    navigate(`/manager/leads?campaignId=${campaignId}`);
  };

  const handleBulkAssign = async () => {
    if (!selectedAgentId || selectedCampaignIds.length === 0) return;

    setIsBulkAssigning(true);
    try {
      const childIdsOnly = selectedCampaignIds.filter((campaignId) =>
        campaigns.some((rootCampaign) =>
          rootCampaign.children.some(
            (childCampaign) => childCampaign._id === campaignId,
          ),
        ),
      );

      if (childIdsOnly.length === 0) {
        showNotification(
          "Please select child campaigns to assign agents",
          "warning",
        );
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
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to assign agent",
        "error",
      );
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleClearSelected = async () => {
    if (selectedCampaignIds.length === 0) return;

    if (
      !window.confirm(
        `Clear assignments for ${selectedCampaignIds.length} campaigns?`,
      )
    ) {
      return;
    }

    try {
      await bulkClearCampaignAssignments({ campaignIds: selectedCampaignIds });
      showNotification("Assignments cleared", "success");
      setSelectedCampaignIds([]);
      loadCampaigns();
    } catch (error) {
      showNotification("Failed to clear assignments", "error");
    }
  };

  const handleDelete = async (campaignId, event) => {
    if (event) event.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this campaign? All children and leads will be removed.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/campaigns/${campaignId}`);
      showNotification("Campaign deleted", "success");
      loadCampaigns();
    } catch (error) {
      showNotification("Failed to delete campaign", "error");
    }
  };

  const handleRemoveAgents = async (campaign, event) => {
    if (event) event.stopPropagation();
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

  const handleRecycleVoicemails = async (campaign) => {
    const isParentCampaign =
      !campaign.parentCampaign &&
      Array.isArray(campaign.children) &&
      campaign.children.length > 0;

    if (
      !window.confirm(
        isParentCampaign
          ? "Are you sure you want to recycle voicemails for all child campaigns under this parent? All completed/failed leads with a voicemail disposition will be added back to the dialing queue."
          : "Are you sure you want to recycle voicemails? All completed/failed leads with a voicemail disposition will be added back to the dialing queue.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await recycleVoicemails(campaign._id);
      showNotification(res.message || "Voicemails recycled successfully", "success");
      loadCampaigns();
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to recycle voicemails",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && campaigns.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <CampaignsPageHeader
        onCreateCampaign={() => setShowCreateModal(true)}
        onRefresh={loadCampaigns}
        canCreate={canBulkAssign}
      />

      <CampaignsFiltersPanel
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        pipelineTypeFilter={pipelineTypeFilter}
        onPipelineTypeChange={setPipelineTypeFilter}
        selectedCount={selectedCampaignIds.length}
        selectedAgentId={selectedAgentId}
        onSelectedAgentChange={setSelectedAgentId}
        agents={agents}
        onBulkAssign={canBulkAssign ? handleBulkAssign : undefined}
        onClearSelected={handleClearSelected}
        isBulkAssigning={isBulkAssigning}
        dialerTypeFilter={dialerTypeFilter}
        onDialerTypeChange={setDialerTypeFilter}
        assignmentFilter={assignmentFilter}
        onAssignmentFilterChange={setAssignmentFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onResetDateRange={() => setDateRange({ start: "", end: "" })}
        allSelectableIds={visibleCampaignIds}
        selectedCampaignIds={selectedCampaignIds}
        onToggleSelectAll={toggleSelectAllVisible}
      />

      <CampaignsTable
        campaigns={filteredCampaigns}
        isLoading={isLoading}
        expandedRootIds={expandedRootIds}
        selectedCampaignIds={selectedCampaignIds}
        onToggleParentSelection={toggleSelectParent}
        onToggleChildSelection={toggleSelectCampaign}
        onToggleExpanded={toggleExpandedRoot}
        onUpload={openUploadModal}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onViewLeads={goToCampaignLeads}
        onRemoveAgents={handleRemoveAgents}
        onViewHistory={handleViewHistory}
        onRecycleVoicemails={handleRecycleVoicemails}
      />

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

      <CampaignUploadModal
        isOpen={showUploadModal}
        campaign={uploadParentCampaign}
        failedRows={uploadFailedRows}
        onClose={closeUploadModal}
        onDismissFailedRows={() => setUploadFailedRows([])}
        onSuccess={(message, responseData) => {
          showNotification(message || "Upload complete", "success");
          if (responseData?.failedRows?.length) {
            setUploadFailedRows(responseData.failedRows);
          } else {
            setUploadFailedRows([]);
          }
        }}
        onError={(message) =>
          showNotification(message || "Upload failed", "error")
        }
        onUploadComplete={loadCampaigns}
      />
      <HistoricalAgentsModal
        isOpen={showHistoryModal}
        campaign={historyCampaign}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryCampaign(null);
        }}
      />
    </div>
  );
}
