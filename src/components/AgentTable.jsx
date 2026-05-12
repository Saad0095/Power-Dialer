import React from "react";
import { AlertCircle, Trash2, Pencil, Save, X } from 'lucide-react';

export default function AgentTable({
  users,
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
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        {isLoadingUsers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Shift</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((userItem) => (
                <React.Fragment key={userItem._id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    <td className="px-6 py-4">
                      {editingUserId === userItem._id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                          placeholder="User name"
                          disabled={isSavingEdit}
                        />
                      ) : (
                        <p className="font-semibold text-slate-900 dark:text-white">{userItem.name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === userItem._id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                          placeholder="user@email.com"
                          disabled={isSavingEdit}
                        />
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400">{userItem.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === userItem._id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                          disabled={isSavingEdit}
                        >
                          <option value="">Select Role</option>
                          {availableRoles.map((r) => (
                            <option key={r} value={r}>
                              {getRoleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}>
                          {getRoleLabel(userItem.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="font-medium">
                        {(userItem.shiftStartTime || '19:00')} - {(userItem.shiftEndTime || '04:00')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {userItem.expectedWorkHours ? `${userItem.expectedWorkHours}h expected` : 'Auto expected hours'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {editingUserId === userItem._id ? (
                          <>
                            <button
                              onClick={() => onEditSave(userItem)}
                              disabled={isSavingEdit}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded transition disabled:opacity-50"
                              title="Save changes"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={onEditCancel}
                              disabled={isSavingEdit}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 rounded transition disabled:opacity-50"
                              title="Cancel edit"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onEditStart(userItem)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded transition"
                              title="Edit user"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteUser(userItem)}
                              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editingUserId === userItem._id && (
                    <tr className="bg-slate-100 dark:bg-slate-900/50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-2">
                              New Password (optional)
                            </label>
                            <input
                              type="password"
                              value={editForm.password}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                              placeholder="Leave blank to keep current password"
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                              disabled={isSavingEdit}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Must be at least 6 characters if you want to change it
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-2">
                                Shift Start
                              </label>
                              <input
                                type="time"
                                value={editForm.shiftStartTime || '19:00'}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, shiftStartTime: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                                disabled={isSavingEdit}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-2">
                                Shift End
                              </label>
                              <input
                                type="time"
                                value={editForm.shiftEndTime || '04:00'}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, shiftEndTime: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                                disabled={isSavingEdit}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-2">
                                Expected Hours
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={editForm.expectedWorkHours}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, expectedWorkHours: e.target.value }))}
                                placeholder="Optional"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                                disabled={isSavingEdit}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-2">
                                Timezone
                              </label>
                              <input
                                type="text"
                                value={editForm.timezone || 'Asia/Karachi'}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, timezone: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                                disabled={isSavingEdit}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
