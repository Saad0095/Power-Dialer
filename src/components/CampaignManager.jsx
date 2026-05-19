import { useState, useEffect } from 'react';
import { getCampaigns, deleteCampaign } from '../services/api.js';
import CreateCampaignModal from './modals/CreateCampaignModal.jsx';
import EditCampaignModal from './modals/EditCampaignModal.jsx';
import ConfirmModal from './common/ConfirmModal.jsx';
import { Plus, Edit2, Trash2, Loader, ChevronDown } from 'lucide-react';

export default function CampaignManager({ selectedCampaignId, onCampaignSelect, onShowNotification }) {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getParentName = (campaign) => {
    if (!campaign?.parentCampaign) return 'None';
    if (typeof campaign.parentCampaign === 'object') {
      return campaign.parentCampaign.name || 'Parent campaign';
    }
    return 'Parent campaign';
  };

  const getDialerSummary = (campaign) => {
    if (!campaign?.parentCampaign) return 'Root campaign';
    if (campaign?.dialerType === 'auto') {
      const assigned = campaign?.assignedAgent;
      if (assigned && typeof assigned === 'object') {
        return `Auto - ${assigned.name || assigned.email || 'assigned'}`;
      }
      return 'Auto';
    }
    if (campaign?.dialerType === 'parallel') {
      const count = Array.isArray(campaign?.assignedAgents) ? campaign.assignedAgents.length : 0;
      return `Parallel - ${count} agents`;
    }
    return 'Child campaign';
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getCampaigns();
      const callerCampaigns = (Array.isArray(data) ? data : []).filter((campaign) => campaign.pipelineType === 'caller');
      setCampaigns(callerCampaigns);
      if (callerCampaigns.length > 0 && !selectedCampaignId) {
        onCampaignSelect?.(callerCampaigns[0]._id);
      }
    } catch (error) {
      onShowNotification?.('Failed to load campaigns', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = (newCampaign) => {
    setCampaigns(prev => [...prev, newCampaign]);
    onShowNotification?.('Campaign created successfully', 'success');
    onCampaignSelect?.(newCampaign._id);
  };

  const handleUpdateSuccess = (updatedCampaign) => {
    setCampaigns(prev => prev.map(c => c._id === updatedCampaign._id ? updatedCampaign : c));
    onShowNotification?.('Campaign updated successfully', 'success');
  };

  const handleDeleteClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteConfirm(true);
    setIsDropdownOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCampaign(selectedCampaign._id);
      setCampaigns(prev => prev.filter(c => c._id !== selectedCampaign._id));
      
      if (selectedCampaignId === selectedCampaign._id && campaigns.length > 1) {
        const next = campaigns.find(c => c._id !== selectedCampaign._id);
        onCampaignSelect?.(next?._id);
      }
      
      onShowNotification?.('Campaign deleted successfully', 'success');
    } catch (error) {
      onShowNotification?.(error.response?.data?.error || 'Failed to delete campaign', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setSelectedCampaign(null);
    }
  };

  const currentCampaign = campaigns.find(c => c._id === selectedCampaignId);

  return (
    <>
      {/* Campaign Selector */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white flex items-center justify-between hover:border-cyan-400 dark:hover:border-cyan-400 transition"
        >
          <div className="text-left">
            <p className="text-xs text-slate-600 dark:text-slate-400">Current Campaign</p>
            <p className="font-semibold text-slate-900 dark:text-white">{currentCampaign?.name || 'Select a campaign'}</p>
          </div>
          <ChevronDown className={`w-5 h-5 transition ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-slate-900/50 z-40">
            {/* Campaign List */}
            <div className="max-h-64 overflow-y-auto">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0 cursor-pointer flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition ${
                    selectedCampaignId === campaign._id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                  }`}
                  onClick={() => {
                    onCampaignSelect?.(campaign._id);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium">{campaign.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {campaign.parentCampaign ? `Child of ${getParentName(campaign)}` : 'Root campaign'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {getDialerSummary(campaign)}
                      {campaign.assignedClient && ` • Client: ${campaign.assignedClient.companyName || campaign.assignedClient.name}`}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 bg-primary-500/20 text-primary-500 rounded hover:bg-primary-500/30 transition cursor-pointer"
                      title="Edit campaign"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(campaign);
                      }}
                      className="p-1.5 bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30 transition cursor-pointer"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* New Campaign Button */}
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-2 font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        )}

        {/* Quick Create Button */}
        {!isDropdownOpen && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="absolute right-0 top-0 bottom-0 px-3 text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-500 transition cursor-pointer"
            title="Create new campaign"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-2 flex items-center gap-2 text-primary-500">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading campaigns...</span>
        </div>
      )}

      {/* Modals */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        onError={(error) => onShowNotification?.(error, 'error')}
      />

      <EditCampaignModal
        isOpen={showEditModal}
        campaign={selectedCampaign}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCampaign(null);
        }}
        onSuccess={handleUpdateSuccess}
        onError={(error) => onShowNotification?.(error, 'error')}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${selectedCampaign?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </>
  );
}
