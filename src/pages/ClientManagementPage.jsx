import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useOutletContext } from "react-router-dom";
import { getAllAgents, updateUser } from "../services/api";
import ClientProfilePerformanceCard from "../components/ClientProfilePerformanceCard";
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Notebook, 
  Save, 
  Clock, 
  CalendarDays, 
  TrendingUp, 
  Package, 
  Lock, 
  Unlock, 
  Search, 
  X, 
  Edit, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sliders,
  DollarSign
} from "lucide-react";

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ClientManagementPage() {
  const { user } = useAuth();
  const { showNotification } = useOutletContext();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    website: "",
    businessAddress: "",
    city: "",
    state: "",
    country: "",
    profileNotes: "",
    pricingType: "per-lead",
    payPerLead: 150,
    packageQuantity: 0,
    packageCost: 0,
    lockUnlockConfig: "locked",
    availabilityCalendar: [],
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAgents({ includeClients: true });
      const filtered = Array.isArray(data) ? data.filter(u => u.role === "client") : [];
      setClients(filtered);
      if (filtered.length > 0 && !selectedClientId) {
        setSelectedClientId(filtered[0]._id);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
      showNotification("Could not retrieve client directory", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = clients.find(c => c._id === selectedClientId);

  const startEdit = () => {
    if (!selectedClient) return;
    
    // Normalize availability calendar
    const calendarMap = new Map(
      (selectedClient.availabilityCalendar || []).map(entry => [String(entry.day).toLowerCase(), entry])
    );
    
    const normalizedCalendar = DAYS_ORDER.map(day => {
      const entry = calendarMap.get(day);
      return {
        day,
        isAvailable: entry ? entry.isAvailable : true,
        slots: entry && entry.slots && entry.slots.length ? entry.slots.map(s => ({
          startTime: s.startTime || "09:00",
          endTime: s.endTime || "17:00",
        })) : [{ startTime: "09:00", endTime: "17:00" }]
      };
    });

    setForm({
      name: selectedClient.name || "",
      email: selectedClient.email || "",
      phoneNumber: selectedClient.phoneNumber || "",
      companyName: selectedClient.companyName || "",
      website: selectedClient.website || "",
      businessAddress: selectedClient.businessAddress || "",
      city: selectedClient.city || "",
      state: selectedClient.state || "",
      country: selectedClient.country || "",
      profileNotes: selectedClient.profileNotes || "",
      pricingType: selectedClient.pricingType || "per-lead",
      payPerLead: selectedClient.payPerLead ?? 150,
      packageQuantity: selectedClient.packageQuantity ?? 0,
      packageCost: selectedClient.packageCost ?? 0,
      lockUnlockConfig: selectedClient.lockUnlockConfig || "locked",
      availabilityCalendar: normalizedCalendar,
    });
    
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateCalendarEntry = (day, key, value) => {
    setForm(prev => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map(entry =>
        entry.day === day ? { ...entry, [key]: value } : entry
      )
    }));
  };

  const updateCalendarSlot = (day, slotIndex, key, value) => {
    setForm(prev => ({
      ...prev,
      availabilityCalendar: prev.availabilityCalendar.map(entry => {
        if (entry.day !== day) return entry;
        const nextSlots = entry.slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [key]: value } : slot
        );
        return { ...entry, slots: nextSlots };
      })
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;
    
    setIsSaving(true);
    try {
      await updateUser(selectedClientId, form);
      showNotification("Client profile updated successfully", "success");
      setIsEditing(false);
      await loadClients();
    } catch (err) {
      console.error("Failed to update client profile:", err);
      showNotification(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter client list
  const filteredClients = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.companyName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/50 to-indigo-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20 text-white">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                Client Directory Management
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Setup client specific pricing tiers, campaign lock configurations, and manage availability calendars.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Client List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search Header */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-cyan-500 text-xs shadow-xs transition"
            />
          </div>

          {/* Client List Grid */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs max-h-[600px] overflow-y-auto scrollbar-theme space-y-1.5">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
              ))
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                No clients found in directory
              </div>
            ) : (
              filteredClients.map((client) => {
                const isActive = client._id === selectedClientId;
                return (
                  <button
                    key={client._id}
                    onClick={() => {
                      setSelectedClientId(client._id);
                      setIsEditing(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left border ${
                      isActive 
                        ? "bg-primary-600 border-primary-600 text-white shadow-md" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="truncate space-y-0.5 pr-2">
                      <h4 className="font-semibold text-xs truncate">
                        {client.companyName || client.name}
                      </h4>
                      <p className={`text-[10px] truncate flex items-center gap-1 ${
                        isActive ? "text-slate-100" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        <Mail size={10} /> {client.email}
                      </p>
                    </div>
                    <ChevronRight size={14} className={isActive ? "text-white" : "text-slate-300 dark:text-slate-600"} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns: Performance Overview & Editing Drawer */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Dynamic Stats Overview Card */}
              <ClientProfilePerformanceCard clientId={selectedClientId} />

              {/* Profile details or Editor Pane */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-primary-500" />
                    <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                      {isEditing ? `Edit ${selectedClient.companyName || selectedClient.name}` : "Client Configurations"}
                    </h3>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={startEdit}
                      className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition border border-transparent"
                    >
                      <Edit size={12} />
                      Edit Settings
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-6">
                    {/* SECTION: Pricing and Lock Configuration */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-xl border border-slate-200/40 dark:border-slate-800/50 space-y-5">
                      <h4 className="font-semibold text-xs uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        Pricing & Lead Management defaults
                      </h4>
                      
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Lock / Unlock Setting */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                            Default Offer Lock Config
                          </label>
                          <select
                            value={form.lockUnlockConfig}
                            onChange={(e) => handleInputChange("lockUnlockConfig", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="locked">🔐 Locked (Awaiting Client Q3/Payment)</option>
                            <option value="unlocked">🔓 Unlocked (Pre-Paid/Instantly Unlocked)</option>
                          </select>
                          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Controls whether auto-offered leads are delivered locked or unlocked.
                          </p>
                        </div>

                        {/* Pricing Tier Select */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                            Billing Plan model
                          </label>
                          <select
                            value={form.pricingType}
                            onChange={(e) => handleInputChange("pricingType", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            <option value="per-lead">💵 Pay-Per-Lead Model</option>
                            <option value="package">📦 Package Subscription Model</option>
                          </select>
                        </div>

                        {/* Pricing details inputs */}
                        {form.pricingType === "per-lead" ? (
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                              Cost Per Lead ($ USD)
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input
                                type="number"
                                min="0"
                                value={form.payPerLead}
                                onChange={(e) => handleInputChange("payPerLead", Number(e.target.value))}
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                Package Volume (Leads Quantity)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={form.packageQuantity}
                                onChange={(e) => handleInputChange("packageQuantity", Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                Total Package Price ($ USD)
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                  type="number"
                                  min="0"
                                  value={form.packageCost}
                                  onChange={(e) => handleInputChange("packageCost", Number(e.target.value))}
                                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SECTION: Company Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-xs uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        Business & Contact Details
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          ["name", "Contact Person Name"],
                          ["email", "Billing Email Address"],
                          ["phoneNumber", "Phone Number"],
                          ["companyName", "Company Name"],
                          ["website", "Website URL"],
                          ["city", "City"],
                          ["state", "State/Province"],
                          ["country", "Country"],
                        ].map(([key, label]) => (
                          <div key={key}>
                            <label className="mb-2 block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {label}
                            </label>
                            <input
                              type="text"
                              value={form[key]}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                            />
                          </div>
                        ))}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Full Street Address
                          </label>
                          <input
                            type="text"
                            value={form.businessAddress}
                            onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Account Profile Notes
                          </label>
                          <textarea
                            value={form.profileNotes}
                            onChange={(e) => handleInputChange("profileNotes", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION: Availability Schedule Calendar */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-xs uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        Client Weekly Availability Calendar
                      </h4>

                      <div className="space-y-3">
                        {form.availabilityCalendar.map((entry) => (
                          <div
                            key={entry.day}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                                {entry.day}
                              </div>
                              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={entry.isAvailable}
                                  onChange={(e) =>
                                    updateCalendarEntry(entry.day, "isAvailable", e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                Available
                              </label>
                            </div>
                            
                            {entry.isAvailable && entry.slots.map((slot, slotIdx) => (
                              <div
                                key={`${entry.day}-${slotIdx}`}
                                className="mt-3 grid grid-cols-2 gap-3 items-center"
                              >
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      updateCalendarSlot(entry.day, slotIdx, "startTime", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      updateCalendarSlot(entry.day, slotIdx, "endTime", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="cursor-pointer px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:opacity-95 transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Save size={14} />
                        {isSaving ? "Saving Config..." : "Save Configuration"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Static view of client options */
                  <div className="space-y-6">
                    {/* Setup overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Pricing Tier Static Overview */}
                      <div className="p-5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/50 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Sliders size={14} className="text-primary-500" />
                          Delivery Configuration
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-500">Billing Model</span>
                            <span className="font-semibold text-slate-800 dark:text-white capitalize">
                              {selectedClient.pricingType === "package" ? "📦 Package Plan" : "💵 Pay Per Lead"}
                            </span>
                          </div>

                          {selectedClient.pricingType === "package" ? (
                            <>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Package Quantity</span>
                                <span className="font-semibold text-slate-800 dark:text-white">
                                  {selectedClient.packageQuantity || 0} Leads
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-500">Total Subscription Price</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  ${selectedClient.packageCost || 0} USD
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-500">Price per Unlocked Lead</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${selectedClient.payPerLead ?? 150} USD
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/35">
                            <span className="font-semibold text-slate-500">Default Lock Mode</span>
                            <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1">
                              {selectedClient.lockUnlockConfig === "unlocked" ? (
                                <>
                                  <Unlock size={13} className="text-emerald-500" />
                                  <span className="text-emerald-500">Auto-Unlocked</span>
                                </>
                              ) : (
                                <>
                                  <Lock size={13} className="text-amber-500" />
                                  <span className="text-amber-500">Locked (Approval Required)</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Business Static Overview */}
                      <div className="p-5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/50 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Building size={14} className="text-primary-500" />
                          Business Identity
                        </div>

                        <div className="space-y-2.5 text-xs">
                          {selectedClient.companyName && (
                            <div className="flex items-start gap-2">
                              <Building size={14} className="text-slate-400 mt-1 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-500 block text-[10px]">Company Name</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{selectedClient.companyName}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <Mail size={14} className="text-slate-400 mt-1 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-500 block text-[10px]">Primary Billing Contact</span>
                              <span className="font-semibold text-slate-800 dark:text-white">{selectedClient.name} ({selectedClient.email})</span>
                            </div>
                          </div>
                          {selectedClient.phoneNumber && (
                            <div className="flex items-start gap-2">
                              <Phone size={14} className="text-slate-400 mt-1 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-500 block text-[10px]">Business Phone</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{selectedClient.phoneNumber}</span>
                              </div>
                            </div>
                          )}
                          {selectedClient.website && (
                            <div className="flex items-start gap-2">
                              <Globe size={14} className="text-slate-400 mt-1 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-500 block text-[10px]">Website URL</span>
                                <a 
                                  href={selectedClient.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-primary-500 hover:underline font-semibold"
                                >
                                  {selectedClient.website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Address & profile Notes */}
                    {(selectedClient.businessAddress || selectedClient.profileNotes) && (
                      <div className="p-5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {selectedClient.businessAddress && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <MapPin size={13} />
                              Street Address
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {selectedClient.businessAddress}
                              {selectedClient.city && `, ${selectedClient.city}`}
                              {selectedClient.state && `, ${selectedClient.state}`}
                              {selectedClient.country && `, ${selectedClient.country}`}
                            </p>
                          </div>
                        )}
                        {selectedClient.profileNotes && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <Notebook size={13} />
                              Internal Account Notes
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 font-medium italic">
                              "{selectedClient.profileNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Availability calendar list */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <CalendarDays size={14} className="text-primary-500" />
                        Availability Schedule Slots
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(selectedClient.availabilityCalendar || []).map((entry) => (
                          <div
                            key={entry.day}
                            className={`p-3 rounded-lg border flex items-center justify-between transition ${
                              entry.isAvailable
                                ? "bg-emerald-50/25 dark:bg-emerald-950/5 border-emerald-100/40 dark:border-emerald-900/10 text-emerald-800 dark:text-emerald-300"
                                : "bg-slate-50 dark:bg-slate-900/40 border-transparent text-slate-400 dark:text-slate-600 opacity-60"
                            }`}
                          >
                            <span className="font-semibold capitalize text-xs">{entry.day}</span>
                            {entry.isAvailable ? (
                              <div className="flex flex-wrap gap-1 justify-end max-w-44">
                                {Array.isArray(entry.slots) && entry.slots.length > 0 ? (
                                  entry.slots.map((slot, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 font-medium rounded-md text-[10px]"
                                    >
                                      <Clock size={11} />
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] font-semibold bg-emerald-100/60 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                                    All Day Available
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium italic">Closed / Unavailable</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-96 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center gap-3">
              <Building className="h-10 w-10 text-slate-300 dark:text-slate-600 animate-pulse" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Select a client from directory to see details
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
