import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { getAllAgents, updateUser } from '../services/api';
import UserCreationModal from '../components/modals/UserCreationModal';
import AgentManagementHeader from '../components/AgentManagementHeader';
import AgentTable from '../components/AgentTable';
import { SuccessMessage, EditErrorMessage } from '../components/AgentManagementMessages';

const DEFAULT_SHIFT_START_TIME = '19:00';
const DEFAULT_SHIFT_END_TIME = '04:00';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

export default function AgentManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [teamLeadFilter, setTeamLeadFilter] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    isActive: true,
    shiftStartTime: DEFAULT_SHIFT_START_TIME,
    shiftEndTime: DEFAULT_SHIFT_END_TIME,
    expectedWorkHours: '',
    timezone: DEFAULT_TIMEZONE,
    teamLead: '',
    assignedAgentIds: [],
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const getAvailableRoles = () => {
    if (user?.role === 'admin') {
      return ['admin', 'manager', 'caller-agent', 'closer-agent', 'scrapper', 'client'];
    } else if (user?.role === 'manager') {
      return ['caller-agent', 'closer-agent', 'scrapper', 'client'];
    } else if (user?.role === 'client') {
      return ['client'];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();
  const getSupervisorId = (userItem) => userItem?.teamLead?._id || userItem?.teamLead || '';
  const roleFilterOptions = Array.from(
    new Set(users.map((userItem) => userItem.role).filter(Boolean)),
  );
  const teamLeadFilterOptions = users
    .filter((userItem) => ['team-lead'].includes(userItem.role))
    .sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const supervisorId = getSupervisorId(u);
    const matchesTeamLead =
      !teamLeadFilter ||
      (teamLeadFilter === 'unassigned'
        ? !supervisorId
        : String(supervisorId) === String(teamLeadFilter));
    return matchesSearch && matchesRole && matchesTeamLead;
  });

  // Pagination logic
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);


  useEffect(() => {
    loadUsers();
  }, []);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, teamLeadFilter, pageSize]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getAllAgents({ includeClients: true });
      let filteredUsers = Array.isArray(data) ? data : [];
      
      if (user?.role === 'manager') {
        filteredUsers = filteredUsers.filter(
          u =>
            u.role === 'team-lead' ||
            u.role === 'caller-agent' ||
            u.role === 'closer-agent' ||
            u.role === 'scrapper' ||
            u.role === 'client'
        );
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserCreated = () => {
    loadUsers();
    setSuccessMessage('User created successfully');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEditStart = (user) => {
    setEditingUserId(user._id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || '',
      isActive: user.isActive ?? true,
      shiftStartTime: user.shiftStartTime || DEFAULT_SHIFT_START_TIME,
      shiftEndTime: user.shiftEndTime || DEFAULT_SHIFT_END_TIME,
      expectedWorkHours: user.expectedWorkHours ?? '',
      timezone: user.timezone || DEFAULT_TIMEZONE,
      teamLead: user.teamLead?._id || user.teamLead || '',
      assignedAgentIds: users
        .filter(u => u.teamLead && (u.teamLead?._id || u.teamLead) === user._id)
        .map(u => u._id),
    });
    setEditError('');
  };

  const handleEditCancel = () => {
    setEditingUserId(null);
    setEditForm({
      name: '',
      email: '',
      password: '',
      role: '',
      isActive: true,
      shiftStartTime: DEFAULT_SHIFT_START_TIME,
      shiftEndTime: DEFAULT_SHIFT_END_TIME,
      expectedWorkHours: '',
      timezone: DEFAULT_TIMEZONE,
      teamLead: '',
      assignedAgentIds: [],
    });
    setEditError('');
  };

  const handleEditSave = async (user) => {
    const trimmedName = editForm.name.trim();
    const trimmedEmail = editForm.email.trim().toLowerCase();

    if (!trimmedName) {
      setEditError('Name cannot be empty');
      return;
    }

    if (!trimmedEmail) {
      setEditError('Email cannot be empty');
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setEditError('Password must be at least 6 characters');
      return;
    }

    const payload = {};
    if (trimmedName !== (user.name || '')) payload.name = trimmedName;
    if (trimmedEmail !== (user.email || '').toLowerCase()) payload.email = trimmedEmail;
    if (editForm.password) payload.password = editForm.password;
    if (editForm.role && editForm.role !== user.role) payload.role = editForm.role;
    if (editForm.isActive !== (user.isActive ?? true)) {
      payload.isActive = editForm.isActive;
    }
    if ((editForm.shiftStartTime || DEFAULT_SHIFT_START_TIME) !== (user.shiftStartTime || DEFAULT_SHIFT_START_TIME)) {
      payload.shiftStartTime = editForm.shiftStartTime || DEFAULT_SHIFT_START_TIME;
    }
    if ((editForm.shiftEndTime || DEFAULT_SHIFT_END_TIME) !== (user.shiftEndTime || DEFAULT_SHIFT_END_TIME)) {
      payload.shiftEndTime = editForm.shiftEndTime || DEFAULT_SHIFT_END_TIME;
    }
    if ((editForm.timezone || DEFAULT_TIMEZONE) !== (user.timezone || DEFAULT_TIMEZONE)) {
      payload.timezone = editForm.timezone || DEFAULT_TIMEZONE;
    }
    const normalizedExpectedWorkHours = editForm.expectedWorkHours === '' ? null : Number(editForm.expectedWorkHours);
    const currentExpectedWorkHours = user.expectedWorkHours ?? null;
    if (normalizedExpectedWorkHours !== currentExpectedWorkHours) {
      payload.expectedWorkHours = normalizedExpectedWorkHours;
    }
    if (editForm.teamLead !== (user.teamLead?._id || user.teamLead || "")) {
      payload.teamLead = editForm.teamLead || null;
    }

    // Handle team member (re)assignment for team leads
    const prevAssigned = users
      .filter(u => u.teamLead && (u.teamLead?._id || u.teamLead) === user._id)
      .map(u => u._id);
    const nextAssigned = editForm.assignedAgentIds || [];
    const toAdd = nextAssigned.filter(id => !prevAssigned.includes(id));
    const toRemove = prevAssigned.filter(id => !nextAssigned.includes(id));

    if (Object.keys(payload).length === 0 && toAdd.length === 0 && toRemove.length === 0) {
      handleEditCancel();
      return;
    }

    setIsSavingEdit(true);
    try {
      // Save main user updates
      const updateResult = Object.keys(payload).length > 0
        ? await updateUser(user._id, payload)
        : { user };
      const updatedUser = updateResult?.user || updateResult;

      // Reassign team members if changed
      const reassignPromises = [
        ...toAdd.map(id => updateUser(id, { teamLead: user._id })),
        ...toRemove.map(id => updateUser(id, { teamLead: null })),
      ];
      if (reassignPromises.length > 0) await Promise.all(reassignPromises);

      // Refresh users so teamLead columns reflect changes
      if (reassignPromises.length > 0) await loadUsers();

      setUsers((prevUsers) =>
        prevUsers.map((existingUser) =>
          existingUser._id === user._id
            ? {
                ...existingUser,
                name: updatedUser?.name ?? payload.name ?? existingUser.name,
                email: updatedUser?.email ?? payload.email ?? existingUser.email,
                role: updatedUser?.role ?? payload.role ?? existingUser.role,
                isActive: updatedUser?.isActive ?? payload.isActive ?? existingUser.isActive,
                shiftStartTime: updatedUser?.shiftStartTime ?? payload.shiftStartTime ?? existingUser.shiftStartTime,
                shiftEndTime: updatedUser?.shiftEndTime ?? payload.shiftEndTime ?? existingUser.shiftEndTime,
                expectedWorkHours: updatedUser?.expectedWorkHours ?? payload.expectedWorkHours ?? existingUser.expectedWorkHours,
                timezone: updatedUser?.timezone ?? payload.timezone ?? existingUser.timezone,
                teamLead: updatedUser?.teamLead ?? payload.teamLead ?? existingUser.teamLead,
              }
            : existingUser
        )
      );

      setSuccessMessage('User details updated successfully');
      handleEditCancel();
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to update user:', error);
      setEditError(error?.response?.data?.error || 'Failed to update user details');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await api.delete(`/auth/agents/${user._id}`);

        setUsers(users.filter(u => u._id !== user._id));
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error) {
        console.error('Failed to delete user:', error);
        setEditError(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'caller-agent': 'Caller Agent',
      'closer-agent': 'Closer Agent',
      'scrapper': 'Scrapper',
      'team-lead': 'Team Lead',
      'client': 'Client',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-500/20 text-red-600 dark:text-red-400',
      'manager': 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      'caller-agent': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      'closer-agent': 'bg-green-500/20 text-green-600 dark:text-green-400',
      'scrapper': 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      'team-lead': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
      'client': 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    };
    return colors[role] || 'bg-slate-500/20 text-slate-600 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <AgentManagementHeader
          user={user}
          onCreate={() => setShowCreateModal(true)}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          roleFilterOptions={roleFilterOptions}
          teamLeadFilter={teamLeadFilter}
          setTeamLeadFilter={setTeamLeadFilter}
          teamLeadFilterOptions={teamLeadFilterOptions}
          getRoleLabel={getRoleLabel}
        />
      </div>

      <SuccessMessage message={successMessage} />


      <AgentTable
        users={paginatedUsers}
        allUsers={users}
        isLoadingUsers={isLoadingUsers}
        editForm={editForm}
        isSavingEdit={isSavingEdit}
        availableRoles={availableRoles}
        getRoleLabel={getRoleLabel}
        getRoleColor={getRoleColor}
        onEditStart={handleEditStart}
        onEditCancel={handleEditCancel}
        onEditSave={handleEditSave}
        onDeleteUser={handleDeleteUser}
        setEditForm={setEditForm}
        editError={editError}
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Showing {totalUsers === 0 ? 0 : (page - 1) * pageSize + 1}
          -{Math.min(page * pageSize, totalUsers)} of {totalUsers} users
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded border disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`px-2 py-1 rounded border ${page === i + 1 ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-2 py-1 rounded border disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
          <label className="ml-4 flex items-center gap-1 text-sm">
            <span>Rows per page:</span>
            <select
              className="px-2 py-1 rounded border focus:outline-none focus:ring focus:border-blue-400 bg-white dark:bg-slate-800 dark:text-white"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <EditErrorMessage error={editError && editingUserId ? editError : ""} />

      <UserCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreated}
        availableRoles={availableRoles}
        userRole={user?.role}
        allUsers={users}
      />
    </div>
  );
}
