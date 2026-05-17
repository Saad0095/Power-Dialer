import React from "react";
import { Users } from "lucide-react";

export default function AgentManagementHeader({
  user,
  onCreate,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  roleFilterOptions,
  teamLeadFilter,
  setTeamLeadFilter,
  teamLeadFilterOptions,
  getRoleLabel,
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-linear-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {user?.role === 'admin'
              ? 'Manage all users: administrators, managers, and agents'
              : 'Manage agents and clients'}
          </p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 min-w-[180px]"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 min-w-[140px]"
        >
          <option value="">All Roles</option>
          {roleFilterOptions.map((r) => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
        </select>
        <select
          value={teamLeadFilter}
          onChange={e => setTeamLeadFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 min-w-[170px]"
        >
          <option value="">All Team Leads</option>
          <option value="unassigned">Unassigned</option>
          {teamLeadFilterOptions.map((teamLead) => (
            <option key={teamLead._id} value={teamLead._id}>
              {teamLead.name} ({getRoleLabel(teamLead.role)})
            </option>
          ))}
        </select>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-2 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
        >
          <span>+ Create User</span>
        </button>
      </div>
    </div>
  );
}
