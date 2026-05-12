import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import { getAllAgents, updateUser } from '../../services/api.js';
import { Mail, Trash2, ShieldCheck, Pencil, Save, X } from 'lucide-react';

export default function AgentListModal({ isOpen, onClose, onDeleteAgent, onShowNotification }) {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAgents();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load agents:', error);
      onShowNotification?.('Failed to load agents', 'error');
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (agent) => {
    if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
      onDeleteAgent?.(agent._id);
    }
  };

  const handleEditStart = (agent) => {
    setEditingAgentId(agent._id);
    setEditForm({
      name: agent.name || '',
      email: agent.email || '',
    });
  };

  const handleEditCancel = () => {
    setEditingAgentId(null);
    setEditForm({ name: '', email: '' });
  };

  const handleEditSave = async (agent) => {
    const trimmedName = editForm.name.trim();
    const trimmedEmail = editForm.email.trim().toLowerCase();

    if (!trimmedName) {
      onShowNotification?.('Agent name cannot be empty', 'error');
      return;
    }

    if (!trimmedEmail) {
      onShowNotification?.('Agent email cannot be empty', 'error');
      return;
    }

    const payload = {};
    if (trimmedName !== (agent.name || '')) payload.name = trimmedName;
    if (trimmedEmail !== (agent.email || '').toLowerCase()) payload.email = trimmedEmail;

    if (Object.keys(payload).length === 0) {
      handleEditCancel();
      return;
    }

    setIsSaving(true);
    try {
      const updateResult = await updateUser(agent._id, payload);
      const updatedAgent = updateResult?.user || updateResult;

      setAgents((prevAgents) =>
        prevAgents.map((existingAgent) =>
          existingAgent._id === agent._id
            ? {
                ...existingAgent,
                name: updatedAgent?.name ?? payload.name ?? existingAgent.name,
                email: updatedAgent?.email ?? payload.email ?? existingAgent.email,
              }
            : existingAgent
        )
      );

      onShowNotification?.('Agent details updated successfully', 'success');
      handleEditCancel();
    } catch (error) {
      console.error('Failed to update agent:', error);
      const message = error?.response?.data?.error || 'Failed to update agent details';
      onShowNotification?.(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Agents" maxWidth="max-w-2xl">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-8">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">No agents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent._id} className="border border-slate-300 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-600 transition">
              <div className="flex-1">
                {editingAgentId === agent._id ? (
                  <div className="space-y-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                      placeholder="Agent name"
                      disabled={isSaving}
                    />
                    <div className="relative">
                      <Mail className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                        placeholder="agent@email.com"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">{agent.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                      <Mail className="w-3 h-3" />
                      {agent.email}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded capitalize">
                  {agent.role}
                </span>
                {editingAgentId === agent._id ? (
                  <>
                    <button
                      onClick={() => handleEditSave(agent)}
                      className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save changes"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition disabled:opacity-50"
                      title="Cancel edit"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditStart(agent)}
                      className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition"
                      title="Edit agent"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent)}
                      className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={loadAgents}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition"
        >
          Refresh
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
