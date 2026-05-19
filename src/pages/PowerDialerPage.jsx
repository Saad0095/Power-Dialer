import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDialer } from '../hooks/useDialer';
import SmartCampaignSelector from '../components/SmartCampaignSelector';
import DialerControls from '../components/DialerControls';
import CampaignClientDetailsCard from '../components/CampaignClientDetailsCard';
import { LeadsProvider } from '../context/LeadsContext';
import LeadsTable from '../components/LeadsTable';
import { getLeads } from '../services/api';
import { Zap } from 'lucide-react';
import SelectCampaignMsg from '../components/common/SelectCampaignMsg';

export default function PowerDialerPage() {
  const { showNotification } = useOutletContext();
  const { user } = useAuth();
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const { isDialing, setIsDialing, activeCalls } = useDialer(selectedCampaignId, showNotification);

  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadLeadCount = async () => {
      try {
        const response = await getLeads(selectedCampaignId, { page: 1, limit: 1 });
        setTotalLeads(response?.pagination?.total || 0);
      } catch {
        setTotalLeads(0);
      }
    };

    loadLeadCount();
  }, [selectedCampaignId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/30 p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-r from-cyan-500 to-blue-500 rounded p-2">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Power Dialer</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Rapid sequential dialing with callbacks for maximum efficiency</p>
          </div>
        </div>
      </div>

      {/* Campaign Selector */}
      <SmartCampaignSelector
        value={selectedCampaignId}
        onChange={setSelectedCampaignId}
        onShowNotification={showNotification}
        childDialerType="parallel"
        childOnly
      />

      {/* Power Dialer Controls & Layout */}
      {selectedCampaignId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DialerControls
              campaignId={selectedCampaignId}
              isDialing={isDialing}
              setIsDialing={setIsDialing}
              onError={(message) => showNotification(message, 'error')}
              onSuccess={(message) => showNotification(message, 'success')}
              totalLeads={totalLeads}
              isLoading={false}
              mode="power"
              agentId={user?._id}
            />

            {/* Active Calls */}
            {activeCalls && activeCalls.length > 0 && (
              <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-3">Active Calls: {activeCalls.length}</h3>
              </div>
            )}

            {/* Leads Display */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-4 px-1">Assigned Leads</h2>
              <LeadsProvider campaignId={selectedCampaignId}>
                <LeadsTable showNotification={showNotification} />
              </LeadsProvider>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <CampaignClientDetailsCard campaignId={selectedCampaignId} />
          </div>
        </div>
      )}

      {!selectedCampaignId && (
        <SelectCampaignMsg/>
      )}
    </div>
  );
}
