import { useEffect, useState } from 'react';
import { getCampaignById } from '../services/api';
import { Calendar, User, Mail, Phone, Clock, AlertCircle } from 'lucide-react';

const DAYS_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export default function CampaignClientDetailsCard({ campaignId }) {
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }

    const fetchCampaignDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCampaignById(campaignId);
        setCampaign(data);
      } catch (err) {
        console.error('Failed to fetch campaign client details:', err);
        setError('Could not load client details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg animate-pulse flex flex-col gap-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
        <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-950/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm font-medium">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  // Resolve client from campaign or parent campaign
  const client = campaign?.assignedClient || campaign?.parentCampaign?.assignedClient;

  if (!client) {
    return null; // No client assigned to this campaign
  }

  // Render availability
  const calendar = Array.isArray(client.availabilityCalendar) ? client.availabilityCalendar : [];
  const calendarMap = new Map(calendar.map(entry => [String(entry.day).toLowerCase(), entry]));

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/40 shadow-lg space-y-5">
      {/* Client Identity Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-md shadow-primary-500/20 text-white">
          <User size={22} />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded-full">
            Campaign Client
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {client.companyName ? `${client.companyName}` : client.name}
          </h3>
          {client.companyName && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Primary Contact: {client.name}
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats/Info */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {client.email && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 text-slate-700 dark:text-slate-300">
            <Mail size={14} className="text-slate-400" />
            <span className="truncate" title={client.email}>{client.email}</span>
          </div>
        )}
        {client.phoneNumber && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-700/30 text-slate-700 dark:text-slate-300">
            <Phone size={14} className="text-slate-400" />
            <span className="truncate">{client.phoneNumber}</span>
          </div>
        )}
      </div>

      {/* Availability Calendar */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Calendar size={13} className="text-slate-400" />
          Availability Calendar
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-theme">
          {DAYS_ORDER.map(dayName => {
            const dayEntry = calendarMap.get(dayName) || { isAvailable: false, slots: [] };
            const isAvailable = dayEntry.isAvailable;

            return (
              <div 
                key={dayName} 
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition border ${
                  isAvailable 
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100/35 dark:border-emerald-900/10' 
                    : 'bg-slate-100/10 dark:bg-slate-900/10 border-transparent opacity-60'
                }`}
              >
                <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                  {dayName.slice(0, 3)}
                </span>

                <div className="flex items-center gap-2">
                  {isAvailable ? (
                    <div className="flex flex-wrap gap-1 justify-end max-w-44">
                      {Array.isArray(dayEntry.slots) && dayEntry.slots.length > 0 ? (
                        dayEntry.slots.map((slot, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 font-medium rounded-md text-[10px]"
                          >
                            <Clock size={10} />
                            {slot.startTime} - {slot.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                          Available
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
