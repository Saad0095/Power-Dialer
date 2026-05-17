import React, { useState } from "react";
import { AlertCircle, Trash2, Pencil } from 'lucide-react';
import UserEditModal from './modals/UserEditModal';

export default function AgentTable({
  users,
  allUsers,
  isLoadingUsers,
  editingUserId,
  editForm,
  isSavingEdit,
  availableRoles,
  getRoleLabel,
  getRoleColor,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDeleteUser,
  setEditForm,
  editError = '',
}) {
  // Track which user's modal is open locally
  const [modalUser, setModalUser] = useState(null);

  const handleOpenEdit = (userItem) => {
    setModalUser(userItem);
    onEditStart(userItem);
  };

  const handleCloseEdit = () => {
    setModalUser(null);
    onEditCancel();
  };

  const handleSave = async (userItem) => {
    await onEditSave(userItem);
    setModalUser(null);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Agents</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((userItem) => {
                  const teamLeadName =
                    userItem.teamLead?.name ||
                    (typeof userItem.teamLead === 'string'
                      ? (allUsers || []).find(u => u._id === userItem.teamLead)?.name
                      : null);

                  return (
                    <tr
                      key={userItem._id}
                      className={`transition hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                        userItem.isActive === false ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{userItem.name}</p>
                          {userItem.isActive === false && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{userItem.email}</td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}>
                          {getRoleLabel(userItem.role)}
                        </span>
                      </td>

                      {/* Team Lead */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {teamLeadName || <span className="text-slate-400 dark:text-slate-600 italic text-xs">None</span>}
                      </td>

                      {/* Agents count (for team-leads) */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {userItem.role === 'team-lead' ? (
                          ((allUsers || []).filter(u => u.teamLead && (u.teamLead?._id || u.teamLead) === userItem._id).length)
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic text-xs">-</span>
                        )}
                      </td>

                      {/* Shift */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{userItem.shiftStartTime || '19:00'} – {userItem.shiftEndTime || '04:00'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {userItem.expectedWorkHours ? `${userItem.expectedWorkHours}h expected` : 'Auto'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(userItem)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteUser(userItem)}
                            className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <UserEditModal
        isOpen={Boolean(modalUser)}
        userItem={modalUser}
        editForm={editForm}
        setEditForm={setEditForm}
        isSavingEdit={isSavingEdit}
        availableRoles={availableRoles}
        getRoleLabel={getRoleLabel}
        allUsers={allUsers}
        onSave={handleSave}
        onCancel={handleCloseEdit}
        editError={editError}
      />
    </>
  );
}
