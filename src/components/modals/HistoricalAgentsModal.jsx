import Modal from '../common/Modal.jsx';
import { History, User as UserIcon } from 'lucide-react';

export default function HistoricalAgentsModal({ isOpen, onClose, campaign }) {
  const agents = campaign?.historicalAgents || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assignment History: ${campaign?.name}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex gap-3">
          <History className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            This list shows all agents who have previously dialed leads in this campaign. These agents are currently unassigned but have historical activity.
          </p>
        </div>

        {agents.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-theme">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {agents.map((agent) => (
                <div key={agent._id} className="flex items-center gap-3 py-3 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {agent.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                      Historical Agent
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <History className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 text-sm">No historical assignments found.</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
