import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { getCallerVisibleFields } from '../../utils/leadFieldConfig.js';
import Modal from '../common/Modal.jsx';
import FormInput from '../common/FormInput.jsx';
import FormSelect from '../common/FormSelect.jsx';
import { updateDisposition, updateLead } from '../../services/api.js';
import { Save, X, AlertCircle, Calendar, Clock } from 'lucide-react';

// Rendered in the appointment detail card (shown only when disposition = appointment)
const APPOINTMENT_CARD_KEYS = ['appointmentDate', 'appointmentTime', 'appointmentStatus'];

// Rendered in the followup detail card (shown only when disposition = followup)
const FOLLOWUP_CARD_KEYS = ['followUpDate', 'followUpTime'];

// Shown in main grid ONLY when disposition is appointment or followup
const CONDITIONAL_GRID_KEYS = [
  'currentSetup',
  'servicesGetting',
  'frequency',
  'currentChallenges',
  'interestLevel',
  'agentNotes',
  'managerNotes',
  'recordingLink',
  'callQuality',
];

// Never shown in main grid (handled by disposition card or detail cards)
const NEVER_IN_GRID = new Set([
  'disposition',
  'dialerStatus', // Hide dialer status everywhere
  ...APPOINTMENT_CARD_KEYS,
  ...FOLLOWUP_CARD_KEYS,
]);

export default function EditLeadModal({ isOpen, lead, onClose, onSave }) {
  const { user } = useAuth();
  const visibleFields = useMemo(
    () => getCallerVisibleFields(user?.role, true),
    [user?.role]
  );

  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if caller-agent edits should be locked for past appointments
  const isCallerAgent = user?.role === 'caller-agent';
  const appointmentDateValue = lead?.appointmentDate || formData?.appointmentDate || null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const appointmentLocked = Boolean(
    isCallerAgent &&
      (lead?.disposition === 'appointment' || formData?.disposition === 'appointment') &&
      appointmentDateValue &&
      new Date(appointmentDateValue) < startOfToday,
  );
  const canEdit = !appointmentLocked;

  useEffect(() => {
    if (lead) {
      const newFormData = {};
      const seen = new Set();
      visibleFields.forEach(field => {
        if (!seen.has(field.key)) {
          seen.add(field.key);
          newFormData[field.key] = lead[field.key] || '';
        }
      });
      setFormData(newFormData);
    }
  }, [lead, isOpen, visibleFields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canEdit) {
      setError('Appointment date has passed — appointment edits are locked for agents.');
      return;
    }
    try {
      setIsLoading(true);
      const updateData = {};
      const seen = new Set();
      visibleFields.forEach(field => {
        if (seen.has(field.key)) return;
        seen.add(field.key);
        if (field.key in formData && !field.readOnly) {
          if (user?.role === 'caller-agent' && field.key === 'appointmentStatus') return;
          updateData[field.key] = formData[field.key] || null;
        }
      });
      const updated =
        user?.role === 'caller-agent'
          ? await updateDisposition(lead._id, updateData)
          : await updateLead(lead._id, updateData);
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lead');
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead) return null;

  // Deduplicated editable fields
  const editableFields = (() => {
    const seen = new Set();
    return visibleFields.filter(f => {
      if (seen.has(f.key)) return false;
      seen.add(f.key);
      if (user?.role === 'manager' || user?.role === 'admin') return true;
      if (f.readOnly) return false;
      if (user?.role === 'caller-agent' && f.key === 'appointmentStatus') return false;
      return true;
    });
  })();

  const dispositionField = editableFields.find(f => f.key === 'disposition');
  const currentDisposition = formData.disposition || '';
  const showConditional =
    currentDisposition === 'appointment' || currentDisposition === 'followup';

  // Main grid: exclude everything handled by cards, plus conditionals when not applicable
  const mainGridFields = editableFields.filter(f => {
    if (NEVER_IN_GRID.has(f.key)) return false;
    if (CONDITIONAL_GRID_KEYS.includes(f.key)) return showConditional;
    return true;
  });

  const modalTitle =
    user?.role === 'caller-agent'
      ? `Edit Disposition - ${lead.businessName || 'N/A'}`
      : `Edit Lead - ${lead.businessName || 'N/A'}`;

  const renderField = (field) => {
    const fieldDisabled = field.readOnly || (isCallerAgent && !canEdit);

    if (field.type === 'select') {
      return (
        <FormSelect
          label={field.label}
          name={field.key}
          value={formData[field.key] || ''}
          onChange={handleChange}
          disabled={fieldDisabled}
          options={field.options?.map(opt => ({ value: opt, label: opt })) ?? []}
        />
      );
    }
    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            name={field.key}
            checked={formData[field.key] || false}
            onChange={handleChange}
            disabled={field.readOnly || (isCallerAgent && !canEdit)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-500 cursor-pointer"
          />
          {field.label}
        </label>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">
            {field.label}
          </label>
          <textarea
            name={field.key}
            value={formData[field.key] || ''}
            onChange={handleChange}
            disabled={field.readOnly || (isCallerAgent && !canEdit)}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
            placeholder={field.label}
          />
        </div>
      );
    }
    return (
      <FormInput
        label={field.label}
        name={field.key}
        type={field.type}
        value={formData[field.key] || ''}
        onChange={handleChange}
        disabled={field.readOnly || (isCallerAgent && !canEdit)}
        placeholder={field.label}
      />
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-2xl" bodyClassName="max-h-[32rem] overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-4">

        {/* Save button — sticky at top */}
        <div className="flex gap-3 justify-end sticky top-0 z-10 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !canEdit}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/30"
          >
            <Save className="w-4 h-4" />
            {isLoading
              ? 'Saving...'
              : user?.role === 'caller-agent'
              ? 'Update Disposition'
              : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
        )}

        {!canEdit && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex items-start gap-3">
            <Loader2 className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700">This appointment date has passed — agents cannot edit appointment leads after the appointment date.</p>
          </div>
        )}

        {/* Disposition — always first */}
        {dispositionField && (
          <div className="p-4 rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 shadow-sm">
            <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-bold mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20">
                <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              {dispositionField.label}
            </label>
            <select
              name={dispositionField.key}
              value={formData[dispositionField.key] || ''}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-cyan-500/30 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            >
              <option value="">Select Disposition</option>
              {dispositionField.options?.map(opt => (
                <option key={opt} value={opt}>
                  {opt.replace(/-/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Appointment card — only when disposition = appointment */}
        {currentDisposition === 'appointment' && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Appointment Details
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editableFields
                .filter(f => APPOINTMENT_CARD_KEYS.includes(f.key))
                .map(field => (
                  <div key={field.key}>{renderField(field)}</div>
                ))}
            </div>
          </div>
        )}

        {/* Follow-up card — only when disposition = followup */}
        {currentDisposition === 'followup' && (
          <div className="p-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Follow-up Details
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editableFields
                .filter(f => FOLLOWUP_CARD_KEYS.includes(f.key))
                .map(field => (
                  <div key={field.key}>{renderField(field)}</div>
                ))}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainGridFields.map(field => (
            <div key={field.key}>{renderField(field)}</div>
          ))}
        </div>

      </form>
    </Modal>
  );
}