import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import {
  uploadLeads,
  uploadMultipleLeads,
  getCampaignById,
  getCampaigns,
} from "../services/api";
import { useState, useContext, useEffect } from "react";
import { LeadsContext } from "../context/LeadsContext";

export default function FileUpload({
  campaignId,
  isLoading: externalLoading,
  onSuccess,
  onError,
  onLeadsChange,
  onUploadComplete,
  forceParentUpload = false,
  disableParentSelect = false,
}) {
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [isParentUpload, setIsParentUpload] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [importSummary, setImportSummary] = useState([]);
  const leadsCtx = useContext(LeadsContext);

  const summaryStorageKey = (parentId) =>
    `importSummary:${parentId || "global"}`;

  useEffect(() => {
    const parentIdToUse = selectedParent || campaignId || "global";
    try {
      const raw = sessionStorage.getItem(summaryStorageKey(parentIdToUse));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setImportSummary(parsed);
      }
    } catch (err) {}
  }, [selectedParent, campaignId]);

  useEffect(() => {
    async function fetchCampaign() {
      if (!campaignId) {
        setCampaign(null);
        return;
      }
      try {
        const data = await getCampaignById(campaignId);
        setCampaign(data || null);
      } catch (error) {
        setCampaign(null);
      }
    }
    fetchCampaign();

    (async () => {
      try {
        const all = await getCampaigns();
        const roots = Array.isArray(all) ? all : [];
        setParentOptions(roots);
      } catch (err) {
        setParentOptions([]);
      }
    })();

    if (forceParentUpload && campaignId) {
      setIsParentUpload(true);
      setSelectedParent(campaignId);
    }
  }, [campaignId]);

  const validateFile = (file) => {
    if (!file) {
      setFileError("No file selected");
      return false;
    }
    const fileName = file.name.toLowerCase();
    const validExtensions = [".csv", ".xlsx", ".xls"];
    if (!validExtensions.some((ext) => fileName.endsWith(ext))) {
      setFileError("Invalid file type. Only CSV and Excel files are allowed.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // Increased to 10MB
      setFileError("File size exceeds 10MB limit.");
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const isParentCampaign = forceParentUpload || isParentUpload || (campaign && !campaign.parentCampaign);

    for (const f of selectedFiles) {
      if (!validateFile(f)) {
        e.target.value = "";
        return;
      }
    }

    if (!campaignId && !selectedParent) {
      onError("Please select a campaign first");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setFileError("");
    setImportSummary([]);
    
    const parentIdToUse = selectedParent || campaignId;
    try {
      sessionStorage.removeItem(summaryStorageKey(parentIdToUse));
    } catch (err) {}

    try {
      if (isParentCampaign) {
        // Sequential upload to prevent CORS/Timeout issues on Hostinger VPS
        const allResults = [];
        const totalFiles = selectedFiles.length;
        
        for (let i = 0; i < totalFiles; i++) {
          const file = selectedFiles[i];
          setUploadProgress(((i) / totalFiles) * 100);
          
          try {
            // Upload one file at a time
            const response = await uploadMultipleLeads([file], parentIdToUse);
            let results = [];
            if (Array.isArray(response)) results = response;
            else if (Array.isArray(response?.data)) results = response.data;
            else if (Array.isArray(response?.results)) results = response.results;
            else if (Array.isArray(response?.data?.data)) results = response.data.data;
            
            allResults.push(...results);
          } catch (err) {
            allResults.push({
              file: file.name,
              imported: 0,
              reason: err.response?.data?.error || "Connection error or timeout"
            });
          }
          
          setUploadProgress(((i + 1) / totalFiles) * 100);
        }

        setImportSummary(allResults);
        try {
          sessionStorage.setItem(summaryStorageKey(parentIdToUse), JSON.stringify(allResults));
        } catch (err) {}
        onSuccess("Files processed - see summary below", null);
      } else {
        const file = selectedFiles[0];
        const response = await uploadLeads(
          file,
          campaignId,
          campaign?.assignedAgent?._id || campaign?.assignedAgent || undefined
        );
        const responseData = response?.data ?? response ?? null;
        onSuccess(responseData?.message || "Upload complete", responseData);
      }

      const refreshedCount = await onUploadComplete?.();
      if (typeof refreshedCount === "number" && onLeadsChange) onLeadsChange(refreshedCount);
      if (leadsCtx?.loadLeads) await leadsCtx.loadLeads();

    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to upload leads.";
      onError(errorMsg);
      setFileError(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        e.target.value = "";
      }, 1500);
    }
  };

  const handleOpenChildCampaign = (campaignId) => {
    if (campaignId) window.location.href = `/manager/leads?campaignId=${campaignId}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Upload Leads</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Importer v2.1</p>
        </div>
        <div className={`p-2 rounded-lg ${isUploading ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
          {isUploading ? <Loader className="w-5 h-5 text-primary-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {fileError && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">{fileError}</p>
        </div>
      )}

      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center bg-slate-50 dark:bg-slate-900/50 hover:border-primary-500 dark:hover:border-primary-500 transition-all cursor-pointer relative group">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={(!campaignId && !selectedParent) || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          multiple={isParentUpload || (campaign && !campaign.parentCampaign)}
        />
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700">
          <Upload className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-wide">Drop your files here</p>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-1 uppercase tracking-widest">CSV, XLSX, XLS (Max 10MB)</p>
        
        {isUploading && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-primary-600 uppercase">Processing Queue</span>
              <span className="text-[10px] font-black text-primary-600">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {!disableParentSelect && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isParentUpload ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {isParentUpload && <CheckCircle className="w-3 h-3" />}
              </div>
              <input
                type="checkbox"
                checked={isParentUpload}
                onChange={(ev) => setIsParentUpload(ev.target.checked)}
                className="hidden"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload to parent campaign</span>
            </label>

            {isParentUpload && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <select
                  value={selectedParent || ""}
                  onChange={(e) => setSelectedParent(e.target.value || null)}
                  className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold p-2.5 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- select parent campaign --</option>
                  {parentOptions.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
                  Each file (or sheet in Excel) will create a new child campaign under the selected parent.
                </p>
              </div>
            )}
          </div>
        )}

        {importSummary.length > 0 && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Processing Results</h3>
              <button
                onClick={() => {
                  setImportSummary([]);
                  try { sessionStorage.removeItem(summaryStorageKey(selectedParent || campaignId || "global")); } catch (err) {}
                }}
                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-tighter"
              >
                Clear History
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto scrollbar-theme">
              {importSummary.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{item.campaignName || item.file}</p>
                    {item.reason && <p className="text-[10px] font-bold text-rose-500">{item.reason}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">
                      {typeof item.imported === "number" ? `${item.imported} LEADS` : ""}
                    </span>
                    {item.campaignId && (
                      <button
                        onClick={() => handleOpenChildCampaign(item.campaignId)}
                        className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition shadow-lg shadow-primary-500/20"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExternalLink({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  );
}
