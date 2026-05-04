import { AlertCircle, Upload, X } from "lucide-react";
import FileUpload from "../FileUpload";

export default function CampaignUploadModal({
  isOpen,
  campaign,
  failedRows,
  onClose,
  onDismissFailedRows,
  onSuccess,
  onError,
  onUploadComplete,
}) {
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-300">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Upload Leads: {campaign?.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <FileUpload
            campaignId={campaign?._id}
            forceParentUpload={true}
            disableParentSelect={true}
            onSuccess={onSuccess}
            onError={onError}
            onUploadComplete={onUploadComplete}
          />

          {failedRows.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
              <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100 px-4 py-2 dark:border-amber-900/50 dark:bg-amber-900/20">
                <span className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  {failedRows.length} Rows Skipped
                </span>
                <button
                  onClick={onDismissFailedRows}
                  className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-800"
                >
                  Dismiss
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-amber-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-amber-900/50 dark:text-amber-500/50">
                        Row
                      </th>
                      <th className="px-4 py-2 font-bold uppercase tracking-wider text-amber-900/50 dark:text-amber-500/50">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-amber-900/10">
                    {failedRows.map((failedRow, index) => (
                      <tr
                        key={index}
                        className="transition-colors hover:bg-white dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-2 font-bold text-slate-500">
                          {failedRow.row}
                        </td>
                        <td className="px-4 py-2 font-medium text-rose-500">
                          {failedRow.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-6 py-2 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
