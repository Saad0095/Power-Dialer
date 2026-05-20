import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import FormInput from '../common/FormInput.jsx';
import FormSelect from '../common/FormSelect.jsx';
import { getAllAgents, getCampaigns, updateCampaign } from '../../services/api.js';
import { Loader, Info, Settings, User as UserIcon, Users, Layers, AlertTriangle } from 'lucide-react';

export default function EditCampaignModal({ isOpen, campaign, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: '',
    parentCampaign: '',
    dialerType: '',
    assignedAgent: '',
    assignedAgents: [],
  });
  const [campaigns, setCampaigns] = useState([]);
  const [callerAgents, setCallerAgents] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isChildCampaign = Boolean(formData.parentCampaign);
  const isAutoDialer = isChildCampaign && formData.dialerType === 'auto';
  const isDirectDialer = isChildCampaign && formData.dialerType === 'direct';
  const isParallelDialer = isChildCampaign && formData.dialerType === 'parallel';

  const parentCampaignOptions = useMemo(
    () => campaigns
      .filter((item) => item.pipelineType === 'caller' && !item.parentCampaign && item._id !== campaign?._id)
      .map((item) => ({ value: item._id, label: item.name })),
    [campaigns, campaign?._id],
  );

  const callerAgentOptions = useMemo(
    () => callerAgents.map((agent) => ({ value: agent._id, label: `${agent.name} (${agent.email})` })),
    [callerAgents],
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadDependencies = async () => {
      try {
        const [campaignList, agentList] = await Promise.all([getCampaigns(), getAllAgents()]);
        setCampaigns(Array.isArray(campaignList) ? campaignList : []);
        setCallerAgents((Array.isArray(agentList) ? agentList : []).filter((agent) => ['caller-agent', 'team-lead'].includes(agent.role)));
      } catch (error) {
        onError?.('Failed to load campaign dependencies');
      }
    };

    loadDependencies();
  }, [isOpen, onError]);

  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        name: campaign.name || '',
        parentCampaign: campaign.parentCampaign?._id || campaign.parentCampaign || '',
        dialerType: campaign.dialerType || '',
        assignedAgent: campaign.assignedAgent?._id || campaign.assignedAgent || '',
        assignedAgents: (campaign.assignedAgents || []).map((agent) => agent?._id || agent).filter(Boolean),
      });
      setErrors({});
    }
  }, [campaign, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'parentCampaign' && !value) {
        next.dialerType = '';
        next.assignedAgent = '';
        next.assignedAgents = [];
      }

      if (name === 'dialerType') {
        if (value === 'auto') next.assignedAgents = [];
        if (value === 'parallel') next.assignedAgent = '';
        if (value === 'direct') {
          next.assignedAgent = '';
          next.assignedAgents = [];
        }
      }

      return next;
    });

    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleParallelAgentToggle = (agentId) => {
    setFormData((prev) => {
      const selected = new Set(prev.assignedAgents);
      if (selected.has(agentId)) selected.delete(agentId);
      else selected.add(agentId);
      return { ...prev, assignedAgents: Array.from(selected) };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Campaign name is required';
    if (formData.name.trim().length < 3) newErrors.name = 'Campaign name must be at least 3 characters';

    if (isChildCampaign && !formData.dialerType) {
      newErrors.dialerType = 'Dialer type is required for child campaigns';
    }

    if (isAutoDialer && !formData.assignedAgent) {
      newErrors.assignedAgent = 'Please select one caller-agent for auto campaigns';
    }

    if (isParallelDialer && (formData.assignedAgents.length < 3 || formData.assignedAgents.length > 4)) {
      newErrors.assignedAgents = 'Parallel campaigns require 3 to 4 caller-agents';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaign) return;

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const sanitizeId = (v) => (v === undefined || v === null ? undefined : (String(v) === 'null' ? null : (v === '' ? null : v)));
      const sanitizeArray = (arr) => (Array.isArray(arr) ? arr.map((a) => (String(a) === 'null' ? null : a)).filter(Boolean) : []);

      const payload = {
        name: formData.name.trim(),
        pipelineType: campaign.pipelineType, // Keep original pipeline type
        parentCampaign: sanitizeId(formData.parentCampaign) || null,
      };

      if (isChildCampaign) payload.dialerType = formData.dialerType;
      if (isAutoDialer) {
        payload.assignedAgent = sanitizeId(formData.assignedAgent) || null;
        payload.assignedAgents = [];
      }
      if (isDirectDialer) {
        payload.assignedAgent = null;
        payload.assignedAgents = [];
      }
      if (isParallelDialer) {
        payload.assignedAgent = null;
        payload.assignedAgents = sanitizeArray(formData.assignedAgents);
      }

      const updated = await updateCampaign(campaign._id, payload);
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      onError?.(error.response?.data?.error || 'Failed to update campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Campaign: ${campaign?.name}`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            <Info className="w-3.5 h-3.5" />
            General Information
          </div>
          
          <FormInput
            label="Campaign Name"
            name="name"
            placeholder="Enter campaign name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
             <span className="text-xs font-bold text-slate-500">Pipeline Type:</span>
             <span className={`text-xs font-black uppercase tracking-widest ${campaign?.pipelineType === 'caller' ? 'text-blue-500' : 'text-purple-500'}`}>
                {campaign?.pipelineType}
             </span>
             <Info className="w-3.5 h-3.5 text-slate-400 ml-auto" title="Pipeline type cannot be changed after creation" />
          </div>
        </div>

        {/* Section 2: Hierarchy */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            <Layers className="w-3.5 h-3.5" />
            Structure & Placement
          </div>

          <FormSelect
            label="Parent Campaign (optional)"
            name="parentCampaign"
            value={formData.parentCampaign}
            onChange={handleChange}
            options={parentCampaignOptions}
            placeholder="No parent (Top-level)"
          />

          {isChildCampaign ? (
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30 flex gap-3">
              <Info className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                This is a child campaign. It requires a dialer type and agent assignments to function.
              </p>
            </div>
          ) : (
             <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                This is a parent campaign. Changing it to a child campaign will require you to set up a dialer and assign agents.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Dialer Configuration */}
        {isChildCampaign && (
          <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <Settings className="w-3.5 h-3.5" />
              Agent Assignment & Dialer
            </div>

            <FormSelect
              label="Dialer Type"
              name="dialerType"
              value={formData.dialerType}
              onChange={handleChange}
              options={[
                { value: 'auto', label: 'Auto (Single Agent)' },
                { value: 'direct', label: 'Direct (Shared Direct Dialer)' },
                { value: 'parallel', label: 'Parallel (Agent Pool)' },
              ]}
              error={errors.dialerType}
              required
            />

            {isAutoDialer && (
              <FormSelect
                label="Assigned Caller Agent"
                name="assignedAgent"
                value={formData.assignedAgent}
                onChange={handleChange}
                options={callerAgentOptions}
                error={errors.assignedAgent}
                required
                placeholder="Select an agent..."
              />
            )}

            {isDirectDialer && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs font-medium text-cyan-800 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300">
                Direct campaigns are shared across direct dialer users and do not require agent assignment.
              </div>
            )}

            {isParallelDialer && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Assigned Agent Pool <span className="text-[10px] font-normal text-slate-500">(3-4 agents required)</span>
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-2 scrollbar-theme">
                  <div className="grid grid-cols-1 gap-1">
                    {callerAgents.map((agent) => {
                      const isSelected = formData.assignedAgents.includes(agent._id);
                      return (
                        <label 
                          key={agent._id} 
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleParallelAgentToggle(agent._id)}
                          />
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200'}`}>
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{agent.email}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {errors.assignedAgents && <p className="text-rose-500 text-xs font-bold mt-1">{errors.assignedAgents}</p>}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-500/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Update Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
