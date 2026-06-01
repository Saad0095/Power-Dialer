import { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import FormSelect from '../common/FormSelect.jsx';
import { completeCall, getAvailableAgents } from '../../services/api.js';
import { Loader } from 'lucide-react';

const DISPOSITIONS = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'followup', label: 'Follow Up' },
  { value: 'callback', label: 'Callback' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'wrong-number', label: 'Wrong Number' },
  { value: 'not-interested', label: 'Not Interested' },
];

const SENTIMENTS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const CALL_QUALITIES = [
  { value: '', label: 'Not Rated' },
  { value: 1, label: '1 - Very Poor' },
  { value: 2, label: '2 - Poor' },
  { value: 3, label: '3 - Fair' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' },
];

export default function CompleteCallModal({
  isOpen,
  lead,
  callLog,
  onClose,
  onSuccess,
  onError,
  currentAgent,
}) {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState(currentAgent?._id || '');
  const [disposition, setDisposition] = useState('followup');
  const [agentNotes, setAgentNotes] = useState('');
  const [sentiment, setSentiment] = useState('neutral');
  const [callQuality, setCallQuality] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [recordingSid, setRecordingSid] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load agents on modal open
  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  // Set agent ID when lead changes
  useEffect(() => {
    if (callLog?.agent?._id) {
      setAgentId(callLog.agent._id);
    } else if (currentAgent?._id) {
      setAgentId(currentAgent._id);
    }
  }, [lead, callLog, currentAgent]);

  const loadAgents = async () => {
    try {
      const agentsList = await getAvailableAgents();
      setAgents(agentsList);
    } catch (error) {
      console.error('Failed to load agents:', error);
      onError?.('Failed to load agents');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lead || !agentId) {
      onError?.('Lead and agent are required');
      return;
    }

    if (disposition === 'followup' && !followUpDate) {
      onError?.('Follow-up date is required for callbacks');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        agentId,
        disposition,
        agentNotes,
        sentiment,
        callQuality: callQuality !== '' ? parseInt(callQuality) : null,
      };

      if (disposition === 'followup' && followUpDate) {
        data.followUpDate = new Date(followUpDate).toISOString();
      }

      if (recordingSid) {
        data.recordingSid = recordingSid;
        data.recordingUrl = recordingUrl;
      }

      const result = await completeCall(lead._id, data);
      onSuccess?.(result);
      onClose();
      
      // Reset form
      setAgentNotes('');
      setDisposition('interested');
      setSentiment('neutral');
      setCallQuality('');
      setFollowUpDate('');
      setRecordingSid('');
      setRecordingUrl('');
    } catch (error) {
      onError?.(error.response?.data?.error || 'Failed to complete call');
    } finally {
      setIsLoading(false);
    }
  };

  const agentOptions = agents.map(agent => ({
    value: agent._id,
    label: agent.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Complete Call - ${lead?.businessName || 'N/A'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lead Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Phone</p>
            <p className="text-slate-900 dark:text-white font-medium text-sm">{lead?.phoneNumber}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Business</p>
            <p className="text-slate-900 dark:text-white font-medium text-sm">{lead?.businessName}</p>
          </div>
        </div>

        {/* Agent Selection */}
        {agentOptions.length > 0 && (
          <FormSelect
            label="Agent"
            name="agent"
            options={agentOptions}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            required
          />
        )}

        {/* Disposition */}
        <FormSelect
          label="Disposition"
          name="disposition"
          options={DISPOSITIONS}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
          required
        />

        {/* Agent Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Call Notes
          </label>
          <textarea
            value={agentNotes}
            onChange={(e) => setAgentNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            placeholder="Add notes about the call..."
            rows={3}
          />
        </div>

        {/* Sentiment & Quality */}
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Sentiment"
            name="sentiment"
            options={SENTIMENTS}
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
          />
          <FormSelect
            label="Call Quality"
            name="quality"
            options={CALL_QUALITIES}
            value={callQuality}
            onChange={(e) => setCallQuality(e.target.value)}
          />
        </div>

        {/* Follow-up Date (if callback) */}
        {disposition === 'followup' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Follow-up Date & Time *
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              required={disposition === 'followup'}
            />
          </div>
        )}

        {/* Recording Fields */}
        <div className="space-y-3 p-3 bg-slate-100 dark:bg-slate-700/30 rounded-lg border border-slate-300 dark:border-slate-600">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Recording (Optional)</p>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Recording SID
            </label>
            <input
              type="text"
              value={recordingSid}
              onChange={(e) => setRecordingSid(e.target.value)}
              className="w-full px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              placeholder="Twilio recording ID..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Recording URL
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              className="w-full px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
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
            disabled={isLoading || !agentId}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            Complete Call
          </button>
        </div>
      </form>
    </Modal>
  );
}
