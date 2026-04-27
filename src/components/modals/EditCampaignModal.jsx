import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import FormInput from '../common/FormInput.jsx';
import FormSelect from '../common/FormSelect.jsx';
import { getAllAgents, getCampaigns, updateCampaign } from '../../services/api.js';
import { Loader } from 'lucide-react';

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
        setCallerAgents((Array.isArray(agentList) ? agentList : []).filter((agent) => agent.role === 'caller-agent'));
      } catch (error) {
        onError?.('Failed to load campaign dependencies');
      }
    };

    loadDependencies();
  }, [isOpen, onError]);

  useEffect(() => {
    if (campaign) {
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
      // sanitize inputs to avoid sending string "null" or empty values
      const sanitizeId = (v) => (v === undefined || v === null ? undefined : (String(v) === 'null' ? null : (v === '' ? null : v)));
      const sanitizeArray = (arr) => (Array.isArray(arr) ? arr.map((a) => (String(a) === 'null' ? null : a)).filter(Boolean) : []);

      const payload = {
        name: formData.name.trim(),
        pipelineType: 'caller',
        parentCampaign: sanitizeId(formData.parentCampaign) || null,
      };

      if (isChildCampaign) payload.dialerType = formData.dialerType;
      if (isAutoDialer) {
        payload.assignedAgent = sanitizeId(formData.assignedAgent) || null;
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Campaign">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Campaign Name"
          name="name"
          placeholder="Enter campaign name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <FormSelect
          label="Parent Campaign (optional)"
          name="parentCampaign"
          value={formData.parentCampaign}
          onChange={handleChange}
          options={parentCampaignOptions}
        />

        <div className="mb-4 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
          {isChildCampaign
            ? 'Child caller campaigns require dialer configuration and assignment rules.'
            : 'Top-level caller campaigns do not require dialer type.'}
        </div>

        {isChildCampaign && (
          <>
            <FormSelect
              label="Dialer Type"
              name="dialerType"
              value={formData.dialerType}
              onChange={handleChange}
              options={[
                { value: 'auto', label: 'Auto (single agent)' },
                { value: 'parallel', label: 'Parallel (agent pool)' },
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
              />
            )}

            {isParallelDialer && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Assigned Caller Agent Pool (3-4)
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 space-y-2">
                  {callerAgents.map((agent) => (
                    <label key={agent._id} className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={formData.assignedAgents.includes(agent._id)}
                        onChange={() => handleParallelAgentToggle(agent._id)}
                      />
                      <span>{agent.name} ({agent.email})</span>
                    </label>
                  ))}
                </div>
                {errors.assignedAgents && <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">{errors.assignedAgents}</p>}
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            Update Campaign
          </button>
        </div>
      </form>
    </Modal>
  );
}
