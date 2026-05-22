/**
 * Lead field configurations organized by role
 */

export const LEAD_FIELD_CONFIG = {
  common: [
    { key: 'businessName', label: 'Business Name', type: 'text', readOnly: false },
    { key: 'contactName', label: 'Contact Name', type: 'text', readOnly: false },
    { key: 'phoneNumber', label: 'Phone Number', type: 'tel', readOnly: true },
    { key: 'email', label: 'Email', type: 'email', readOnly: false },
    { key: 'businessAddress', label: 'Address', type: 'text', readOnly: false },
    { key: 'city', label: 'City', type: 'text', readOnly: false },
    { key: 'state', label: 'State', type: 'text', readOnly: false },
    { key: 'country', label: 'Country', type: 'text', readOnly: false },
  ],

  'caller-agent': [
    { key: 'leadFor', label: 'Lead For', type: 'text', readOnly: false },
    { key: 'currentSetup', label: 'Current Setup', type: 'textarea', readOnly: false },
    { key: 'servicesGetting', label: 'Services Getting', type: 'textarea', readOnly: false },
    { key: 'frequency', label: 'Frequency', type: 'text', readOnly: false },
    { key: 'currentChallenges', label: 'Current Challenges', type: 'textarea', readOnly: false },
    { key: 'interestLevel', label: 'Interest Level', type: 'select', options: ['cold', 'warm', 'hot'], readOnly: false },
    { key: 'agentNotes', label: 'Notes', type: 'textarea', readOnly: false },
    { key: 'appointmentDate', label: 'Appointment Date', type: 'date', readOnly: false },
    { key: 'appointmentTime', label: 'Appointment Time', type: 'time', readOnly: false },
  ],

  'closer-agent': [
    { key: 'website', label: 'Website', type: 'url', readOnly: false },
    { key: 'targetAreas', label: 'Target Areas', type: 'textarea', readOnly: false },
    { key: 'typeOfCleaning', label: 'Type of Cleaning', type: 'text', readOnly: false },
    { key: 'minimumFrequency', label: 'Minimum Frequency', type: 'text', readOnly: false },
    { key: 'targetIndustries', label: 'Target Industries', type: 'textarea', readOnly: false },
    { key: 'walkthroughAvailability', label: 'Walkthrough Availability', type: 'text', readOnly: false },
    { key: 'secondaryContact', label: 'Secondary Contact', type: 'text', readOnly: false },
    { key: 'formFilled', label: 'Form Filled', type: 'checkbox', readOnly: false },
    { key: 'emailResponse', label: 'Email Response', type: 'textarea', readOnly: false },
    { key: 'leadsSent', label: 'Leads Sent', type: 'number', readOnly: false },
    { key: 'onboardingStatus', label: 'Onboarding Status', type: 'text', readOnly: false },
    { key: 'upSell', label: 'Up-Sell', type: 'textarea', readOnly: false },
    { key: 'closerNotes', label: 'Closer Notes', type: 'textarea', readOnly: false },
  ],

  manager: 'all',

  managerOnly: [
    { key: 'managerNotes', label: 'Manager Notes', type: 'textarea', readOnly: false },
    { key: 'recordingLink', label: 'Recording Link', type: 'url', readOnly: false },
    { key: 'callQuality', label: 'Call Quality', type: 'select', options: ['average', 'below-average', 'best'], readOnly: false },
  ],
};

export const LEAD_WORKFLOW_FIELDS = [
  { key: 'dialerStatus', label: 'Dialer Status', type: 'select', options: ['pending', 'dialing', 'connected', 'failed', 'completed'], readOnly: true },
  { key: 'appointmentStatus', label: 'Appointment Status', type: 'select', options: ['qualified', 'disqualified', 'in-process', 'reschedule', 'onhold'], readOnly: false },
  { key: 'disposition', label: 'Disposition', type: 'select', options: ['voicemail', 'followup', 'not-interested', 'appointment', 'wrong-number'], readOnly: false },
  { key: 'agentNotes', label: 'Agent Notes', type: 'textarea', readOnly: false },
  { key: 'followUpDate', label: 'Follow-Up Date', type: 'date', readOnly: false },
  { key: 'followUpTime', label: 'Follow-Up Time', type: 'time', readOnly: false },
  { key: 'lastDialedAt', label: 'Last Dialed', type: 'datetime-local', readOnly: true },
];

export const getCallerVisibleFields = (role, edit = false) => {
  // FIX 4: use strict === everywhere instead of ==
  if ((role === 'manager' || role === 'admin') && edit) {
    return [
      ...LEAD_FIELD_CONFIG.common,
      ...LEAD_FIELD_CONFIG['caller-agent'],
      ...LEAD_WORKFLOW_FIELDS,
      ...LEAD_FIELD_CONFIG.managerOnly,
    ];
  }

  if (role === 'caller-agent' && edit) {
    return [
      ...LEAD_FIELD_CONFIG.common,
      ...LEAD_FIELD_CONFIG['caller-agent'],
      ...LEAD_WORKFLOW_FIELDS,
    ];
  }

  // FIX 5: removed unreachable dead-code return at bottom; this is now the fallback
  return [
    ...LEAD_FIELD_CONFIG.common,
    ...LEAD_FIELD_CONFIG['caller-agent'],
    ...LEAD_WORKFLOW_FIELDS,
    ...LEAD_FIELD_CONFIG.managerOnly,
  ];
};

export const getCloserVisibleFields = (role) => {
  // FIX 4 (continued): strict equality
  if (role === 'manager' || role === 'admin') {
    return [
      ...LEAD_FIELD_CONFIG.common,
      ...LEAD_FIELD_CONFIG['closer-agent'],
      ...LEAD_WORKFLOW_FIELDS,
      ...LEAD_FIELD_CONFIG.managerOnly,
    ];
  }

  if (role === 'closer-agent') {
    return [
      ...LEAD_FIELD_CONFIG.common,
      ...LEAD_FIELD_CONFIG['closer-agent'],
      ...LEAD_WORKFLOW_FIELDS,
    ];
  }

  return LEAD_FIELD_CONFIG.common;
};

export const getTableColumns = (role) => {
  const baseColumns = [
    { key: 'businessName', label: 'Business Name', width: 'w-48' },
    { key: 'businessAddress', label: 'Address', width: 'w-56' },
    { key: 'phoneNumber', label: 'Phone', width: 'w-28' },
  ];

  if (role === 'manager' || role === 'admin') {
    return [
      ...baseColumns,
      { key: 'assignedAgentName', label: 'Assigned Agent', width: 'w-32' },
    ];
  }

  // FIX 6: was `role !== 'manager' || role != 'admin'` (always true due to ||).
  // Corrected to && so this only runs for non-manager, non-admin roles.
  if (role !== 'manager' && role !== 'admin') {
    return [
      ...baseColumns,
      { key: 'dialerStatus', label: 'Dialer Status', width: 'w-24' },
    ];
  }

  return baseColumns;
};