import { Fragment } from "react";
import {
  Check,
  ChevronRight,
  Edit2,
  ExternalLink,
  History,
  Layers,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
  X,
  RotateCcw,
} from "lucide-react";

function RootCampaignRow({
  root,
  isExpanded,
  isSelected,
  onToggleParentSelection,
  onToggleExpanded,
  onUpload,
  onEdit,
  onDelete,
  onViewHistory,
  onRecycleVoicemails,
}) {
  return (
    <tr
      className={`group transition-colors ${
        isSelected
          ? "bg-primary-50/30 dark:bg-primary-900/10"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
      }`}
    >
      <td className="px-4 py-3">
        <div
          onClick={onToggleParentSelection}
          className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded border transition-colors ${
            isSelected
              ? "border-primary-600 bg-primary-600 text-white"
              : "border-slate-300 group-hover:border-primary-400 dark:border-slate-600"
          }`}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      </td>
      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpanded}
            className="rounded p-1 transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronRight
              className={`h-4 w-4 text-slate-400 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
          <span>{root.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            root.pipelineType === "caller"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          }`}
        >
          {root.pipelineType}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-400">-</td>
      <td className="px-4 py-3 text-slate-400">-</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {root.stats?.totalLeads || 0} Total
          </span>
          <span className="text-[10px] text-slate-500">
            {root.stats?.pendingLeads || 0} Pending
          </span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            {root.stats?.allTimeDialed || 0} Dialed All-Time
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-black text-primary-600 dark:text-primary-400">
            {root.stats?.dialedToday || 0}
          </span>
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
            Today
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onUpload}
            className="p-2 text-slate-400 transition hover:text-primary-600"
            title="Upload Leads"
          >
            <Upload className="h-4 w-4" />
          </button>
          {root.children?.length > 0 && (
            <button
              onClick={onRecycleVoicemails}
              className="p-2 text-slate-400 transition hover:text-emerald-600"
              title="Recycle Child Voicemails"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 transition hover:text-amber-600"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 transition hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ChildCampaignRow({
  child,
  isSelected,
  onToggleSelection,
  onViewLeads,
  onEdit,
  onRemoveAgents,
  onDelete,
  onViewHistory,
  onRecycleVoicemails,
}) {
  const assignmentLabel =
    child.dialerType === "auto"
      ? child.assignedAgent?.name || "Unassigned"
      : child.dialerType === "direct"
        ? "Shared Direct Dialer"
        : `${child.assignedAgents?.length || 0} Agents`;

  const dialerColor =
    child.dialerType === "auto"
      ? "text-emerald-600 dark:text-emerald-400"
      : child.dialerType === "direct"
        ? "text-cyan-600 dark:text-cyan-400"
        : "text-orange-600 dark:text-orange-400";

  return (
    <tr
      className={`group border-l-2 border-slate-200 transition-colors dark:border-slate-700 ${
        isSelected
          ? "bg-primary-50/30 dark:bg-primary-900/10"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
      }`}
    >
      <td className="relative px-4 py-2.5 pl-8">
        <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="absolute top-1/2 left-4 h-px w-4 bg-slate-200 dark:bg-slate-700" />
        <div
          onClick={onToggleSelection}
          className={`relative z-10 flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded border transition-colors ${
            isSelected
              ? "border-primary-600 bg-primary-600 text-white"
              : "border-slate-300 bg-white group-hover:border-primary-400 dark:border-slate-600 dark:bg-slate-800"
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5" />}
        </div>
      </td>
      <td className="px-4 py-2.5 pl-4">
        <button
          onClick={onViewLeads}
          className="font-medium text-slate-700 transition hover:text-primary-600 dark:text-slate-200"
        >
          {child.name}
        </button>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-xs font-medium capitalize text-slate-500">
          {child.pipelineType}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${dialerColor}`}
        >
          {child.dialerType}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            {child.dialerType === "auto" ? (
              <>
                <UserIcon className="h-3.5 w-3.5" />
                {assignmentLabel}
              </>
            ) : child.dialerType === "direct" ? (
              <>
                <Users className="h-3.5 w-3.5" />
                {assignmentLabel}
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5" />
                {assignmentLabel}
              </>
            )}
          </div>
          
          {child.agentHistory?.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(child);
              }}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-primary-600 transition-colors"
              title="View Dialing Summary"
            >
              <History className="h-3 w-3" />
              Summary ({child.agentHistory.length})
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {child.stats?.totalLeads || 0} Total
          </span>
          <span className="text-[10px] text-slate-500">
            {child.stats?.pendingLeads || 0} Pending
          </span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            {child.stats?.allTimeDialed || 0} Dialed All-Time
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-primary-600 dark:text-primary-400">
              {child.stats?.dialedToday || 0}
            </span>
            {child.stats?.isCompleted && (
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                Done
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
            Today
          </span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onViewLeads}
            className="p-1.5 text-slate-400 transition hover:text-primary-600"
            title="View Leads"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRecycleVoicemails}
            className="p-1.5 text-slate-400 transition hover:text-emerald-600"
            title="Recycle Voicemails"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 transition hover:text-amber-600"
            title="Assign/Edit"
          >
            <UserIcon className="h-3.5 w-3.5" />
          </button>
          {child.dialerType !== "direct" && (
            <button
              onClick={onRemoveAgents}
              className="p-1.5 text-slate-400 transition hover:text-slate-600"
              title="Unassign"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 transition hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CampaignsTable({
  campaigns,
  isLoading,
  expandedRootIds,
  selectedCampaignIds,
  onToggleParentSelection,
  onToggleChildSelection,
  onToggleExpanded,
  onUpload,
  onEdit,
  onDelete,
  onViewLeads,
  onRemoveAgents,
  onViewHistory,
  onRecycleVoicemails,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Campaign Name
              </th>
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Type
              </th>
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Dialer
              </th>
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Assignment
              </th>
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Leads
              </th>
              <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                Dialed
              </th>
              <th className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {campaigns.map((root) => {
              const isExpanded = expandedRootIds.has(root._id);
              const isSelected = selectedCampaignIds.includes(root._id);

              return (
                <Fragment key={root._id}>
                  <RootCampaignRow
                    root={root}
                    isExpanded={isExpanded}
                    isSelected={isSelected}
                    onToggleParentSelection={(event) =>
                      onToggleParentSelection(root, event)
                    }
                    onToggleExpanded={() => onToggleExpanded(root._id)}
                    onUpload={() => onUpload(root)}
                    onRecycleVoicemails={() => onRecycleVoicemails(root)}
                    onEdit={() => onEdit(root)}
                    onDelete={(event) => onDelete(root._id, event)}
                    onViewHistory={() => onViewHistory(root)}
                  />

                  {isExpanded &&
                    root.children.map((child) => (
                      <ChildCampaignRow
                        key={child._id}
                        child={child}
                        isSelected={selectedCampaignIds.includes(child._id)}
                        onToggleSelection={(event) =>
                          onToggleChildSelection(child._id, event)
                        }
                        onViewLeads={() => onViewLeads(child._id)}
                        onEdit={() => onEdit(child)}
                        onRemoveAgents={(event) =>
                          onRemoveAgents(child, event)
                        }
                        onDelete={() => onDelete(child._id)}
                        onViewHistory={onViewHistory}
                        onRecycleVoicemails={(event) => {
                          event.stopPropagation();
                          onRecycleVoicemails(child);
                        }}
                      />
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {campaigns.length === 0 && !isLoading && (
        <div className="p-20 text-center">
          <Layers className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No campaigns found
          </h3>
          <p className="mx-auto max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Create your first campaign to start organizing your leads and
            agents.
          </p>
        </div>
      )}
    </div>
  );
}
