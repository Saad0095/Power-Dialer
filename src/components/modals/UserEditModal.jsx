import { Shield, Clock, User, Mail, Lock, Users } from 'lucide-react';
import Modal from '../common/Modal';

const DEFAULT_SHIFT_START = '19:00';
const DEFAULT_SHIFT_END = '04:00';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

export default function UserEditModal({
  isOpen,
  userItem,
  editForm,
  setEditForm,
  isSavingEdit,
  availableRoles,
  getRoleLabel,
  allUsers = [],
  onSave,
  onCancel,
  editError = '',
}) {
  if (!userItem) return null;

  const isTeamLead = (editForm.role || userItem.role) === 'team-lead';

  const assignableAgents = (allUsers || []).filter(
    u => ['caller-agent', 'closer-agent', 'scrapper'].includes(u.role) && u._id !== userItem._id
  );

  const currentIds = editForm.assignedAgentIds || [];

  const toggleAgent = (agentId) => {
    setEditForm(prev => {
      const ids = prev.assignedAgentIds || [];
      return {
        ...prev,
        assignedAgentIds: ids.includes(agentId)
          ? ids.filter(id => id !== agentId)
          : [...ids, agentId],
      };
    });
  };

  const roleColors = {
    'admin': 'bg-red-500/20 text-red-600 dark:text-red-400',
    'manager': 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    'caller-agent': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    'closer-agent': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'scrapper': 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    'team-lead': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    'client': 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={`Edit User — ${userItem.name}`}
      maxWidth="max-w-2xl"
      closeOnBackdropClick={false}
      breakSafe={true}
    >
      <div className="space-y-6">

        {/* ── Identity ── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Identity
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                disabled={isSavingEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                disabled={isSavingEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </section>

        {/* ── Role & Status ── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Role & Status
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role</label>
              <select
                value={editForm.role}
                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                disabled={isSavingEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                {availableRoles.map(r => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
              {editForm.role && (
                <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${roleColors[editForm.role] || ''}`}>
                  {getRoleLabel(editForm.role)}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Account Status</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setEditForm(p => ({ ...p, isActive: true }))}
                  disabled={isSavingEdit}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${editForm.isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-400/40' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                >
                  ✓ Active
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm(p => ({ ...p, isActive: false }))}
                  disabled={isSavingEdit}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${!editForm.isActive ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-400/40' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                >
                  ✕ Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Team Lead assignment (for non-team-lead roles) */}
          {!isTeamLead && userItem.role !== 'admin' && userItem.role !== 'manager' && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Assigned Team Lead</label>
              <select
                value={editForm.teamLead || ''}
                onChange={e => setEditForm(p => ({ ...p, teamLead: e.target.value }))}
                disabled={isSavingEdit}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
              >
                <option value="">None</option>
                {(allUsers || [])
                  .filter(u => ['team-lead', 'manager', 'admin'].includes(u.role) && u._id !== userItem._id)
                  .map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({getRoleLabel(u.role)})</option>
                  ))}
              </select>
            </div>
          )}
        </section>

        {/* ── Shift & Schedule ── */}
        {userItem.role !== 'client' && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Shift & Schedule
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Shift Start</label>
                <input
                  type="time"
                  value={editForm.shiftStartTime || DEFAULT_SHIFT_START}
                  onChange={e => setEditForm(p => ({ ...p, shiftStartTime: e.target.value }))}
                  disabled={isSavingEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Shift End</label>
                <input
                  type="time"
                  value={editForm.shiftEndTime || DEFAULT_SHIFT_END}
                  onChange={e => setEditForm(p => ({ ...p, shiftEndTime: e.target.value }))}
                  disabled={isSavingEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Expected Hrs</label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={editForm.expectedWorkHours}
                  onChange={e => setEditForm(p => ({ ...p, expectedWorkHours: e.target.value }))}
                  disabled={isSavingEdit}
                  placeholder="Auto"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Timezone</label>
                <input
                  type="text"
                  value={editForm.timezone || DEFAULT_TIMEZONE}
                  onChange={e => setEditForm(p => ({ ...p, timezone: e.target.value }))}
                  disabled={isSavingEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Team Members (team-lead only) ── */}
        {isTeamLead && assignableAgents.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Team Members
              <span className="ml-auto text-slate-400 normal-case font-normal">{currentIds.length} assigned</span>
            </p>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-600 divide-y divide-slate-200 dark:divide-slate-700">
              {assignableAgents.map(u => {
                const checked = currentIds.includes(u._id);
                return (
                  <label
                    key={u._id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${checked ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAgent(u._id)}
                      className="w-4 h-4 accent-cyan-500 shrink-0"
                      disabled={isSavingEdit}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email} · {getRoleLabel(u.role)}</p>
                    </div>
                    {u.teamLead && String(u.teamLead?._id || u.teamLead) !== String(userItem._id) && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full border border-amber-200 dark:border-amber-700">
                        Other TL
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Password ── */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Change Password
            <span className="normal-case font-normal text-slate-400">(optional)</span>
          </p>
          <input
            type="password"
            value={editForm.password}
            onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
            disabled={isSavingEdit}
            placeholder="Leave blank to keep current password"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters if changing</p>
        </section>

        {/* ── Error ── */}
        {editError && (
          <div className="px-4 py-3 bg-rose-500/10 border border-rose-400/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
            {editError}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSavingEdit}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(userItem)}
            disabled={isSavingEdit}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEdit ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
