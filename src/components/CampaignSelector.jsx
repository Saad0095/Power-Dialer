import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { getCampaigns } from '../services/api';
import CreateCampaignModal from './modals/CreateCampaignModal';

export default function CampaignSelector({
  onCampaignSelect,
  onSelect,
  selectedCampaignId,
  selectedId,
  isLoading,
  onShowNotification,
  refreshKey = 0,
  childDialerType = null,
  childOnly = false,
}) {
  const [campaignRoots, setCampaignRoots] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');

  // Support both prop names for backwards compatibility
  const handleSelect = onCampaignSelect || onSelect;
  const currentSelectedId = selectedCampaignId || selectedId;

  const getAssignmentLabel = (campaign) => {
    if (campaign?.dialerType === 'auto') {
      const assigned = campaign?.assignedAgent;
      if (!assigned) return 'Unassigned';
      if (typeof assigned === 'object') return assigned.name || assigned.email || 'Assigned';
      return 'Assigned';
    }

    if (campaign?.dialerType === 'parallel') {
      const agents = Array.isArray(campaign?.assignedAgents) ? campaign.assignedAgents : [];
      if (!agents.length) return 'Unassigned';
      const namedAgents = agents
        .map((agent) => (typeof agent === 'object' ? (agent.name || agent.email || null) : null))
        .filter(Boolean);
      return namedAgents.length ? namedAgents.join(', ') : `${agents.length} agents`;
    }

    if (campaign?.dialerType === 'direct') {
      return 'Shared Direct Dialer';
    }

    return 'N/A';
  };

  const findSelectedCampaign = () => {
    if (!currentSelectedId) return null;

    for (const root of campaignRoots) {
      if (String(root._id) === String(currentSelectedId)) {
        return { ...root, __isChild: false, __parentName: null };
      }

      const children = Array.isArray(root.children) ? root.children : [];
      const match = children.find((child) => String(child._id) === String(currentSelectedId));
      if (match) {
        return { ...match, __isChild: true, __parentName: root.name };
      }
    }

    return null;
  };

  const selectedCampaign = findSelectedCampaign();

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getCampaigns();
      const rootCampaigns = Array.isArray(data) ? data : (data?.data || []);
      const callerRoots = rootCampaigns
        .filter((root) => root.pipelineType === 'caller')
        .map((root) => ({
          ...root,
          children: (Array.isArray(root.children) ? root.children : [])
            .filter((child) => {
              if (child.pipelineType !== 'caller') return false;
              if (!childDialerType) return true;
              return child.dialerType === childDialerType;
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((root) => (childOnly ? root.children.length > 0 : true))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCampaignRoots(callerRoots);
    } catch (err) {
      setError('Failed to load campaigns');
      if (onShowNotification) {
        onShowNotification('Failed to load campaigns', 'error');
      }
      console.error(err);
    }
  }, [childDialerType, childOnly, onShowNotification]);

  // Fetch campaigns on mount/refresh
  useEffect(() => {
    const timerId = setTimeout(() => {
      loadCampaigns();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadCampaigns, refreshKey]);

  const handleCreateSuccess = async (newCampaign) => {
    setShowCreateModal(false);
    setError('');
    await loadCampaigns();
    if (newCampaign?._id) {
      handleSelect(newCampaign._id);
    }
    onShowNotification?.('Campaign created successfully', 'success');
  };


  // Filter campaigns by search term
  const filteredCampaignRoots = campaignRoots
    .map((root) => {
      const rootMatches = !searchTerm || root.name.toLowerCase().includes(searchTerm.toLowerCase());
      const filteredChildren = Array.isArray(root.children)
        ? root.children.filter((child) => !searchTerm || child.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];
      if (rootMatches) {
        return { ...root, children: root.children || [] };
      }
      if (filteredChildren.length > 0) {
        return { ...root, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="bg-linear-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700 mb-6">
      <h2 className="text-xl font-bold mb-4 text-primary-500">Select Campaign</h2>

      {childDialerType && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Showing only {childDialerType.toUpperCase()} child campaigns.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-stretch md:items-center">
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search campaigns..."
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 md:w-64"
        />
        {/* Campaign Dropdown */}
        <select
          value={currentSelectedId || ''}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={isLoading || filteredCampaignRoots.length === 0}
          className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500"
        >
          <option value="">Select a campaign...</option>
          {filteredCampaignRoots.map((root) => {
            const children = Array.isArray(root.children) ? root.children : [];
            return (
              <optgroup key={root._id} label={`Parent: ${root.name}`}>
                {!childOnly && <option value={root._id}>{`Parent - ${root.name}`}</option>}
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {`Child - ${child.name} (${(child.dialerType || 'N/A').toUpperCase()})`}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Campaign Hierarchy */}
      {filteredCampaignRoots.length > 0 && (
        <div className="mb-4 space-y-3 max-h-72 overflow-y-auto pr-1">
          {filteredCampaignRoots.map((root) => {
            const children = Array.isArray(root.children) ? root.children : [];
            const rootSelected = String(currentSelectedId) === String(root._id);

            return (
              <div key={root._id} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900/30">
                <div
                  className={`w-full text-left px-3 py-2 rounded-t-lg transition ${!childOnly && rootSelected ? 'bg-primary-500/20' : 'bg-slate-50/60 dark:bg-slate-900/40'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{root.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Parent campaign</p>
                    </div>
                    {/* <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Leads: {root?.metrics?.totalLeads || 0}
                    </span> */}
                  </div>
                </div>

                {children.length > 0 ? (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-2 py-2 space-y-1">
                    {children.map((child) => {
                      const childSelected = String(currentSelectedId) === String(child._id);
                      return (
                        <button
                          key={child._id}
                          type="button"
                          onClick={() => handleSelect(child._id)}
                          className={`w-full text-left rounded-md px-3 py-2 transition ${childSelected ? 'bg-primary-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{child.name}</p>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 uppercase">
                              {child.dialerType || 'N/A'}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                            <span>Assigned: {getAssignmentLabel(child)}</span>
                            <span>Leads: {child?.metrics?.totalLeads || 0}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    No child campaigns yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Campaign Info */}
      {selectedCampaign && (
        <div className="p-3 bg-primary-500/20 border border-primary-500/50 rounded">
          <p className="text-primary-500 text-sm">✓ Selected: {selectedCampaign.name}</p>
          <p className="text-primary-600/90 dark:text-primary-300 text-xs mt-1">
            {selectedCampaign.__isChild
              ? `Child of ${selectedCampaign.__parentName} • Dialer ${selectedCampaign.dialerType || 'N/A'} • Assigned ${getAssignmentLabel(selectedCampaign)}`
              : 'Parent campaign'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        onError={(message) => {
          const nextMessage = message || 'Failed to create campaign';
          setError(nextMessage);
          onShowNotification?.(nextMessage, 'error');
        }}
      />
    </div>
  );
}
