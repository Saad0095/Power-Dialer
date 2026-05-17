/**
 * Role utility functions for RBAC authorization
 * New role system: 'admin', 'manager', 'caller-agent', 'closer-agent'
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CALLER_AGENT: 'caller-agent',
  CLOSER_AGENT: 'closer-agent',
  SCRAPPER: 'scrapper',
  TEAM_LEAD: 'team-lead',
  CLIENT: 'client',
};

export const AGENT_ROLES = [ROLES.CALLER_AGENT, ROLES.TEAM_LEAD];
export const ATTENDANCE_ROLES = [
  ROLES.CALLER_AGENT,
  ROLES.CLOSER_AGENT,
  ROLES.SCRAPPER,
  ROLES.TEAM_LEAD,
];

/**
 * Check if user is any type of agent (caller-agent or closer-agent)
 */
export const isAgent = (role) => {
  return AGENT_ROLES.includes(role);
};

/**
 * Check if user is a caller agent (handles initial outbound calls)
 */
export const isCallerAgent = (role) => {
  return role === ROLES.CALLER_AGENT;
};

/**
 * Check if user is a closer agent (handles follow-ups and closures)
 */
export const isCloserAgent = (role) => {
  return role === ROLES.CLOSER_AGENT;
};

export const isClient = (role) => {
  return role === ROLES.CLIENT;
};

export const isScrapper = (role) => {
  return role === ROLES.SCRAPPER;
};

export const isTeamLead = (role) => {
  return role === ROLES.TEAM_LEAD;
};

export const canUseAttendanceControls = (role) => {
  return ATTENDANCE_ROLES.includes(role);
};

/**
 * Check if user is a manager or admin (same permissions)
 */
export const isManager = (role) => {
  return role === ROLES.MANAGER || role === ROLES.ADMIN || role === ROLES.TEAM_LEAD;
};

/**
 * Get the home route for a given role
 */
export const getRoleHomeRoute = (role) => {
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) return '/manager';
  if (role === ROLES.TEAM_LEAD) return '/manager'; // Team leads use manager dashboard but filtered
  if (isCallerAgent(role)) return '/agent';
  if (isScrapper(role)) return '/scrapper';
  if (isClient(role)) return '/client';
  return '/login';
};
