import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAttendanceHistory, getAllAgents } from '../services/api';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AgentAttendanceSummaryTable from '../components/attendance/AgentAttendanceSummaryTable';
import AttendanceHistoryTable from '../components/attendance/AttendanceHistoryTable';

export default function AttendanceHistoryPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [agentsList, setAgentsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const canExport = ["admin", "manager"].includes(user?.role);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load agents for the dropdown once
      if (agentsList.length === 0) {
        const agents = await getAllAgents();
        setAgentsList(agents || []);
      }
      let start, end;
      const today = new Date();
      
      if (dateRange === 'today') {
        // "Today" means current shift-day (7 PM - 4 AM), so passing now for both bounds keeps it shift-aware.
        start = today.toISOString();
        end = today.toISOString();
      } else if (dateRange === '7days') {
        const d = new Date();
        // Inclusive range with today as one day => subtract 6
        d.setDate(d.getDate() - 6);
        start = d.toISOString();
        end = new Date().toISOString();
      } else if (dateRange === '30days') {
        const d = new Date();
        // Inclusive range with today as one day => subtract 29
        d.setDate(d.getDate() - 29);
        start = d.toISOString();
        end = new Date().toISOString();
      } else if (dateRange === 'custom' && customStart && customEnd) {
        start = new Date(customStart).toISOString();
        end = new Date(new Date(customEnd).setHours(23,59,59,999)).toISOString();
      }

      if (start && end) {
        const data = await getAttendanceHistory(start, end, agentFilter !== 'all' ? agentFilter : null);
        console.log(data);
        
        setLogs(data?.records || []);
        setSummary(data?.summary || null);
      }
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
      showNotification('Failed to load timesheets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [agentFilter, agentsList.length, customStart, customEnd, dateRange, showNotification]);

  useEffect(() => {
    if (dateRange !== 'custom' || (dateRange === 'custom' && customStart && customEnd)) {
      loadData();
    }
  }, [dateRange, customStart, customEnd, loadData]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateKey = (dateKey) => {
    if (!dateKey) return '—';
    const [year, month, day] = String(dateKey).split('-').map(Number);
    if (!year || !month || !day) return dateKey;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDurationMs = (ms) => {
    if (!ms || ms <= 0) return '0h 0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }

    const headers = ['Date', 'Agent Name', 'Email', 'Check In', 'Check Out', 'Total Shift (excluding breaks)', 'Break Time', 'Breaks Taken', 'Late / Half-day', 'Lost Hours', 'Compensation Hours'];
    const csvRows = filteredLogs.map(log => [
      log.dateKey,
      log.agent?.name || 'Unknown',
      log.agent?.email || '',
      formatTime(log.checkInAt),
      formatTime(log.checkOutAt) || (log.status === 'checked-in' ? 'Still working...' : '—'),
      formatDurationMs(log.shiftDurationMs),
      formatDurationMs(log.totalBreakMs),
      log.breaksTaken || 0,
      log.isHalfDay ? 'Half-day' : (log.isLate ? 'Late' : 'On-time'),
      log.lostHours > 0 ? log.lostHours.toFixed(2) : 0,
      log.compensationHours > 0 ? log.compensationHours.toFixed(2) : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheets-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Timesheets exported successfully', 'success');
  };

  const filteredLogs = logs.filter(log => {
    // 1. Search term
    const matchesSearch = log.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.agent?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Agent filter dropdown
    let matchesAgent = true;
    if (agentFilter !== 'all') {
      matchesAgent = log.agent?._id === agentFilter;
    }

    return matchesSearch && matchesAgent;
  });

  const filteredSummaryBySearch = useMemo(() => {
    const perAgent = summary?.perAgent || [];
    if (!searchTerm.trim()) return perAgent;

    const needle = searchTerm.toLowerCase();
    return perAgent.filter((item) => {
      return item.name?.toLowerCase().includes(needle) || item.email?.toLowerCase().includes(needle);
    });
  }, [searchTerm, summary?.perAgent]);

  return (
    <div className="space-y-6">
      <AttendanceHeader
        canExport={canExport}
        isLoading={isLoading}
        hasLogs={filteredLogs.length > 0}
        onExport={handleExportCSV}
      />

      <AttendanceFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        agentFilter={agentFilter}
        onAgentFilterChange={setAgentFilter}
        agentsList={agentsList}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
      />

      <AgentAttendanceSummaryTable
        rows={filteredSummaryBySearch}
        selectedAgentId={agentFilter}
        onSelectAgent={(agentId) => setAgentFilter((prev) => (prev === agentId ? 'all' : agentId))}
      />

      <AttendanceHistoryTable
        agentFilter={agentFilter}
        isLoading={isLoading}
        logs={filteredLogs}
        onClearAgentFilter={() => setAgentFilter('all')}
        formatDateKey={formatDateKey}
        formatTime={formatTime}
        formatDurationMs={formatDurationMs}
      />
    </div>
  );
}
