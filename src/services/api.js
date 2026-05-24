import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

export const clearAuthStorage = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

const notifyUnauthorized = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);

const getApiErrorMessage = (error, fallbackMessage) => {
  const serverMessage =
    error.response?.data?.error || error.response?.data?.message;
  const status = error.response?.status;

  if (serverMessage && status) {
    return `${fallbackMessage} (${status}): ${serverMessage}`;
  }

  if (serverMessage) {
    return `${fallbackMessage}: ${serverMessage}`;
  }

  if (status) {
    return `${fallbackMessage} (${status})`;
  }

  return `${fallbackMessage}: ${error.message}`;
};

// ==================== Authentication ====================

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} User data and token
 */
export const login = async (email, password) => {
  try {
    console.log("🔄 API: Attempting login for email:", email);
    const response = await api.post("/auth/login", { email, password });

    console.log("✅ API: Login successful", {
      user: response.data?.data?.user?.email,
      token: response.data?.data?.token?.substring(0, 20) + "...",
    });

    return response.data.data;
  } catch (error) {
    console.error("❌ API: Login failed", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data?.error,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    throw error;
  }
};

/**
 * Register a new agent (manager-only - disabled for now)
 * @param {string} email - Agent email
 * @param {string} password - Agent password
 * @param {string} name - Agent name
 * @returns {Promise} User data
 */
export const register = async (email, password, name) => {
  const response = await api.post("/auth/register", { email, password, name });
  return response.data.data;
};

/**
 * Get current authenticated user
 * @returns {Promise} Current user data
 */
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

/**
 * Create a new user (manager-only)
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @param {string} role - User role (manager or agent)
 * @returns {Promise} Created user data
 */
export const createUser = async (email, password, name, role = "agent", options = {}) => {
  const response = await api.post("/auth/create-user", {
    email,
    password,
    name,
    role,
    ...options,
  });
  return response.data.data;
};

/**
 * Get all agents (manager-only)
 * @param {{includeClients?: boolean}} options - Include client users when true
 * @returns {Promise} List of agents
 */
export const getAllAgents = async (options = {}) => {
  const includeClients = Boolean(options?.includeClients);
  const response = await api.get("/auth/agents", {
    params: includeClients ? { includeClients: true } : undefined,
  });
  return response.data.data;
};

/**
 * Get all users
 * @returns {Promise} List of all users
 */
export const getUsers = async () => {
  const response = await api.get("/auth/agents");
  return response.data.data;
};

/**
 * Update a user's editable fields
 * @param {string} userId - User ID
 * @param {{name?: string, email?: string}} updates - User updates
 * @returns {Promise} Updated user data
 */
export const updateUser = async (userId, updates) => {
  const response = await api.put(`/auth/users/${userId}`, updates);
  return response.data.data;
};

export const updateMyProfile = async (updates) => {
  const response = await api.put("/auth/me", updates);
  return response.data.data;
};

/**
 * Logout (client-side only)
 */
export const logout = () => {
  clearAuthStorage();
  notifyUnauthorized();
};

/**
 * Logout from backend - triggers auto-availability disable
 */
export const logoutFromBackend = async () => {
  try {
    const response = await api.post("/auth/logout");
    console.log("✅ Backend logout successful");
    return response.data;
  } catch (error) {
    console.error(
      "⚠️ Backend logout failed (frontend logout still completed):",
      error.message,
    );
    // Still clear local storage even if backend fails
    throw error;
  }
};

// ==================== Campaigns ====================

export const createCampaign = async (name, options = {}) => {
  const payload =
    typeof name === "object" && name !== null
      ? name
      : {
          name,
          pipelineType: options.pipelineType || "caller",
          ...(options.parentCampaign
            ? { parentCampaign: options.parentCampaign }
            : {}),
          ...(options.dialerType ? { dialerType: options.dialerType } : {}),
          ...(options.assignedAgent
            ? { assignedAgent: options.assignedAgent }
            : {}),
          ...(Array.isArray(options.assignedAgents)
            ? { assignedAgents: options.assignedAgents }
            : {}),
        };

  const response = await api.post("/campaigns", payload);
  return response.data.data;
};

export const getCampaigns = async (options = {}) => {
  const params = {};
  if (options?.includeSharedDirect) params.includeSharedDirect = true;
  if (options?.assignedToMeOnly) params.assignedToMeOnly = true;
  
  const response = await api.get("/campaigns", { params });
  return response.data.data;
};

export const getCampaignById = async (id) => {
  const response = await api.get(`/campaigns/${id}`);
  return response.data.data;
};

export const updateCampaign = async (id, updates) => {
  const response = await api.put(`/campaigns/${id}`, updates);
  return response.data.data;
};

export const getAgentCampaignStats = async () => {
  const response = await api.get("/campaigns/agent-stats");
  return response.data.data;
};

export const getClientProfileStats = async (clientId) => {
  const response = await api.get(`/campaigns/client-profile/${clientId}`);
  return response.data.data;
};

// // GET campaigns
// export const getCampaigns = async () => {
//   const res = await api.get("/campaigns");
//   return res.data;
// };

// BULK assign single agent
export const bulkAssignSingleAgentToCampaigns = async (payload = {}) => {
  const { campaignIds, agentId } = payload;
  const res = await api.put("/campaigns/bulk/assign-agent", {
    campaignIds,
    agentId,
  });
  return res.data;
};

// BULK assign agent pool
export const bulkAssignAgentPoolToCampaigns = async (payload = {}) => {
  const { campaignIds, agentIds, options = {} } = payload;
  const body = {
    campaignIds,
    agentIds,
    ...(options || {}), // e.g. maxConcurrentLines, assignmentStrategy
  };
  const res = await api.put("/campaigns/bulk/assign-agent-pool", body);
  return res.data;
};

// BULK clear assignments
export const bulkClearCampaignAssignments = async (payload = {}) => {
  const { campaignIds } = payload;
  const res = await api.put("/campaigns/bulk/clear-assignments", {
    campaignIds,
  });
  return res.data;
};

// // GET all agents (if needed)

// Only scrapper, managers, admin
export const getScraperManagersAndAdmins = async () => {
  const response = await api.get("/auth/scraper-managers-admins");
  return response.data.data;
};
//   const res = await api.get("/users/agents");
//   return res.data;
// };

export const deleteCampaign = async (id) => {
  await api.delete(`/campaigns/${id}`);
};

export const recycleVoicemails = async (id) => {
  const response = await api.post(`/campaigns/${id}/recycle-voicemails`);
  return response.data;
};

// ==================== Leads ====================

export const uploadLeads = async (file, campaignId, agentId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("campaignId", campaignId);
  if (agentId) formData.append("agentId", agentId);
  const response = await api.post("/caller-leads/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const uploadMultipleLeads = async (files, parentCampaignId) => {
  const formData = new FormData();
  for (const file of Array.from(files)) {
    formData.append("files", file);
  }
  formData.append("parentCampaignId", parentCampaignId);

  const response = await api.post("/caller-leads/upload-multi", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getLeadByPhone = async (phoneNumber) => {
  const response = await api.get(
    `/caller-leads/phone/${encodeURIComponent(phoneNumber)}`,
  );
  return response.data.data;
};

export const createLead = async (payload) => {
  const response = await api.post("/caller-leads", payload);
  return response.data.data;
};

export const getLeads = async (campaignId, options = {}) => {
  const {
    status = null,
    page = 1,
    limit = 20,
    search = null,
    disposition = null,
    appointmentStatus = null,
    confirmationStatus = null,
    agentId = null,
    clientId = null,
    assignedOnly = false,
    filterType = null,
    startDate = null,
    endDate = null,
    dateField = null,
  } = options;

  let url = `/caller-leads?page=${page}&limit=${limit}`;
  if (campaignId)
    url = `/caller-leads?campaignId=${campaignId}&page=${page}&limit=${limit}`;
  if (status) url += `&dialerStatus=${encodeURIComponent(status)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (disposition) url += `&disposition=${encodeURIComponent(disposition)}`;
  if (appointmentStatus)
    url += `&appointmentStatus=${encodeURIComponent(appointmentStatus)}`;
  if (confirmationStatus)
    url += `&confirmationStatus=${encodeURIComponent(confirmationStatus)}`;
  if (agentId) url += `&agentId=${encodeURIComponent(agentId)}`;
  if (clientId) url += `&clientId=${encodeURIComponent(clientId)}`;
  if (assignedOnly) url += `&assignedOnly=true`;
  if (filterType) url += `&filterType=${encodeURIComponent(filterType)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  if (dateField) url += `&dateField=${encodeURIComponent(dateField)}`;

  console.log("Calling.." , url);
  
  const response = await api.get(url);
  return {
    leads: response.data.data || [],
    pagination: response.data.pagination || {
      total: 0,
      page,
      limit,
      totalPages: 0,
    },
    stats: response.data.stats || {
      scopedTotal: 0,
      interested: 0,
      appointments: 0,
      followupsScheduled: 0,
      byDialerStatus: {},
      byDisposition: {},
      byAppointmentStatus: {},
    },
  };
};

export const getLead = async (id) => {
  try {
    const response = await api.get(`/caller-leads/${id}`);
    return response.data.data;
  } catch (error) {
    const normalizedError = new Error(
      getApiErrorMessage(error, "Failed to load lead"),
    );
    normalizedError.status = error.response?.status;
    normalizedError.details = error.response?.data;
    throw normalizedError;
  }
};

export const updateQualificationStatus = async (id, status) => {
  const response = await api.patch(`/caller-leads/${id}/qualification`, {
    appointmentStatus: status,
  });
  return response.data.data;
};

export const requestAppointmentConfirmation = async (id) => {
  const response = await api.post(`/caller-leads/${id}/confirm-appointment`);
  return response.data.data;
};

export const updateLead = async (id, updates) => {
  const response = await api.put(`/caller-leads/${id}`, updates);
  return response.data.data;
};

export const deleteLead = async (id) => {
  const response = await api.delete(`/caller-leads/${id}`);
  return response.data;
};

export const bulkDeleteLeads = async (leadIds) => {
  const response = await api.delete("/caller-leads/bulk", {
    data: { leadIds },
  });
  return response.data;
};

export const updateDisposition = async (id, updates) => {
  const response = await api.patch(`/caller-leads/${id}/disposition`, updates);
  return response.data.data;
};

export const updateQualification = async (id, updates) => {
  const response = await api.patch(
    `/caller-leads/${id}/qualification`,
    updates,
  );
  return response.data.data;
};

export const getAllowedQualifications = async (leadId) => {
  const response = await api.get(
    `/caller-leads/${leadId}/allowed-qualifications`,
  );
  return response.data.data;
};

// ==================== Power Hour ====================

export const getPowerHourStatus = async () => {
  const response = await api.get("/power-hour/status");
  return response.data.data;
};

export const startPowerHour = async (
  durationMinutes = 60,
  pipelineType = "all",
) => {
  const response = await api.post("/power-hour/start", {
    durationMinutes,
    pipelineType,
  });
  return response.data.data;
};

export const stopPowerHour = async () => {
  const response = await api.post("/power-hour/stop");
  return response.data.data;
};

// ==================== Dialer ====================

export const startDialing = async (campaignId, agentId = null, isManual = false) => {
  const payload = { campaignId, isManual };
  if (agentId) payload.agentId = agentId;
  const response = await api.post("/dialer/start", payload);
  return response.data;
};

export const startAgentAutoDialing = async (campaignId, agentId) => {
  const response = await api.post("/dialer/start", { campaignId, agentId });
  return response.data;
};

export const stopDialing = async (campaignId, agentId = null) => {
  const payload = { campaignId };
  if (agentId) payload.agentId = agentId;
  const response = await api.post("/dialer/stop", payload);
  return response.data;
};

export const stopAgentAutoDialing = async (campaignId, agentId) => {
  const response = await api.post("/dialer/stop", { campaignId, agentId });
  return response.data;
};

export const completeCampaign = async (campaignId) => {
  const response = await api.post(`/campaigns/${campaignId}/complete`);
  return response.data;
};

export const pauseDialing = async (campaignId, agentId = null, isManual = false) => {
  const payload = { campaignId, isManual };
  if (agentId) payload.agentId = agentId;
  const response = await api.post("/dialer/pause", payload);
  return response.data;
};

export const resumeDialing = async (campaignId, agentId = null, isManual = false) => {
  const payload = { campaignId, isManual };
  if (agentId) payload.agentId = agentId;
  const response = await api.post("/dialer/resume", payload);
  return response.data;
};

export const getDialerStatus = async (campaignId) => {
  const response = await api.get(`/dialer/status?campaignId=${campaignId}`);
  return response.data.data;
};

export const getAgentAutoDialerStatus = async (campaignId, agentId) => {
  const response = await api.get(
    `/dialer/status?campaignId=${campaignId}&agentId=${agentId}`,
  );
  return response.data.data;
};

export const getCallLogs = async (campaignId) => {
  const response = await api.get(`/dialer/calls?campaignId=${campaignId}`);
  return response.data.data;
};

export const logAgentCallAttempt = async ({
  campaignId = null,
  leadId = null,
  phoneNumber = null,
  platform = "zoom",
  outcome = "no-answer",
}) => {
  const response = await api.post("/dialer/calls/agent-attempt", {
    campaignId,
    leadId,
    phoneNumber,
    platform,
    outcome,
  });

  return response.data.data;
};

// export const logDirectCall = async ({
//   phoneNumber,
//   agentId,
//   campaignId = null,
//   provider = "zoom",
//   outcome = "no-answer",
// }) => {
//   const response = await api.post("/call-logs", {
//     phoneNumber,
//     agentId,
//     campaignId,
//     provider,
//     mode: "direct",
//     outcome,
//   });

//   return response.data.data;
// };

export const getDailyAgentCallCounts = async (hours = 12, date = null) => {
  const sanitizedHours = Number.isFinite(Number(hours))
    ? Math.max(1, Math.min(72, Math.floor(Number(hours))))
    : 12;

  const queryParams = date
    ? `?date=${encodeURIComponent(date)}`
    : `?hours=${sanitizedHours}`;
  const response = await api.get(
    `/dialer/calls/daily-agent-counts${queryParams}`,
  );

  return response.data.data;
};

// ==================== Call Management ====================

/**
 * Complete a call with disposition and notes
 * @param {string} leadId - Lead ID
 * @param {object} data - Call completion data
 * @returns {Promise} Updated lead, callLog, and agent
 */
export const completeCall = async (leadId, data) => {
  const response = await api.patch(`/caller-leads/${leadId}/disposition`, {
    disposition: data.disposition,
    agentNotes: data.agentNotes,
    followUpDate: data.followUpDate,
    followUpTime: data.followUpTime,
    contactName: data.contactName,
    businessAddress: data.businessAddress,
    city: data.city,
    state: data.state,
    country: data.country,
    email: data.email,
    appointmentDate: data.appointmentDate,
    appointmentTime: data.appointmentTime,
    leadFor: data.leadFor,
    date: data.date,
    currentSetup: data.currentSetup,
    servicesGetting: data.servicesGetting,
    frequency: data.frequency,
    currentChallenges: data.currentChallenges,
    interestLevel: data.interestLevel,
  });
  return response.data.data;
};

/**
 * Schedule a callback for a lead
 * @param {string} leadId - Lead ID
 * @param {string} followUpDate - ISO date string
 * @returns {Promise} Updated lead with followUpDate
 */
export const scheduleCallback = async (leadId, followUpDate) => {
  const response = await api.patch(`/caller-leads/${leadId}/disposition`, {
    followUpDate,
  });
  return response.data.data;
};

/**
 * Cancel a scheduled callback
 * @param {string} leadId - Lead ID
 * @returns {Promise} Updated lead
 */
export const cancelCallback = async (leadId) => {
  const response = await api.patch(`/caller-leads/${leadId}/disposition`, {
    followUpDate: null,
    disposition: "followup",
  });
  return response.data.data;
};

// ==================== Agent Management ====================

/**
 * Get available agents
 * @returns {Promise} List of available agents
 */
export const getAvailableAgents = async () => {
  const response = await api.get("/auth/agents/available");
  return response.data.data;
};

/**
 * Update agent availability status
 * @param {string} agentId - Agent ID
 * @param {boolean} isAvailable - Availability status
 * @returns {Promise} Updated agent
 */
export const updateAgentAvailability = async (agentId, isAvailable) => {
  const response = await api.put(`/auth/agents/${agentId}/availability`, {
    isAvailable,
  });
  return response.data.data;
};

export const setMyDirectCallStatus = async (inCall, provider = "direct") => {
  const response = await api.put("/auth/me/call-status", { inCall, provider });
  return response.data.data;
};

export const checkIn = async () => {
  const response = await api.post("/auth/attendance/check-in");
  return response.data.data;
};

export const checkOut = async () => {
  const response = await api.post("/auth/attendance/check-out");
  return response.data.data;
};

export const startBreak = async () => {
  const response = await api.post("/auth/attendance/break/start");
  return response.data.data;
};

export const endBreak = async () => {
  const response = await api.post("/auth/attendance/break/end");
  return response.data.data;
};

export const getMyAttendance = async () => {
  const response = await api.get("/auth/attendance/me");
  return response.data.data;
};

export const managerCheckInAgent = async (agentId) => {
  const response = await api.post(
    `/auth/attendance/agents/${agentId}/check-in`,
  );
  return response.data.data;
};

export const managerCheckOutAgent = async (agentId) => {
  const response = await api.post(
    `/auth/attendance/agents/${agentId}/check-out`,
  );
  return response.data.data;
};

export const managerStartAgentBreak = async (agentId) => {
  const response = await api.post(
    `/auth/attendance/agents/${agentId}/break/start`,
  );
  return response.data.data;
};

export const managerEndAgentBreak = async (agentId) => {
  const response = await api.post(
    `/auth/attendance/agents/${agentId}/break/end`,
  );
  return response.data.data;
};

/**
 * Get historical attendance reports (Manager only)
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} agentId - Optional agent ID filter
 */
export const getAttendanceHistory = async (
  startDate,
  endDate,
  agentId = null,
) => {
  let url = `/auth/attendance/history?`;
  if (startDate) url += `startDate=${encodeURIComponent(startDate)}&`;
  if (endDate) url += `endDate=${encodeURIComponent(endDate)}&`;
  if (agentId) url += `agentId=${agentId}&`;

  const response = await api.get(url);
  return response.data.data;
};

/**
 * Get agent statistics
 * @returns {Promise} List of agents with stats
 */
export const getAgentStats = async () => {
  const response = await api.get("/auth/agents/stats");
  return response.data.data;
};

// ==================== Lead Assignment ====================

/**
 * Assign a single lead to an agent
 * @param {string} leadId - Lead ID
 * @param {string} agentId - Agent ID
 * @returns {Promise} Updated lead
 */
export const assignLead = async (leadId, agentId) => {
  const response = await api.put(`/caller-leads/${leadId}`, {
    assignedCaller: agentId,
  });
  return response.data.data;
};

/**
 * Assign multiple leads to an agent
 * @param {array} leadIds - Array of lead IDs
 * @param {string} agentId - Agent ID
 * @returns {Promise} Assignment result
 */
export const assignLeadsToAgent = async (leadIds, agentId) => {
  const results = [];
  for (const leadId of leadIds) {
    const response = await api.put(`/caller-leads/${leadId}`, {
      assignedCaller: agentId,
    });
    results.push(response.data.data);
  }
  return results;
};

// ==================== Scraper ====================

export const startScrapeSession = async (payload) => {
  const response = await api.post("/scraper/start", payload);
  return response.data.data;
};

export const getScrapeSessions = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `/scraper/sessions${queryParams ? `?${queryParams}` : ""}`;
  const response = await api.get(url);
  return response.data.data;
};

export const getScrapeSession = async (sessionId) => {
  const response = await api.get(`/scraper/sessions/${sessionId}`);
  return response.data.data;
};

export const getScrapeSessionResults = async (sessionId, params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = `/scraper/sessions/${sessionId}/results${queryParams ? `?${queryParams}` : ""}`;
  const response = await api.get(url);
  return response.data.data;
};

export const getDailyScrapeLeads = async (days = 1) => {
  const params = days && days > 1 ? `?days=${days}` : "";
  const response = await api.get(`/scraper/sessions/daily-leads${params}`);
  return response.data.data;
};

export const importScrapeSessionResults = async (sessionId, payload) => {
  const response = await api.post(
    `/scraper/sessions/${sessionId}/import`,
    payload,
  );
  return response.data;
};

export const deleteScrapeSession = async (sessionId) => {
  const response = await api.delete(`/scraper/sessions/${sessionId}`);
  return response.data;
};

export const cancelScrapeSession = async (sessionId) => {
  const response = await api.post(`/scraper/sessions/${sessionId}/cancel`);
  return response.data;
};

export const updateScrapeSession = async (sessionId, payload) => {
  const response = await api.put(`/scraper/sessions/${sessionId}`, payload);
  return response.data.data;
};

// ==================== Earnings ====================

/**
 * Get agent earnings summary
 * @param {string} agentId
 * @param {string} [timeframe] - all | month | week | today
 * @param {string} [campaignId]
 */
export const getAgentEarningsSummary = async ({
  agentId,
  timeframe = "all",
  campaignId,
}) => {
  const params = new URLSearchParams();
  if (timeframe) params.append("timeframe", timeframe);
  if (campaignId) params.append("campaignId", campaignId);
  const response = await api.get(
    `/earnings/summary/${agentId}?${params.toString()}`,
  );
  return response.data.data;
};

/**
 * Get agent earnings leaderboard
 * @param {string} [campaignId]
 * @param {string} [timeframe]
 * @param {number} [limit]
 */
export const getAgentEarningsLeaderboard = async ({
  campaignId,
  timeframe = "all",
  limit = 10,
  month,
} = {}) => {
  const params = new URLSearchParams();
  if (campaignId) params.append("campaignId", campaignId);
  if (timeframe) params.append("timeframe", timeframe);
  if (limit) params.append("limit", limit);
  if (month) params.append("month", month);
  const response = await api.get(`/earnings/leaderboard?${params.toString()}`);
  return response.data.data;
};

/**
 * Get agent qualification breakdown
 * @param {string} agentId
 * @param {string} [campaignId]
 */
export const getQualificationBreakdown = async ({ agentId, campaignId }) => {
  const params = new URLSearchParams();
  if (campaignId) params.append("campaignId", campaignId);
  const response = await api.get(
    `/earnings/breakdown/${agentId}?${params.toString()}`,
  );
  return response.data.data;
};

export const getMonthlyEarningsHistory = async ({ agentId, month } = {}) => {
  const params = new URLSearchParams();
  if (agentId) params.append("agentId", agentId);
  if (month) params.append("month", month);
  const response = await api.get(
    `/earnings/monthly-history?${params.toString()}`,
  );
  return response.data.data;
};

export const getDetailedEarningsHistory = async ({
  agentId,
  month,
  page = 1,
  limit = 20,
} = {}) => {
  const params = new URLSearchParams();
  if (agentId) params.append("agentId", agentId);
  if (month) params.append("month", month);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  const response = await api.get(`/earnings/history?${params.toString()}`);
  return response.data; // Return full data object as it includes pagination
};

// ==================== Client Lead Marketplace ====================

export const getQualifiedLeadsPool = async ({
  search = "",
  appointmentStatus = "",
  page = 1,
  limit = 10,
} = {}) => {
  const response = await api.get("/manager/offers/qualified-leads", {
    params: {
      ...(search ? { search } : {}),
      ...(appointmentStatus ? { appointmentStatus } : {}),
      page,
      limit,
    },
  });

  return response.data.data;
};

export const createClientOffer = async (payload) => {
  const response = await api.post("/manager/offers", payload);
  return response.data.data;
};

export const getManagerOffers = async ({
  status = "",
  clientId = "",
  search = "",
  page = 1,
  limit = 10,
} = {}) => {
  const response = await api.get("/manager/offers", {
    params: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
      ...(search ? { search } : {}),
      page,
      limit,
    },
  });

  return response.data.data;
};

export const cancelManagerOffer = async (offerId) => {
  const response = await api.patch(`/manager/offers/${offerId}/cancel`);
  return response.data.data;
};

export const unlockManagerOffer = async (offerId) => {
  const response = await api.patch(`/manager/offers/${offerId}/unlock`);
  return response.data.data;
};

export const getClientOffers = async ({
  status = "",
  page = 1,
  limit = 10,
} = {}) => {
  const response = await api.get("/client/offers", {
    params: {
      ...(status ? { status } : {}),
      page,
      limit,
    },
  });

  return response.data.data;
};

export const getClientOffer = async (offerId) => {
  const response = await api.get(`/client/offers/${offerId}`);
  return response.data.data;
};

export const acceptClientOffer = async (offerId) => {
  const response = await api.post(`/client/offers/${offerId}/accept`);
  return response.data.data;
};

export const rejectClientOffer = async (offerId) => {
  const response = await api.post(`/client/offers/${offerId}/reject`);
  return response.data.data;
};

// ==================== Notifications ====================

export const getRecentNotifications = async (limit = 5) => {
  const response = await api.get(`/notifications/recent?limit=${limit}`);
  return response.data;
};

export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const params = new URLSearchParams({ page, limit });
  if (unreadOnly) params.append('unreadOnly', 'true');
  const response = await api.get(`/notifications?${params.toString()}`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default api;
