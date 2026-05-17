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
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {user?.role === "admin"
              ? "Manage all users: administrators, managers, and agents"
              : "Manage agents and clients"}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-nowrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="h-9 px-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent sm:w-52"
        />

        {/* Selects + Button always on one row */}
        <div className="flex items-center gap-2 flex-nowrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {roleFilterOptions.map((r) => (
              <option key={r} value={r}>
                {getRoleLabel(r)}
              </option>
            ))}
          </select>

          <select
            value={teamLeadFilter}
            onChange={(e) => setTeamLeadFilter(e.target.value)}
            className="h-9 px-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
            className="cursor-pointer h-9 px-4 flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shadow-sm"
          >
            <span>+</span>
            <span>Create User</span>
          </button>
        </div>
      </div>
    </div>
  );
}